/**
 * Stage 2: Audience Intelligence Prompt
 * gstack-style multi-role prompt for profiling podcast audience
 * and identifying purchase intent signals.
 * <!-- v1.0 audience-intelligence -->
 */

/**
 * Build the audience intelligence prompt.
 * @param {Object} podcastData - Podcast profile metadata
 * @returns {string} Assembled Claude prompt
 */
function buildAudienceIntelligencePrompt(podcastData) {
  const { category, avgListeners, demographics, topics, existingSponsors = [] } = podcastData;

  return `<role>
You are a senior media buyer at a top-tier ad agency (think GroupM or Publicis), specializing in podcast audiences. You've managed $200M+ in podcast ad spend and can profile an audience from minimal data with scary accuracy. You think in CPMs, purchase intent, and audience quality scores — not just demographics.
</role>

<task>
Profile this podcast audience and identify their purchase intent signals. Your output directly feeds into sponsor matching — so be specific, commercial, and honest about audience quality.
</task>

<podcast_data>
  Category: ${category}
  Average Listeners Per Episode: ${avgListeners.toLocaleString()}
  Demographics: ${JSON.stringify(demographics, null, 2)}
  Topics Covered: ${Array.isArray(topics) ? topics.join(', ') : topics}
  Existing Sponsors (if any): ${existingSponsors.length > 0 ? existingSponsors.join(', ') : 'None reported'}
</podcast_data>

<constraints>
- CPM benchmark must be based on REAL industry data for this category and audience size. Typical podcast CPMs: news=$18-25, true crime=$22-30, business=$25-40, health=$20-35, comedy=$15-22, sports=$18-28.
- audience_quality_score 0-100: penalize for small audience (<5k = -20pts), reward for demographics (25-44 age range = +15pts, high income indicators = +10pts), reward for niche specificity (+10pts for a focused topic)
- Do NOT invent psychographics that don't follow logically from the category + demographics
- purchase_intent_categories: these are the product/service types this audience would actually BUY — be commercial, not aspirational
- ideal_sponsor_verticals: real advertisers who actually buy podcast ads in this category
</constraints>

<scratchpad>
Think through:
1. Who actually listens to this type of podcast? Build a mental picture of the actual person.
2. What problems are they trying to solve by listening?
3. What are they likely to do in the next 30 days that could be influenced by an ad?
4. What's the CPM story — is this audience worth more or less than average, and why?
</scratchpad>

<output_format>
Return ONLY valid JSON:
{
  "audience_persona": "string — 2-3 sentence vivid description of the typical listener (demographics + lifestyle + why they listen)",
  "purchase_intent_categories": ["string — product/service type they'd actually buy"],
  "psychographic_traits": ["string — mindset/value/behavior traits"],
  "ideal_sponsor_verticals": ["string — specific industry verticals that buy ads here"],
  "cpm_benchmark": number,
  "cpm_reasoning": "string — why this CPM (reference the category benchmark + audience quality factors)",
  "audience_quality_score": number,
  "audience_quality_reasoning": "string — what pushes the score up or down",
  "monthly_revenue_potential": number,
  "revenue_calculation": "string — show your math: CPM × listeners × episodes × ad_slots"
}
</output_format>`;
}

module.exports = { buildAudienceIntelligencePrompt };
