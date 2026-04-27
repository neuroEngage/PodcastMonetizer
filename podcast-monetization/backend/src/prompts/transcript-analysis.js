/**
 * Stage 1: Transcript Analysis Prompt
 * gstack-style prompt with role injection, structured XML tags, constraint blocks,
 * and chain-of-thought scratchpad before final JSON output.
 * <!-- v1.0 transcript-analysis -->
 */

/**
 * Build the transcript analysis prompt.
 * @param {string} transcript - Raw episode transcript text
 * @returns {string} Fully assembled Claude prompt
 */
function buildTranscriptAnalysisPrompt(transcript) {
  return `<role>
You are a podcast monetization strategist with 10 years of experience placing ads for NPR, Spotify, and Wondery. You have placed over $50M in podcast advertising and know exactly which moments keep listeners hitting skip vs. staying tuned in.
</role>

<task>
Analyze this podcast transcript and identify the 3 best ad placement moments. Then extract episode themes and characterize the audience mindset during each ad opportunity.
</task>

<criteria>
GOOD placement moments:
- Natural conversation breaks or topic transitions
- Post-revelation moments (listener has just absorbed a key idea)
- Storytelling valleys between peaks (engagement dip, natural breathing room)
- After a complete thought or narrative arc closes

BAD placement moments — NEVER choose these:
- Mid-sentence or mid-thought
- During emotional peaks or key revelations
- During cliffhangers or "and then..." moments
- When the host is in the middle of explaining a core concept
</criteria>

<constraints>
- You must find EXACTLY 3 ad breaks — no more, no fewer
- timestamp_hint should be a descriptive marker like "after the intro story" or "before the interview segment starts" — NOT a numeric timestamp since you don't have one
- engagement_level reflects listener engagement at that EXACT moment (not the episode average)
- audience_mindset should be 1-2 sentences about what the listener is thinking/feeling RIGHT THEN
- episode_themes: extract 3-7 themes as short keyword phrases
</constraints>

<scratchpad>
Before outputting the final JSON, think through:
1. What is this episode actually about? What are the 2-3 main narrative arcs?
2. Where do the natural pauses and topic transitions occur?
3. Which moments feel "earned" — where the listener is satisfied enough to tolerate an interruption?
4. What is the dominant audience mindset throughout?
Think through this before giving the final answer.
</scratchpad>

<output_format>
Return ONLY valid JSON (no markdown fences, no explanation outside the JSON):
{
  "ad_breaks": [
    {
      "timestamp_hint": "string — descriptive location marker",
      "reason": "string — why this is a good placement (1-2 sentences)",
      "context_before": "string — what was just said (max 50 words)",
      "engagement_level": "high | medium | low",
      "recommended_ad_type": "host-read | pre-roll | mid-roll | post-roll",
      "audience_mindset": "string — what listener is thinking/feeling right here"
    }
  ],
  "episode_themes": ["string"],
  "audience_mindset_overall": "string — dominant listener state throughout the episode",
  "episode_summary": "string — 2-3 sentence summary of the episode content"
}
</output_format>

<transcript>
${transcript}
</transcript>`;
}

module.exports = { buildTranscriptAnalysisPrompt };
