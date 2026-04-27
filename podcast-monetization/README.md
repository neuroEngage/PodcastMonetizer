# PodMonetize 🎙️

> AI-powered podcast sponsorship engine — built with Claude Sonnet 4 + gstack prompt architecture

## What It Does

Mid-size podcasters (1k–100k listeners) leave $500–5,000/month on the table. PodMonetize fixes that with a 5-stage Claude pipeline:

| Stage | What Happens |
|-------|-------------|
| 1 — Transcript Analysis | Finds the 3 best ad placement moments in your episode |
| 2 — Audience Intelligence | Profiles your listeners' purchase intent and CPM value |
| 3 — Sponsor Matching | Scores 30+ real sponsors, AI ranks the top 5 |
| 4 — Pitch Generation | Writes a 150-word cold email (Host + Copywriter + Sales Rep voices) |
| 5 — Pricing Engine | Calculates your CPM floor/ceiling with market validation |

## Quick Start

### 1. Backend
```bash
cd backend
npm install
# API key is already in .env
node src/server.js
# → Running on http://localhost:4000
```

### 2. Frontend (new terminal)
```bash
cd frontend
npx serve public -p 3000
# → Open http://localhost:3000
```

### 3. Verify
```bash
curl http://localhost:4000/health
```

## API Reference

### `POST /api/analyze-episode`
```json
{ "transcript": "...", "episode_duration": 2700, "podcast_id": "abc" }
```

### `POST /api/recommend-sponsors`
```json
{
  "podcast_id": "abc",
  "podcast_profile": {
    "name": "My Podcast", "category": "Business",
    "avg_listeners": 15000, "demographics": { "age_18_34_pct": 40, "top_geographies": ["US"] }
  }
}
```

### `POST /api/generate-pitch`
```json
{
  "podcast_profile": { "name": "My Podcast", "category": "Business", "avg_listeners": 15000 },
  "sponsor_name": "Shopify",
  "sponsor_category": "eCommerce Platform",
  "deal_type": "host-read",
  "episodes_per_month": 4
}
```

## Token Costs

Every Claude call is logged: `[Claude] stage | in=X out=Y | cost=$Z | session_total=$W`

Full pipeline run ≈ **$0.054** using `claude-sonnet-4-5`.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML/CSS/JS (no framework) |
| Backend | Node.js + Express |
| AI | Claude Sonnet 4 via Anthropic SDK |
| Prompt Architecture | gstack-style XML roles + structured output |

## Project Structure

```
podcast-monetization/
├── backend/          # Node.js API (port 4000)
├── frontend/         # Static HTML app (port 3000)
├── gstack-skills/    # SKILL.md for AI agent context
└── podcast-monetization-system-design.md
```
