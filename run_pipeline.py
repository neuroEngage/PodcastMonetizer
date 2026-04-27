import urllib.request, json

with open('yt_transcript.txt', encoding='utf-8') as f:
    transcript = f.read()[:7000]

profile = {
    'name': 'YouTube Video ru44DngJYoA',
    'category': 'Education',
    'avg_listeners': 50000,
    'episodes_per_month': 4,
    'demographics': {
        'age_18_34_pct': 45,
        'age_35_54_pct': 40,
        'gender_split': '55% M, 45% F',
        'top_geographies': ['US']
    },
    'monthly_revenue_current': 0
}

def post(url, payload):
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req, timeout=120).read())

print("Stage 1: Transcript Analysis...")
r1 = post('http://localhost:4000/api/analyze-episode', {
    'transcript': transcript, 'episode_duration': 1800, 'podcast_id': 'yt-test'
})

print("Stage 2+3: Audience + Sponsors...")
r2 = post('http://localhost:4000/api/recommend-sponsors', {
    'podcast_profile': profile, 'num_recommendations': 5
})
aud = r2['audience_profile']
sponsors = r2['sponsors']

print("Stage 4+5: Pitch generation...")
top = sponsors[0]
r3 = post('http://localhost:4000/api/generate-pitch', {
    'podcast_profile': profile,
    'sponsor_name': top['name'],
    'sponsor_category': top.get('category', ''),
    'deal_type': 'host-read',
    'episodes_per_month': 4,
    'match_reason': top.get('match_reason', '')
})

sep = "=" * 70

print()
print(sep)
print("PODMONETIZE REPORT -- YouTube: https://youtu.be/ru44DngJYoA")
print(sep)

print("\nEPISODE SUMMARY")
print("-" * 40)
print("Themes    :", ", ".join(r1.get('episode_themes', [])))
print("Summary   :", r1.get('episode_summary', ''))
print("Audience  :", r1.get('audience_mindset_overall', ''))

print("\nAUDIENCE INTELLIGENCE")
print("-" * 40)
print("Persona   :", aud.get('audience_persona', ''))
print("Intent    :", ", ".join(aud.get('purchase_intent_categories', [])))
print("Verticals :", ", ".join(aud.get('ideal_sponsor_verticals', [])))
print("CPM       : $", aud.get('cpm_benchmark', ''))
print("Quality   :", aud.get('audience_quality_score', ''), "/ 100")
print("Rev Pot   : $", aud.get('monthly_revenue_potential', ''), "/ month")

print("\nRECOMMENDED AD PLACEMENTS")
print("-" * 40)
for i, b in enumerate(r1.get('ad_breaks', []), 1):
    hint = b.get('timestamp_hint', '')
    eng = b.get('engagement_level', '')
    adtype = b.get('recommended_ad_type', '')
    reason = b.get('reason', '')
    mindset = b.get('audience_mindset', '')
    print(f"  {i}. {hint}")
    print(f"     Type: {adtype}  |  Engagement: {eng}")
    print(f"     Why: {reason}")
    print(f"     Listener mindset: {mindset}")

print("\nTOP 5 MATCHED SPONSORS")
print("-" * 40)
for s in sponsors:
    name = s.get('name', '')
    cat = s.get('category', '')
    score = s.get('fit_score', 0)
    val = s.get('est_deal_value_monthly', 0)
    reason = s.get('match_reason', '')
    angle = s.get('outreach_angle', '')
    print(f"  [{score}/100] {name} ({cat}) -- ${val:,}/mo")
    print(f"  Match: {reason}")
    print(f"  Angle: {angle}")
    print()

print("\nGENERATED PITCH")
print("-" * 40)
print("Sponsor   :", r3.get('sponsor_name', ''))
print("Rate      : $" + str(r3.get('recommended_rate', 0)) + "/mo")
floor = r3.get('rate_range', {}).get('floor', 0)
ceil = r3.get('rate_range', {}).get('ceiling', 0)
print("Range     : $" + str(floor) + " - $" + str(ceil))
print("Strength  :", str(r3.get('pitch_strength_score', 0)) + "/100")
print("Reasoning :", r3.get('pitch_strength_reasoning', ''))
print()
print("SUBJECT LINE:")
print(" ", r3.get('subject_line', ''))
print()
print("EMAIL BODY:")
print(r3.get('email_body', ''))
print()
print("FOLLOW-UP (Day 5):")
print(r3.get('follow_up', ''))

health = json.loads(urllib.request.urlopen('http://localhost:4000/health', timeout=10).read())
u = health['session_usage']
print()
print(sep)
print("TOKEN USAGE")
print("-" * 40)
print("Calls   :", u['calls'])
print("Input   :", u['input_tokens'], "tokens")
print("Output  :", u['output_tokens'], "tokens")
print("Cost    : $" + str(round(u['cost_usd'], 4)))
print(sep)
