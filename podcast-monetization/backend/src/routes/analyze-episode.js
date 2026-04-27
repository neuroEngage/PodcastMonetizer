/**
 * POST /api/analyze-episode
 * Stage 1: Transcript Analysis
 */

const express = require('express');
const router = express.Router();
const { buildTranscriptAnalysisPrompt } = require('../prompts/transcript-analysis');
const { runPrompt } = require('../lib/claude');

const db = require('../lib/db');

router.post('/', async (req, res) => {
  const { transcript, episode_duration, podcast_id } = req.body;
  const user_id = req.user.id; // from authenticateToken middleware

  if (!transcript || transcript.trim().length < 100) {
    return res.status(400).json({ error: 'transcript must be at least 100 characters' });
  }

  try {
    // Usage metering check
    const user = db.prepare('SELECT tier FROM users WHERE id = ?').get(user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.tier === 'starter') {
      const countInfo = db.prepare(`
        SELECT COUNT(*) as count FROM analyses 
        WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
      `).get(user_id);
      
      if (countInfo.count >= 1) {
        return res.status(429).json({ error: 'Limit reached. Upgrade to GROWTH.' });
      }
    }

    const startTime = Date.now();
    const prompt = buildTranscriptAnalysisPrompt(transcript);
    const result = await runPrompt(prompt, 'transcript-analysis', {
      maxTokens: 2048,
      temperature: 0.2,
    });

    return res.json({
      ...result,
      podcast_id,
      episode_duration,
      processing_time_ms: Date.now() - startTime,
    });
  } catch (err) {
    console.error('/api/analyze-episode error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
