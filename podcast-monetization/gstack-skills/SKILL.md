---
name: podcast-monetize
version: 1.0.0
description: |
  End-to-end AI pipeline for podcast monetization. Analyzes transcripts for ad placement,
  profiles audiences, matches sponsors, generates cold-pitch emails, and calculates CPM pricing.
  Built with Claude Sonnet 4 and gstack prompt architecture.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
---

# Podcast Monetize — gstack Skill

## System Overview

5-stage AI pipeline: Transcript → Ad Breaks → Audience Profile → Sponsor Match → Pitch → Pricing.

## Agent Roles

### Stage 1 — `<role>Strategist</role>` (transcript-analysis.js)
Find 3 natural ad placement moments. Penalize emotional peaks and mid-thought cuts.
Output JSON: `ad_breaks[]`, `episode_themes[]`, `audience_mindset_overall`.

### Stage 2 — `<role>Media Buyer</role>` (audience-intelligence.js)
Profile listeners commercially — CPMs, purchase intent, what they'll actually buy.
Output JSON: `audience_persona`, `purchase_intent_categories[]`, `cpm_benchmark`, `audience_quality_score`.

### Stage 3 — `<role>Sales Director</role>` (sponsor-recommendation.js)
Rank 20 pre-scored candidates by real fit — tone, values, deal viability.
Output JSON: `sponsors[5]` with `fit_score`, `match_reason`, `est_deal_value_monthly`.

### Stage 4 — `<role>Multi-Role Pitch Writer</role>` (pitch-generation.js)
Three simultaneous lenses: Host + Copywriter + Sales Rep. 150-200 word cold email.
Output JSON: `subject_line`, `email_body`, `follow_up_template`, `pitch_strength_score`.

### Stage 5 — `<role>CFO</role>` (pricing-engine.js)
Validate formula-based CPM. Cap at 2x category benchmark. Show negotiation range.
Output JSON: `recommended_cpm`, `rate_floor`, `rate_ceiling`, `negotiation_strategy`.

## File Map

```
podcast-monetization/
├── backend/src/
│   ├── server.js                    # Express entry — :4000
│   ├── lib/claude.js                # Claude client + token tracking
│   ├── lib/sponsors.js              # 30-brand seed database
│   ├── prompts/transcript-analysis.js
│   ├── prompts/audience-intelligence.js
│   ├── prompts/sponsor-recommendation.js
│   ├── prompts/pitch-generation.js
│   ├── prompts/pricing-engine.js
│   ├── routes/analyze-episode.js    # POST /api/analyze-episode
│   ├── routes/recommend-sponsors.js # POST /api/recommend-sponsors
│   └── routes/generate-pitch.js     # POST /api/generate-pitch
├── frontend/public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── gstack-skills/SKILL.md           # This file
```

## Running

```bash
# Backend
cd podcast-monetization/backend
npm install
node src/server.js        # :4000

# Frontend (new terminal)
cd podcast-monetization/frontend
npx serve public -p 3000  # http://localhost:3000
```

## Token Budget (per full pipeline run)

| Stage | Est. In | Est. Out | Est. Cost |
|-------|---------|----------|-----------|
| Transcript Analysis | 1,500 | 600 | $0.014 |
| Audience Intelligence | 800 | 400 | $0.008 |
| Sponsor Ranking | 2,000 | 500 | $0.013 |
| Pitch Generation | 1,200 | 600 | $0.013 |
| Pricing Validation | 600 | 300 | $0.006 |
| **Total** | **6,100** | **2,400** | **~$0.054** |

Model: `claude-sonnet-4-5` — $3.00/M input · $15.00/M output.
Logged per-call in console. `getSessionUsage()` in `claude.js` for totals.

## Extending

- **New sponsor**: Add to `lib/sponsors.js` SPONSORS array
- **Tune a prompt**: Edit the relevant `prompts/*.js` — bump version tag in comment
- **New route**: Create `routes/your-route.js`, mount in `server.js`
- **QA pass**: Run `/qa` on `http://localhost:3000`, test full onboarding → pitch flow
- **Security**: Run `/cso` — check transcript input for prompt injection risk

## Prompt Version Log

| Prompt | Version |
|--------|---------|
| transcript-analysis | v1.0 |
| audience-intelligence | v1.0 |
| sponsor-recommendation | v1.0 |
| pitch-generation | v1.0 |
| pricing-engine | v1.0 |

*Built with Claude Sonnet 4 · gstack prompt architecture*
