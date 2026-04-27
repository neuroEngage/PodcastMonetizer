/**
 * Stage 3: Sponsor Recommendation Prompt
 * Combines algorithmic scoring with AI overlay for final ranking.
 * gstack-style: structured candidates → AI ranks + explains.
 * <!-- v1.0 sponsor-recommendation -->
 */

/**
 * Score a sponsor against an audience profile (algorithmic layer).
 * @param {Object} sponsor - Sponsor from DB
 * @param {Object} audienceProfile - Output from Stage 2
 * @param {number} listenerCount - Avg listeners per episode
 * @returns {number} Composite score 0-100
 */
function scoreSponsor(sponsor, audienceProfile, listenerCount) {
  // Category match: does sponsor vertical appear in ideal_sponsor_verticals?
  const verticals = audienceProfile.ideal_sponsor_verticals || [];
  const categoryMatch = verticals.some(v =>
    v.toLowerCase().includes(sponsor.category.toLowerCase()) ||
    sponsor.category.toLowerCase().includes(v.toLowerCase())
  ) ? 1.0 : 0.3;

  // Size match: audience in sponsor's preferred range?
  const min = sponsor.min_listeners || 0;
  const max = sponsor.max_listeners || Infinity;
  const sizeMatch = listenerCount >= min && listenerCount <= max ? 1.0 : 0.4;

  // Budget fit: potential deal value relative to sponsor avg deal size
  const potentialDeal = (sponsor.avg_cpm || 20) * listenerCount / 1000;
  const budgetFit = Math.min(potentialDeal / (sponsor.typical_deal_size || 2000), 1.0);

  // Weighted composite
  const score = (categoryMatch * 0.5) + (sizeMatch * 0.3) + (budgetFit * 0.2);
  return Math.round(score * 100);
}

/**
 * Build the AI overlay prompt for final sponsor ranking.
 * @param {Object} audienceProfile - Stage 2 output
 * @param {Array} scoredCandidates - Top 20 sponsors with algorithmic scores
 * @returns {string} Claude prompt
 */
function buildSponsorRecommendationPrompt(audienceProfile, scoredCandidates) {
  return `<role>
You are a podcast partnership director who has matched thousands of sponsors with podcasts. You know that algorithmic scoring misses crucial fit signals: brand tone, audience values alignment, seasonal timing, and whether a product would actually convert with this specific audience.
</role>

<task>
Given this podcast's audience profile and 20 pre-scored sponsor candidates, select and rank the TOP 5 sponsors. For each, explain WHY they're a good match in concrete commercial terms — not just "audiences overlap."
</task>

<audience_profile>
${JSON.stringify(audienceProfile, null, 2)}
</audience_profile>

<sponsor_candidates>
${JSON.stringify(scoredCandidates, null, 2)}
</sponsor_candidates>

<criteria>
For each recommended sponsor:
- The audience must have a REAL reason to buy their product (not just demographic overlap)
- The sponsor must be in a budget tier that matches the podcast's reach
- Brand values should not clash with the audience's psychographic traits
- Consider seasonal relevance (if applicable)
- Penalize sponsors whose typical deal size is < 50% of the podcast's revenue potential
</criteria>

<constraints>
- Return EXACTLY 5 sponsors — no more, no fewer
- fit_score must be 0-100
- match_reason must be 1-2 sentences, commercially specific ("Their target customer IS this listener" not "audiences align")
- est_deal_value_monthly must be realistic: CPM × avg_listeners × episodes_per_month × num_ad_slots
- outreach_angle: the ONE angle that would resonate most in a cold pitch to THIS sponsor
</constraints>

<output_format>
Return ONLY valid JSON:
{
  "sponsors": [
    {
      "name": "string",
      "category": "string",
      "fit_score": number,
      "match_reason": "string",
      "est_deal_value_monthly": number,
      "avg_cpm": number,
      "contact": "string",
      "outreach_angle": "string — the specific hook that makes this pitch land"
    }
  ]
}
</output_format>`;
}

module.exports = { scoreSponsor, buildSponsorRecommendationPrompt };
