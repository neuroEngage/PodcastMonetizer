/**
 * POST /api/generate-pitch
 * Stage 4 + 5: Pricing Engine → Pitch Generation
 */

const express = require('express');
const router = express.Router();
const { buildPitchGenerationPrompt } = require('../prompts/pitch-generation');
const { calculatePricing, buildPricingValidationPrompt } = require('../prompts/pricing-engine');
const { buildAudienceIntelligencePrompt } = require('../prompts/audience-intelligence');
const { runPrompt } = require('../lib/claude');

// In-memory podcast profiles (replace with DB in production)
const PODCAST_PROFILES = {};

router.post('/', async (req, res) => {
  const {
    podcast_id,
    podcast_profile,
    sponsor_name,
    sponsor_category,
    deal_type = 'host-read',
    episodes_per_month = 4,
    is_exclusive = false,
    match_reason,
  } = req.body;

  if (!sponsor_name) return res.status(400).json({ error: 'sponsor_name is required' });

  const profile = podcast_profile || PODCAST_PROFILES[podcast_id];
  if (!profile) return res.status(400).json({ error: 'podcast_profile required' });
  if (podcast_profile) PODCAST_PROFILES[podcast_id] = podcast_profile;

  try {
    // Stage 2: Get audience profile (needed for pitch)
    const audiencePrompt = buildAudienceIntelligencePrompt(profile);
    const audienceProfile = await runPrompt(audiencePrompt, 'audience-intelligence', { temperature: 0.3 });

    // Stage 5: Calculate pricing
    const pricingResult = calculatePricing({
      category: profile.category,
      avgListeners: profile.avg_listeners,
      audienceQualityScore: audienceProfile.audience_quality_score,
      dealType: deal_type,
      episodesPerMonth: episodes_per_month,
      isExclusive: is_exclusive,
    });

    // AI pricing validation
    const validationPrompt = buildPricingValidationPrompt(pricingResult, profile);
    const validationResult = await runPrompt(validationPrompt, 'pricing-validation', { temperature: 0.2 });

    // Use validated rate if adjusted, else use calculated rate
    const finalRate = validationResult.adjustments?.monthly_rate || pricingResult.monthly_rate;
    const finalCpm = validationResult.adjustments?.recommended_cpm || pricingResult.recommended_cpm;

    // Stage 4: Generate pitch
    const pitchPrompt = buildPitchGenerationPrompt({
      podcastName: profile.name,
      podcastCategory: profile.category,
      avgListeners: profile.avg_listeners,
      audienceProfile,
      sponsorName: sponsor_name,
      sponsorCategory: sponsor_category || 'Brand',
      matchReason: match_reason || audienceProfile.ideal_sponsor_verticals?.join(', '),
      dealType: deal_type,
      episodesPerMonth: episodes_per_month,
      recommendedRate: finalRate,
      rateFloor: pricingResult.rate_floor_monthly,
      rateCeiling: pricingResult.rate_ceiling_monthly,
    });

    const pitchResult = await runPrompt(pitchPrompt, 'pitch-generation', { temperature: 0.5, maxTokens: 2048 });

    return res.json({
      podcast_id,
      sponsor_name,
      subject_line: pitchResult.subject_line,
      email_body: pitchResult.email_body,
      follow_up: pitchResult.follow_up_template,
      recommended_rate: finalRate,
      recommended_cpm: finalCpm,
      rate_range: {
        floor: pricingResult.rate_floor_monthly,
        ceiling: pricingResult.rate_ceiling_monthly,
      },
      pricing_breakdown: pricingResult.calculation_breakdown,
      pitch_strength_score: pitchResult.pitch_strength_score,
      pitch_strength_reasoning: pitchResult.pitch_strength_reasoning,
      pricing_validation: validationResult,
    });
  } catch (err) {
    console.error('/api/generate-pitch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
