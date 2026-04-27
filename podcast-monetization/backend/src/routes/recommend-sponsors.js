/**
 * POST /api/recommend-sponsors
 * Stage 2 + 3: Audience Intelligence → Sponsor Scoring → AI Ranking
 */

const express = require('express');
const router = express.Router();
const { buildAudienceIntelligencePrompt } = require('../prompts/audience-intelligence');
const { scoreSponsor, buildSponsorRecommendationPrompt } = require('../prompts/sponsor-recommendation');
const { runPrompt } = require('../lib/claude');
const { SPONSORS } = require('../lib/sponsors');

// In-memory podcast profiles (replace with DB in production)
const PODCAST_PROFILES = {};

router.post('/', async (req, res) => {
  const { podcast_id, num_recommendations = 5, exclude_categories = [], podcast_profile } = req.body;

  if (!podcast_profile && !PODCAST_PROFILES[podcast_id]) {
    return res.status(400).json({
      error: 'podcast_profile required for first-time recommendation. Provide full podcast data.',
    });
  }

  const profile = podcast_profile || PODCAST_PROFILES[podcast_id];
  if (podcast_profile) PODCAST_PROFILES[podcast_id] = podcast_profile;

  try {
    // Stage 2: Audience Intelligence
    const audiencePrompt = buildAudienceIntelligencePrompt(profile);
    const audienceProfile = await runPrompt(audiencePrompt, 'audience-intelligence', { temperature: 0.3 });

    // Filter sponsors by exclusions and audience size
    const eligibleSponsors = SPONSORS.filter(s =>
      !exclude_categories.some(exc => s.category.toLowerCase().includes(exc.toLowerCase())) &&
      s.min_listeners <= profile.avg_listeners
    );

    // Algorithmic scoring — top 20 candidates
    const scoredCandidates = eligibleSponsors
      .map(s => ({
        ...s,
        algorithmic_score: scoreSponsor(s, audienceProfile, profile.avg_listeners),
      }))
      .sort((a, b) => b.algorithmic_score - a.algorithmic_score)
      .slice(0, 20);

    // Stage 3: AI overlay ranking
    const sponsorPrompt = buildSponsorRecommendationPrompt(audienceProfile, scoredCandidates);
    const rankingResult = await runPrompt(sponsorPrompt, 'sponsor-ranking', { temperature: 0.4 });

    return res.json({
      podcast_id,
      audience_profile: audienceProfile,
      sponsors: rankingResult.sponsors.slice(0, num_recommendations),
    });
  } catch (err) {
    console.error('/api/recommend-sponsors error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
