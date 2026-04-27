/**
 * Podcast Monetization Helper — Express Backend
 * Node.js + Express REST API wrapping the 5-stage AI pipeline
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Route handlers
const analyzeEpisode = require('./routes/analyze-episode');
const recommendSponsors = require('./routes/recommend-sponsors');
const generatePitch = require('./routes/generate-pitch');
const authRoutes = require('./routes/auth');
const analysesRoutes = require('./routes/analyses');
const paymentRoutes = require('./routes/payments');
const authenticateToken = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Stripe webhook must be parsed as raw body BEFORE express.json
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json({ limit: '2mb' })(req, res, next);
  }
});

// Rate limiting — protect against Claude API cost overruns
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { error: 'Too many requests. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/analyses', analysesRoutes);
app.use('/api/payments', paymentRoutes); // other payment routes

// Protected AI routes
app.use('/api/analyze-episode', authenticateToken, analyzeEpisode);
app.use('/api/recommend-sponsors', authenticateToken, recommendSponsors);
app.use('/api/generate-pitch', authenticateToken, generatePitch);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    anthropic_key_set: !!process.env.ANTHROPIC_API_KEY,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎙️  Podcast Monetization API running on http://localhost:${PORT}`);
  console.log(`   Anthropic API key: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing — set ANTHROPIC_API_KEY'}`);
});

module.exports = app;
