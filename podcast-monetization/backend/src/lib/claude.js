/**
 * Claude API client wrapper.
 * Tracks token usage per call and accumulates session totals.
 * Logs: model, input tokens, output tokens, estimated cost per call.
 *
 * Pricing reference (claude-sonnet-4-5, as of 2025):
 *   Input:  $3.00 / 1M tokens
 *   Output: $15.00 / 1M tokens
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL = 'claude-sonnet-4-5';
const DEFAULT_MAX_TOKENS = 2048; // conservative default — prompts are concise

// Per-model pricing ($ per 1M tokens)
const MODEL_PRICING = {
  'claude-sonnet-4-5':    { input: 3.00,  output: 15.00 },
  'claude-opus-4-5':      { input: 15.00, output: 75.00 },
  'claude-haiku-3-5':     { input: 0.80,  output: 4.00  },
};

// Session-level usage accumulator
const sessionUsage = {
  calls: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCostUSD: 0,
};

/**
 * Calculate cost for a single call.
 */
function calcCost(model, inputTokens, outputTokens) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING[DEFAULT_MODEL];
  return (inputTokens / 1e6) * pricing.input + (outputTokens / 1e6) * pricing.output;
}

/**
 * Log token usage for a call and accumulate session totals.
 */
function trackUsage(label, model, usage) {
  const { input_tokens, output_tokens } = usage;
  const cost = calcCost(model, input_tokens, output_tokens);

  sessionUsage.calls += 1;
  sessionUsage.totalInputTokens += input_tokens;
  sessionUsage.totalOutputTokens += output_tokens;
  sessionUsage.totalCostUSD += cost;

  console.log(
    `[Claude] ${label} | model=${model} | in=${input_tokens} out=${output_tokens} | cost=$${cost.toFixed(4)} | session_total=$${sessionUsage.totalCostUSD.toFixed(4)}`
  );
}

/**
 * Run a prompt through Claude and parse the JSON response.
 * @param {string} prompt - The assembled prompt
 * @param {string} label - Human-readable label for logging (e.g. 'transcript-analysis')
 * @param {Object} options - Optional overrides
 * @returns {Promise<Object>} Parsed JSON output from Claude
 */
async function runPrompt(prompt, label = 'call', options = {}) {
  const {
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    systemMessage = 'You are a podcast monetization expert. Always return valid JSON as instructed. Do not wrap your response in markdown code fences.',
    temperature = 0.3,
  } = options;

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemMessage,
    messages: [{ role: 'user', content: prompt }],
  });

  // Track usage
  if (message.usage) trackUsage(label, model, message.usage);

  const rawText = message.content[0].text.trim();
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`[Claude] ${label} — response was not valid JSON:`, cleaned.slice(0, 500));
    throw new Error(`Claude returned invalid JSON: ${err.message}`);
  }
}

/**
 * Get accumulated session usage stats.
 */
function getSessionUsage() {
  return { ...sessionUsage };
}

module.exports = { runPrompt, getSessionUsage };
