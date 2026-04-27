const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback');
const db = require('../lib/db');
const authenticateToken = require('../middleware/auth');

const prices = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_123',
  growth: process.env.STRIPE_PRICE_GROWTH || 'price_growth_456',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro_789'
};

// POST /api/payments/checkout
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!prices[plan]) return res.status(400).json({ error: 'Invalid plan selected' });

    let stripeCustomerId = user.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email });
      stripeCustomerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(stripeCustomerId, user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: prices[plan], quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payments/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test');
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const priceId = subscription.items.data[0].price.id;

    let newTier = 'starter';
    if (priceId === prices.growth) newTier = 'growth';
    else if (priceId === prices.pro) newTier = 'pro';

    try {
      db.prepare('UPDATE users SET tier = ? WHERE stripe_customer_id = ?').run(newTier, customerId);
      console.log(`Updated user tier to ${newTier} for customer ${customerId}`);
    } catch (dbErr) {
      console.error('DB Update Error in webhook:', dbErr);
    }
  }

  res.json({ received: true });
});

module.exports = router;
