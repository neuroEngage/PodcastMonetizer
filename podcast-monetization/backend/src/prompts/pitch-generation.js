/**
 * Stage 4: Pitch Generation Prompt
 * gstack-style MULTI-ROLE injection for competing perspectives.
 * Three simultaneous lenses: Host Voice, Copywriter, Sales Rep.
 * <!-- v1.0 pitch-generation -->
 */

/**
 * Build the pitch generation prompt.
 * @param {Object} params - All pitch parameters
 * @returns {string} Claude prompt
 */
function buildPitchGenerationPrompt(params) {
  const {
    podcastName,
    podcastCategory,
    avgListeners,
    audienceProfile,
    sponsorName,
    sponsorCategory,
    matchReason,
    dealType,           // 'host-read' | 'banner' | 'exclusive'
    episodesPerMonth,
    recommendedRate,    // from pricing engine
    rateFloor,
    rateCeiling,
  } = params;

  return `<role>
You are simultaneously inhabiting three perspectives. Before writing, consult all three:

1. THE HOST — You know this audience intimately. You've built trust with ${avgListeners.toLocaleString()} listeners over years. You would only endorse something you believe in. Your voice is authentic, not salesy.

2. THE COPYWRITER — You've closed $2M+ in podcast sponsorships. You know the subject line that gets opened. You know that sponsors get 200 cold emails a week and delete 195 of them in 3 seconds. You write the 5 that get replies.

3. THE SALES REP — You know what ${sponsorCategory} brands care about: not listeners, but CUSTOMERS. Not impressions, but conversions. You lead with business outcomes, not podcast metrics.

Synthesize all three voices into a single pitch that sounds like the host wrote it but converts like a sales rep wrote it.
</role>

<task>
Write a cold outreach email from the podcast host to ${sponsorName} seeking a ${dealType} sponsorship deal.
</task>

<context>
Podcast: ${podcastName}
Category: ${podcastCategory}
Listeners: ${avgListeners.toLocaleString()} per episode
Deal Type: ${dealType}
Episodes Per Month: ${episodesPerMonth}
Why ${sponsorName} fits this audience: ${matchReason}
Proposed Rate: $${recommendedRate.toLocaleString()} per month
Deal Range (for negotiation): $${rateFloor.toLocaleString()} - $${rateCeiling.toLocaleString()}
Audience Profile Summary: ${audienceProfile.audience_persona}
Their Purchase Intent: ${audienceProfile.purchase_intent_categories?.join(', ')}
</context>

<constraints>
SUBJECT LINE:
- Under 60 characters (hard limit — test count it)
- No spam triggers: no ALL CAPS, no "FREE", no "!!!", no "opportunity"
- Should feel like peer-to-peer, not vendor outreach
- Create curiosity or state a specific value proposition

EMAIL BODY:
- 150-200 words MAX (sponsors are busy — respect their time)
- DO NOT open with "My name is..." or "I'm writing to..."
- Lead with what ${sponsorName}'s customer looks like in this audience — not the podcast
- Include EXACTLY ONE specific data point about audience relevance (from the context above)
- Close with a SPECIFIC ask: "15-minute call next week?" — NOT "let me know if you're interested"
- Tone: confident peer reaching out, not desperate vendor pitching
- No attachments mentioned, no media kit mentioned in the email (offer it if they reply)

FOLLOW-UP (separate email, sent 5 days later if no reply):
- 75-100 words
- Add one new piece of value (a different audience angle)
- Gently bump the original ask
</constraints>

<scratchpad>
Think through:
1. What is the ONE thing ${sponsorName} cares about most (new customers? brand awareness? specific demographic)?
2. What's the most surprising/compelling data point from this audience profile?
3. What subject line would make their marketing manager stop scrolling?
4. How do you close without sounding desperate?
Write your thinking before the final output.
</scratchpad>

<output_format>
Return ONLY valid JSON:
{
  "subject_line": "string",
  "email_body": "string",
  "follow_up_template": "string",
  "word_count_email": number,
  "word_count_followup": number,
  "negotiation_floor": number,
  "negotiation_ceiling": number,
  "pitch_strength_score": number,
  "pitch_strength_reasoning": "string — what makes this pitch strong or what could improve it"
}
</output_format>`;
}

module.exports = { buildPitchGenerationPrompt };
