const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const authenticateToken = require('../middleware/auth');

// POST /api/analyses
router.post('/', authenticateToken, (req, res) => {
  try {
    const { podcast_data, sponsors_matched, pitches } = req.body;
    const user_id = req.user.id;

    const stmt = db.prepare(`
      INSERT INTO analyses (user_id, podcast_data, sponsors_matched, pitches)
      VALUES (?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      user_id,
      JSON.stringify(podcast_data || {}),
      JSON.stringify(sponsors_matched || []),
      JSON.stringify(pitches || {})
    );

    res.status(201).json({ id: info.lastInsertRowid, message: 'Analysis saved successfully' });
  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analyses
router.get('/', authenticateToken, (req, res) => {
  try {
    const user_id = req.user.id;
    const analyses = db.prepare('SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC').all(user_id);
    
    // Parse JSON strings back to objects
    const parsedAnalyses = analyses.map(analysis => ({
      ...analysis,
      podcast_data: JSON.parse(analysis.podcast_data || '{}'),
      sponsors_matched: JSON.parse(analysis.sponsors_matched || '[]'),
      pitches: JSON.parse(analysis.pitches || '{}')
    }));

    res.json({ analyses: parsedAnalyses });
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analyses/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const analysis = db.prepare('SELECT * FROM analyses WHERE id = ? AND user_id = ?').get(id, user_id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({
      ...analysis,
      podcast_data: JSON.parse(analysis.podcast_data || '{}'),
      sponsors_matched: JSON.parse(analysis.sponsors_matched || '[]'),
      pitches: JSON.parse(analysis.pitches || '{}')
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
