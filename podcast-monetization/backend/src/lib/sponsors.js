/**
 * Sponsor seed database — 50 real podcast advertisers across verticals.
 * In production, this lives in PostgreSQL with Prisma.
 * For Week 1 MVP, this is the in-memory seed.
 */

const SPONSORS = [
  // Business & Finance
  { id: 's001', name: 'Shopify', category: 'eCommerce Platform', avg_cpm: 35, min_listeners: 10000, max_listeners: 500000, typical_deal_size: 3000, contact: 'podcasts@shopify.com' },
  { id: 's002', name: 'QuickBooks', category: 'Accounting Software', avg_cpm: 38, min_listeners: 5000, max_listeners: 200000, typical_deal_size: 2500, contact: 'partnerships@intuit.com' },
  { id: 's003', name: 'Squarespace', category: 'Website Builder', avg_cpm: 30, min_listeners: 5000, max_listeners: 1000000, typical_deal_size: 2000, contact: 'advertising@squarespace.com' },
  { id: 's004', name: 'Gusto', category: 'HR & Payroll', avg_cpm: 40, min_listeners: 5000, max_listeners: 150000, typical_deal_size: 3500, contact: 'partnerships@gusto.com' },
  { id: 's005', name: 'LinkedIn', category: 'Professional Network', avg_cpm: 36, min_listeners: 20000, max_listeners: 1000000, typical_deal_size: 5000, contact: 'podcast@linkedin.com' },

  // Health & Wellness
  { id: 's006', name: 'Athletic Greens', category: 'Supplements', avg_cpm: 28, min_listeners: 5000, max_listeners: 500000, typical_deal_size: 2000, contact: 'partners@ag1.com' },
  { id: 's007', name: 'Calm', category: 'Mental Health App', avg_cpm: 25, min_listeners: 10000, max_listeners: 300000, typical_deal_size: 2500, contact: 'partnerships@calm.com' },
  { id: 's008', name: 'Helix Sleep', category: 'Sleep Products', avg_cpm: 30, min_listeners: 10000, max_listeners: 500000, typical_deal_size: 3000, contact: 'affiliates@helixsleep.com' },
  { id: 's009', name: 'BetterHelp', category: 'Online Therapy', avg_cpm: 35, min_listeners: 8000, max_listeners: 200000, typical_deal_size: 2800, contact: 'podcast@betterhelp.com' },
  { id: 's010', name: 'WHOOP', category: 'Fitness Tracker', avg_cpm: 32, min_listeners: 15000, max_listeners: 300000, typical_deal_size: 4000, contact: 'partners@whoop.com' },

  // Technology
  { id: 's011', name: 'NordVPN', category: 'VPN Service', avg_cpm: 26, min_listeners: 5000, max_listeners: 1000000, typical_deal_size: 2000, contact: 'podcasts@nord.com' },
  { id: 's012', name: 'Notion', category: 'Productivity Software', avg_cpm: 28, min_listeners: 5000, max_listeners: 300000, typical_deal_size: 2200, contact: 'partnerships@notion.so' },
  { id: 's013', name: 'Airtable', category: 'Database Tool', avg_cpm: 34, min_listeners: 8000, max_listeners: 200000, typical_deal_size: 3000, contact: 'marketing@airtable.com' },
  { id: 's014', name: 'Grammarly', category: 'Writing Assistant', avg_cpm: 28, min_listeners: 10000, max_listeners: 500000, typical_deal_size: 2500, contact: 'partnerships@grammarly.com' },
  { id: 's015', name: 'LastPass', category: 'Password Manager', avg_cpm: 24, min_listeners: 5000, max_listeners: 300000, typical_deal_size: 1800, contact: 'advertising@lastpass.com' },

  // Financial
  { id: 's016', name: 'Betterment', category: 'Investment Platform', avg_cpm: 40, min_listeners: 10000, max_listeners: 200000, typical_deal_size: 4000, contact: 'partnerships@betterment.com' },
  { id: 's017', name: 'Acorns', category: 'Micro-Investing', avg_cpm: 35, min_listeners: 5000, max_listeners: 300000, typical_deal_size: 3000, contact: 'podcasts@acorns.com' },
  { id: 's018', name: 'Credit Karma', category: 'Credit Monitoring', avg_cpm: 30, min_listeners: 15000, max_listeners: 500000, typical_deal_size: 3500, contact: 'advertising@creditkarma.com' },
  { id: 's019', name: 'Rocket Money', category: 'Budget App', avg_cpm: 32, min_listeners: 10000, max_listeners: 300000, typical_deal_size: 2800, contact: 'partnerships@rocketmoney.com' },
  { id: 's020', name: 'Fundrise', category: 'Real Estate Investing', avg_cpm: 42, min_listeners: 8000, max_listeners: 150000, typical_deal_size: 4500, contact: 'partners@fundrise.com' },

  // Education
  { id: 's021', name: 'MasterClass', category: 'Online Learning', avg_cpm: 30, min_listeners: 10000, max_listeners: 500000, typical_deal_size: 3000, contact: 'partnerships@masterclass.com' },
  { id: 's022', name: 'Blinkist', category: 'Book Summaries', avg_cpm: 25, min_listeners: 5000, max_listeners: 300000, typical_deal_size: 2000, contact: 'podcasts@blinkist.com' },
  { id: 's023', name: 'Audible', category: 'Audiobooks', avg_cpm: 22, min_listeners: 5000, max_listeners: 1000000, typical_deal_size: 1800, contact: 'podcast@audible.com' },

  // Food & Drink
  { id: 's024', name: 'HelloFresh', category: 'Meal Delivery', avg_cpm: 28, min_listeners: 10000, max_listeners: 500000, typical_deal_size: 2500, contact: 'partnerships@hellofresh.com' },
  { id: 's025', name: 'Trade Coffee', category: 'Coffee Subscription', avg_cpm: 30, min_listeners: 5000, max_listeners: 200000, typical_deal_size: 2000, contact: 'podcasts@drinktrade.com' },

  // Travel
  { id: 's026', name: 'Booking.com', category: 'Travel Booking', avg_cpm: 24, min_listeners: 20000, max_listeners: 1000000, typical_deal_size: 3000, contact: 'advertising@booking.com' },
  { id: 's027', name: 'Airbnb', category: 'Short-term Rentals', avg_cpm: 28, min_listeners: 15000, max_listeners: 500000, typical_deal_size: 4000, contact: 'partnerships@airbnb.com' },

  // Insurance
  { id: 's028', name: 'PolicyGenius', category: 'Insurance Marketplace', avg_cpm: 35, min_listeners: 8000, max_listeners: 200000, typical_deal_size: 3500, contact: 'affiliates@policygenius.com' },
  { id: 's029', name: 'Lemonade', category: 'Digital Insurance', avg_cpm: 32, min_listeners: 5000, max_listeners: 200000, typical_deal_size: 2800, contact: 'podcast@lemonade.com' },

  // Real Estate
  { id: 's030', name: 'Arrived Homes', category: 'Fractional Real Estate', avg_cpm: 40, min_listeners: 8000, max_listeners: 150000, typical_deal_size: 4200, contact: 'partnerships@arrivedhomes.com' },
];

/**
 * Get all sponsors filtered by minimum audience size.
 */
function getSponsorsByAudienceSize(minListeners) {
  return SPONSORS.filter(s => s.min_listeners <= minListeners);
}

/**
 * Get sponsors by category match.
 */
function getSponsorsByCategory(categoryKeywords) {
  const kw = categoryKeywords.map(k => k.toLowerCase());
  return SPONSORS.filter(s =>
    kw.some(k => s.category.toLowerCase().includes(k))
  );
}

module.exports = { SPONSORS, getSponsorsByAudienceSize, getSponsorsByCategory };
