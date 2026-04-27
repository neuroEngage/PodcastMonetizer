/**
 * Stage 5: Pricing Engine
 * Formula-based CPM calculator with AI validation layer.
 * <!-- v1.0 pricing-engine -->
 */

/**
 * Industry CPM benchmarks by category (2024 data)
 */
const CPM_BENCHMARKS = {
  'Business': 32,
  'Finance': 35,
  'Technology': 28,
  'Health & Wellness': 27,
  'True Crime': 26,
  'News': 22,
  'Politics': 20,
  'Comedy': 18,
  'Sports': 22,
  'Education': 24,
  'Society & Culture': 20,
  'Science': 25,
  'History': 22,
  'Arts': 16,
  'Music': 15,
  'Kids & Family': 18,
  'Fiction': 14,
  'Default': 20,
};

/**
 * Calculate the recommended CPM and rate range.
 * @param {Object} params - Podcast and audience data
 * @returns {Object} Pricing recommendation
 */
function calculatePricing(params) {
  const {
    category,
    avgListeners,
    audienceQualityScore,     // 0-100 from Stage 2
    engagementRateBonus = 1.0, // 1.0-1.3 (listener retention data if available)
    isExclusive = false,        // category exclusivity premium
    dealType = 'mid-roll',
    episodesPerMonth = 4,
  } = params;

  // Base CPM from category benchmark
  const benchmarkCpm = CPM_BENCHMARKS[category] || CPM_BENCHMARKS['Default'];

  // Audience quality multiplier: 0.7–1.5 based on 0-100 score
  // Score 50 = 1.0x, Score 100 = 1.5x, Score 0 = 0.7x
  const audienceQualityMultiplier = 0.7 + (audienceQualityScore / 100) * 0.8;

  // Exclusivity premium: 1.0 or 1.4
  const exclusivityPremium = isExclusive ? 1.4 : 1.0;

  // Deal type modifier
  const dealTypeModifier = {
    'pre-roll': 0.7,     // pre-roll typically commands less
    'mid-roll': 1.0,     // mid-roll is the gold standard
    'host-read': 1.3,    // host-read premium
    'post-roll': 0.5,
    'exclusive': 1.5,
    'banner': 0.3,
  }[dealType] || 1.0;

  // Size discount for very large audiences (CPM drops slightly at scale)
  const sizeModifier = avgListeners > 100000 ? 0.85
    : avgListeners > 50000 ? 0.92
    : avgListeners > 10000 ? 1.0
    : avgListeners > 5000 ? 1.05  // small but niche premium
    : 0.8;

  // Final CPM calculation
  const baseCpm = benchmarkCpm
    * audienceQualityMultiplier
    * engagementRateBonus
    * exclusivityPremium
    * dealTypeModifier
    * sizeModifier;

  // Round to nearest 0.50
  const recommendedCpm = Math.round(baseCpm * 2) / 2;

  // Rate ranges (floor = 70% of recommended, ceiling = 140%)
  const rateFloorCpm = Math.round(recommendedCpm * 0.70 * 2) / 2;
  const rateCeilingCpm = Math.round(recommendedCpm * 1.40 * 2) / 2;

  // Per-episode deal value
  const perEpisodeRate = (recommendedCpm * avgListeners) / 1000;
  const monthlyRate = perEpisodeRate * episodesPerMonth;

  return {
    recommended_cpm: recommendedCpm,
    cpm_floor: rateFloorCpm,
    cpm_ceiling: rateCeilingCpm,
    per_episode_rate: Math.round(perEpisodeRate),
    monthly_rate: Math.round(monthlyRate),
    rate_floor_monthly: Math.round((rateFloorCpm * avgListeners / 1000) * episodesPerMonth),
    rate_ceiling_monthly: Math.round((rateCeilingCpm * avgListeners / 1000) * episodesPerMonth),
    benchmark_cpm: benchmarkCpm,
    audience_quality_multiplier: Math.round(audienceQualityMultiplier * 100) / 100,
    exclusivity_premium: exclusivityPremium,
    calculation_breakdown: {
      formula: 'base_cpm × audience_quality_mult × engagement_bonus × exclusivity × deal_type_mod × size_mod',
      benchmark_cpm: benchmarkCpm,
      audience_quality_multiplier: Math.round(audienceQualityMultiplier * 100) / 100,
      engagement_rate_bonus: engagementRateBonus,
      exclusivity_premium: exclusivityPremium,
      deal_type_modifier: dealTypeModifier,
      size_modifier: sizeModifier,
    },
  };
}

/**
 * Build the AI pricing validation prompt.
 * @param {Object} pricingResult - Output from calculatePricing
 * @param {Object} podcastData - Podcast profile
 * @returns {string} Claude prompt
 */
function buildPricingValidationPrompt(pricingResult, podcastData) {
  return `<role>
You are a podcast advertising consultant who has negotiated hundreds of deals. You know when a rate is fair, when it's leaving money on the table, and when it would kill a deal before it starts. You validate pricing recommendations with market reality.
</role>

<task>
Review this algorithmically calculated pricing recommendation and validate whether it's market-realistic. Flag any issues and provide your final recommendation.
</task>

<pricing_recommendation>
${JSON.stringify(pricingResult, null, 2)}
</pricing_recommendation>

<podcast_context>
${JSON.stringify(podcastData, null, 2)}
</podcast_context>

<validation_criteria>
- Is the CPM within ±40% of the category benchmark? (benchmark: $${pricingResult.benchmark_cpm})
- Does the audience quality score justification hold up?
- Would a real sponsor agree to pay this rate for this audience?
- Is the floor low enough to close a deal? Is the ceiling high enough to be aspirational?
- Any red flags (e.g., a $3 CPM for a business podcast is suspect; a $80 CPM for a comedy podcast is fantasy)?
</validation_criteria>

<output_format>
Return ONLY valid JSON:
{
  "validated": true | false,
  "confidence": "high | medium | low",
  "adjustments": {
    "recommended_cpm": number | null,
    "monthly_rate": number | null
  },
  "validation_notes": "string — what's right and what to flag",
  "negotiation_strategy": "string — 2-3 sentences on how to position the rate in a pitch"
}
</output_format>`;
}

module.exports = { calculatePricing, buildPricingValidationPrompt, CPM_BENCHMARKS };
