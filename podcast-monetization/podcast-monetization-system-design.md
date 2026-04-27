# Podcast Monetization Helper — Full System Design
### End-to-End AI Pipeline · Built with Claude API · gstack-inspired Prompt Architecture

---

## 1. Problem Statement

Mid-size podcasters (1k–100k listeners) leave $500–5,000/month on the table because:
- They don't know **where** to place ads for maximum listener retention
- They have no data on **which sponsors** match their audience
- They lack the copywriting to **pitch sponsors professionally**
- They under-price their inventory based on gut feeling

This system solves all four with a single AI-powered pipeline.

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Next.js)                  │
│  Podcast Onboarding → Data Input → AI Analysis → Pitch Output   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / REST
┌──────────────────────────────▼──────────────────────────────────┐
│                       BACKEND API (Node.js / Express)            │
│  /analyze  /recommend-sponsors  /generate-pitch  /price-calc     │
└──────┬──────────────────┬──────────────────────┬────────────────┘
       │                  │                      │
┌──────▼──────┐  ┌────────▼────────┐  ┌─────────▼───────────┐
│  Claude API  │  │  Sponsor DB     │  │  Pricing Engine      │
│  (Sonnet 4)  │  │  (Postgres)     │  │  (CPM Calculator)    │
│  gstack      │  │  Industry data  │  │  Market benchmarks   │
│  prompts     │  │  Contact info   │  │                      │
└─────────────┘  └─────────────────┘  └─────────────────────-┘
```

---

## 3. Data Model

### Podcast Profile
```json
{
  "podcast_id": "uuid",
  "name": "string",
  "category": "string",       // e.g. "True Crime", "Business", "Health"
  "avg_listeners": "number",
  "episode_length_min": "number",
  "release_cadence": "weekly | biweekly | daily",
  "demographics": {
    "age_18_34_pct": "number",
    "age_35_54_pct": "number",
    "gender_split": "string",
    "top_geographies": ["US", "CA", "UK"]
  },
  "listener_interests": ["string"],  // inferred or user-provided
  "existing_sponsors": ["string"],
  "monthly_revenue_current": "number"
}
```

### Episode Transcript
```json
{
  "episode_id": "uuid",
  "podcast_id": "uuid",
  "transcript_text": "string",
  "duration_seconds": "number",
  "topic_tags": ["string"],         // AI extracted
  "ad_break_candidates": [          // AI identified
    {
      "timestamp_seconds": "number",
      "context": "string",
      "engagement_score": "number"  // 0-1
    }
  ]
}
```

### Sponsor Match
```json
{
  "sponsor_name": "string",
  "category": "string",
  "avg_cpm": "number",
  "audience_fit_score": "number",    // 0-100
  "contact_email": "string",
  "pitch_template_id": "string",
  "typical_deal_size": "number"
}
```

---

## 4. AI Pipeline — 5 Stages

### Stage 1: Transcript Analysis
**Input:** Episode transcript text
**Prompt pattern (gstack-style):**
```
<role>You are a podcast monetization strategist with 10 years experience placing ads for NPR and Spotify.</role>

<task>Analyze this podcast transcript and identify the 3 best ad placement moments.</task>

<criteria>
- Natural conversation breaks (pause points)
- High listener engagement moments (storytelling peaks)
- Topic transitions
- Avoid: mid-sentence, emotional peaks, key revelations
</criteria>

<output_format>
Return JSON with:
{
  "ad_breaks": [
    {
      "timestamp_hint": "string",
      "reason": "string",
      "context_before": "string (50 words)",
      "engagement_level": "high | medium | low",
      "recommended_ad_type": "host-read | pre-roll | mid-roll | post-roll"
    }
  ],
  "episode_themes": ["string"],
  "audience_mindset": "string"
}
</output_format>

<transcript>
{{TRANSCRIPT}}
</transcript>
```

### Stage 2: Audience Intelligence
**Input:** Podcast metadata + listener demographics
**Prompt pattern:**
```
<role>You are a media buyer at a top ad agency specializing in podcast audiences.</role>

<task>Profile this podcast audience and identify their purchase intent signals.</task>

<podcast_data>
  Category: {{CATEGORY}}
  Avg listeners: {{LISTENERS}}
  Demographics: {{DEMOGRAPHICS}}
  Topics: {{TOPICS}}
</podcast_data>

<output_format>
{
  "audience_persona": "string",
  "purchase_intent_categories": ["string"],
  "psychographic_traits": ["string"],
  "ideal_sponsor_verticals": ["string"],
  "cpm_benchmark": number,
  "audience_quality_score": number
}
</output_format>
```

### Stage 3: Sponsor Recommendation
**Input:** Audience profile + sponsor database
**Logic:** Semantic similarity between audience interests and sponsor categories, filtered by budget tier and audience size.

```javascript
// Sponsor scoring algorithm
const sponsorScore = (sponsor, audience) => {
  const categoryMatch = semanticSimilarity(sponsor.category, audience.verticals);
  const sizeMatch = audienceSizeInRange(audience.listeners, sponsor.min_listeners, sponsor.max_listeners);
  const budgetFit = sponsor.avg_cpm * audience.listeners / 1000;
  return (categoryMatch * 0.5) + (sizeMatch * 0.3) + (budgetFit * 0.2);
};
```

**AI overlay prompt:**
```
Given this podcast's audience profile and these 20 sponsor candidates,
rank the top 5 by fit. Explain WHY each is a good match in 1 sentence.
Consider: audience values, purchase stage, seasonal relevance.
```

### Stage 4: Pitch Generation
**Input:** Podcast profile + chosen sponsor + episode context
**gstack-style multi-role prompt:**
```
<role>
You are simultaneously:
1. A podcast host who knows their audience intimately
2. A professional copywriter who has closed $2M in sponsorships
3. A media sales rep who knows what sponsors care about
</role>

<task>Write a cold outreach email to {{SPONSOR_NAME}} seeking a podcast sponsorship deal.</task>

<context>
Podcast: {{PODCAST_NAME}}
Listeners: {{AVG_LISTENERS}} per episode
Category: {{CATEGORY}}
Audience match reason: {{MATCH_REASON}}
Proposed deal: {{DEAL_STRUCTURE}}
Asking rate: ${{RATE}} CPM
</context>

<constraints>
- Subject line: compelling, under 60 chars, no spam triggers
- Body: 150-200 words MAX
- Lead with listener value to sponsor, not podcast metrics
- Include 1 specific data point about audience relevance
- Close with a specific ask (15-min call, not "let me know")
- Tone: confident peer, not desperate vendor
</constraints>

<output>
{
  "subject_line": "string",
  "email_body": "string",
  "follow_up_template": "string",
  "negotiation_floor": number,
  "negotiation_ceiling": number
}
</output>
```

### Stage 5: Pricing Engine
**Formula:**
```
Base CPM = category_benchmark_cpm × audience_quality_multiplier
                                   × engagement_rate_bonus
                                   × exclusivity_premium

Where:
  category_benchmark_cpm: pulled from industry database
  audience_quality_multiplier: 0.7–1.5 based on demographics
  engagement_rate_bonus: 1.0–1.3 based on listener retention
  exclusivity_premium: 1.0–1.4 if category-exclusive

Recommended rate = Base CPM × episode_reach
```

---

## 5. Backend API Spec

### POST /api/analyze-episode
```json
Request:
{
  "transcript": "string",
  "episode_duration": "number",
  "podcast_id": "string"
}

Response:
{
  "ad_breaks": [...],
  "themes": [...],
  "audience_mindset": "string",
  "processing_time_ms": "number"
}
```

### POST /api/recommend-sponsors
```json
Request:
{
  "podcast_id": "string",
  "num_recommendations": 5,
  "exclude_categories": ["competitor"]
}

Response:
{
  "sponsors": [
    {
      "name": "string",
      "fit_score": 87,
      "reason": "string",
      "est_deal_value": 2400,
      "contact": "string"
    }
  ]
}
```

### POST /api/generate-pitch
```json
Request:
{
  "podcast_id": "string",
  "sponsor_name": "string",
  "deal_type": "host-read | banner | exclusive",
  "episodes_per_month": 4
}

Response:
{
  "subject_line": "string",
  "email_body": "string",
  "follow_up": "string",
  "recommended_rate": 2800,
  "rate_range": { "floor": 2000, "ceiling": 4200 }
}
```

---

## 6. gstack Prompt Patterns Applied

The gstack repo (github.com/garrytan/gstack) provides 23 opinionated agent roles. Applied to this system:

| gstack Role | Applied To |
|-------------|------------|
| `CEO` | Strategy: validates if sponsor match makes business sense |
| `Designer` | Pitch tone: ensures email reads as premium, not generic |
| `Eng Manager` | Code: structures the pipeline correctly |
| `Doc Engineer` | Generates the final pitch document |
| `QA` | Validates: checks pitch against spam filters, checks pricing against market |

**Key prompt patterns from gstack:**
- Multi-role injection (`<role>`) for competing perspectives
- Structured output via `<output_format>` XML tags
- Constraint blocks that prevent hallucination
- Chain-of-thought via `<scratchpad>` before final answer
- Version tagging for prompt iteration (`<!-- v2.1 sponsor-pitch -->`)

---

## 7. Frontend Component Map

```
App
├── Onboarding Flow
│   ├── PodcastBasicsForm       (name, category, listeners)
│   ├── DemographicsForm        (age, gender, geo)
│   └── CurrentRevenueForm      (existing sponsors, revenue)
│
├── Episode Analyzer
│   ├── TranscriptUpload        (paste or file upload)
│   ├── AdBreakVisualizer       (timeline with markers)
│   └── ThemeExtractor          (tag cloud)
│
├── Sponsor Recommendations
│   ├── SponsorCard             (name, fit score, deal estimate)
│   ├── FitScoreBreakdown       (why this match works)
│   └── IndustryFilter          (filter by vertical)
│
├── Pitch Generator
│   ├── SponsorSelector         (pick from recommendations)
│   ├── DealConfigurator        (type, episodes, length)
│   ├── PitchPreview            (live email preview)
│   └── PricingCalculator       (CPM × reach = deal value)
│
└── Dashboard
    ├── RevenueProjection       (current vs potential)
    ├── PitchHistory            (sent pitches, status)
    └── SponsorPipeline         (CRM-lite view)
```

---

## 8. Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | Next.js 14 + TailwindCSS | SSR for SEO, fast iteration |
| Backend | Node.js + Express | Simple REST, Claude SDK native |
| AI | Claude Sonnet 4 via Anthropic API | Best instruction following, structured output |
| Prompt Mgmt | gstack patterns + custom CLAUDE.md | Reusable, versioned prompts |
| Database | PostgreSQL + Prisma | Structured sponsor data, easy queries |
| Caching | Redis | Cache sponsor recommendations (1hr TTL) |
| Auth | Clerk | Fast auth, podcast-friendly pricing |
| Email | Resend | Transactional + pitch sending |
| Deploy | Vercel (frontend) + Railway (backend) | Zero-config, fast CI |

---

## 9. Revenue Model

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0 | 1 episode analysis/month, 3 sponsor recs |
| Starter | $29/mo | 5 episodes, 10 recs, pitch generator |
| Pro | $79/mo | Unlimited, pricing engine, pitch tracking |
| Agency | $299/mo | Multi-podcast, white label, API access |

**Unit economics:** If 1% of 50k mid-size podcasters convert to Pro = $39,500 MRR.

---

## 10. Implementation Roadmap

### Week 1–2: Foundation
- [ ] Set up Next.js + Express skeleton
- [ ] Implement Anthropic API integration
- [ ] Build transcript analysis prompt (Stage 1)
- [ ] Basic podcast profile form

### Week 3–4: Core Pipeline
- [ ] Audience intelligence prompt (Stage 2)
- [ ] Seed sponsor database (500+ sponsors)
- [ ] Sponsor scoring algorithm
- [ ] Pricing engine formula

### Week 5–6: Pitch Generator
- [ ] Pitch generation prompt (Stage 4) with gstack patterns
- [ ] Email preview UI
- [ ] Rate calculator UI
- [ ] One-click copy/send

### Week 7–8: Polish & Launch
- [ ] Dashboard & revenue projection
- [ ] Auth + subscription (Clerk + Stripe)
- [ ] Prompt QA pass (gstack QA role)
- [ ] Beta with 20 podcasters

---

## 11. Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Hallucinated sponsor contacts | Validate against real database, never generate emails |
| Over-optimistic pricing | Cap at 2x industry CPM benchmark, show confidence range |
| Transcript privacy | Process client-side or with DPA, never store raw transcripts |
| Prompt injection via transcripts | Sanitize input, use structured message format |
| Rate limits on Claude API | Queue system with Redis, batch processing |

---

*Built with Claude Sonnet 4 · Prompt architecture inspired by gstack (github.com/garrytan/gstack)*
