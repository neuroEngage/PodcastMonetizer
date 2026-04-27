const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API = isLocal ? 'http://localhost:4000' : 'https://podmonetize-backend.onrender.com';
let profile = null, analysisResult = null, audienceData = null, sponsorList = [], currentPitch = null;

/* ── Navigation ─────────────────────────────────────────────────────────── */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');
  document.getElementById('main').scrollTo(0, 0);
}

/* ── Word count ─────────────────────────────────────────────────────────── */
document.getElementById('f-tx').addEventListener('input', function () {
  const w = this.value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('wc-badge').textContent = w + ' words';
});

/* ── Sample data ────────────────────────────────────────────────────────── */
function loadSample() {
  document.getElementById('f-name').value = 'The Business Breakdown';
  document.getElementById('f-cat').value = 'Business';
  document.getElementById('f-listeners').value = '18000';
  document.getElementById('f-eps').value = '4';
  document.getElementById('f-age1').value = '38';
  document.getElementById('f-age2').value = '48';
  document.getElementById('f-gender').value = '58% M, 42% F';
  document.getElementById('f-rev').value = '800';
  document.getElementById('f-geo').value = 'US';
  document.getElementById('podcast-name-display').textContent = 'The Business Breakdown';
}

function loadSampleTx() {
  const tx = `Welcome back to The Business Breakdown. Today I'm talking to Sarah Chen, founder of a bootstrapped SaaS that hit $2M ARR without raising a dollar.

Sarah, let's start at the beginning. You were in corporate finance when the idea hit you.

Sarah: It was a mundane Tuesday. I was building yet another Excel model for vendor contracts and thought — why does this still require a spreadsheet in 2021? That question broke something in my brain.

Host: What did you do in the first 30 days?

Sarah: Nothing technical. I spent 30 days talking to 40 CFOs. By day 30 I had a 12-page document of exactly what people hated and exactly what they'd pay to fix it.

Host: That customer-first discipline is rare. Tell me about pricing discovery.

Sarah: We started at $199/month and couldn't close anyone. Not because it was expensive — they thought it was too cheap. Assumed something was wrong with it. Raised to $499 and close rate tripled overnight.

Host: Counter-intuitive. We'll take a quick break and when we come back Sarah walks through her hiring philosophy.

[Ad break]

Welcome back. Sarah, tell me about team structure.

Sarah: Nobody gets hired unless a customer asked for what they'd build. We have 4 engineers, 2 customer success, 1 ops. Every person was hired because a customer said I wish you could do X.

Host: That makes customers your HR department. What do you wish you'd known on day one?

Sarah: That momentum is the product. The software matters less than people think. What keeps customers is the feeling that you're moving, that you're listening. That's what they're paying for.

Host: Sarah Chen, this has been fantastic. Next week we're talking to a PE operator. See you then.`;
  document.getElementById('f-tx').value = tx;
  const w = tx.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('wc-badge').textContent = w + ' words';
}

/* ── Fetch transcript from YouTube URL ──────────────────────────────────── */
async function fetchTranscript() {
  const url = document.getElementById('f-url').value.trim();
  if (!url) { setFetchStatus('err', '⚠ Please paste a YouTube URL first.'); return; }

  const btn = document.getElementById('fetch-btn');
  const btnText = document.getElementById('fetch-btn-text');
  btn.disabled = true;
  btnText.textContent = 'Fetching…';
  setFetchStatus('loading', '⏳ Fetching transcript from YouTube…');

  try {
    const r = await fetch(API + '/api/fetch-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Fetch failed');

    document.getElementById('f-tx').value = data.transcript;
    document.getElementById('wc-badge').textContent = data.word_count + ' words';
    setFetchStatus('ok', `✓ Transcript fetched — ${data.word_count.toLocaleString()} words from video ${data.video_id}`);
  } catch(err) {
    setFetchStatus('err', '⚠ ' + err.message);
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Fetch Transcript';
  }
}

function setFetchStatus(type, msg) {
  const el = document.getElementById('fetch-status');
  el.style.display = 'flex';
  el.className = 'fetch-status ' + type;
  el.textContent = msg;
}


/* ── Build profile ──────────────────────────────────────────────────────── */
function buildProfile() {
  const name = document.getElementById('f-name').value || 'My Podcast';
  document.getElementById('podcast-name-display').textContent = name;
  return {
    name,
    category: document.getElementById('f-cat').value || 'Business',
    avg_listeners: parseInt(document.getElementById('f-listeners').value) || 10000,
    episodes_per_month: parseInt(document.getElementById('f-eps').value) || 4,
    demographics: {
      age_18_34_pct: parseInt(document.getElementById('f-age1').value) || 35,
      age_35_54_pct: parseInt(document.getElementById('f-age2').value) || 45,
      gender_split: document.getElementById('f-gender').value || '50% M, 50% F',
      top_geographies: [document.getElementById('f-geo').value || 'US'],
    },
    monthly_revenue_current: parseInt(document.getElementById('f-rev').value) || 0,
  };
}

/* ── Stage updater ──────────────────────────────────────────────────────── */
function setStage(n) {
  [1,2,3,4].forEach(i => {
    const el = document.getElementById('stg-' + i);
    el.classList.remove('running', 'done');
    const st = el.querySelector('.stg-status');
    if (i < n) { el.classList.add('done'); st.textContent = '✓ done'; }
    else if (i === n) { el.classList.add('running'); st.textContent = 'running…'; }
    else { st.textContent = '—'; }
  });
}

/* ── Main pipeline ──────────────────────────────────────────────────────── */
async function runPipeline() {
  const tx = document.getElementById('f-tx').value.trim();
  if (tx.split(/\s+/).filter(Boolean).length < 50) {
    showError('Transcript must be at least 50 words. Click "Load Sample" to try a demo.');
    return;
  }

  profile = buildProfile();
  hideError();

  const btn = document.getElementById('run-btn');
  btn.disabled = true; btn.textContent = '⏳ Running…';

  document.getElementById('pipeline-progress').style.display = 'block';

  try {
    // Stage 1
    setStage(1);
    const r1 = await post('/api/analyze-episode', {
      transcript: tx, episode_duration: 2700, podcast_id: 'live'
    });
    analysisResult = r1;

    // Stage 2+3
    setStage(2);
    await sleep(300);
    setStage(3);
    const r2 = await post('/api/recommend-sponsors', {
      podcast_id: 'live', podcast_profile: profile, num_recommendations: 5
    });
    audienceData = r2.audience_profile;
    sponsorList = r2.sponsors;
    setStage(4);
    await sleep(200);

    // Update all screens
    updateDashboard();
    updateSponsorFinder();
    updateAdPlacement();
    updatePricingEmpty();

    setStage(4);
    pollUsage();

    btn.disabled = false; btn.textContent = '⚡ Run AI Analysis';
    showScreen('dashboard');

  } catch(err) {
    btn.disabled = false; btn.textContent = '⚡ Run AI Analysis';
    showError(err.message);
  }
}

/* ── Dashboard update ───────────────────────────────────────────────────── */
function updateDashboard() {
  document.getElementById('btn-export-pdf').style.display = 'block';

  const cur = profile.monthly_revenue_current || 0;
  const pot = audienceData?.monthly_revenue_potential || 0;
  const lift = Math.max(0, pot - cur);

  document.getElementById('kpi-revenue').textContent = '$' + pot.toLocaleString();
  document.getElementById('kpi-revenue-delta').textContent = '+$' + lift.toLocaleString() + ' vs current';
  document.getElementById('kpi-sponsors').textContent = sponsorList.length;
  document.getElementById('kpi-sponsors-delta').textContent = 'from latest analysis';
  document.getElementById('kpi-cpm').textContent = '$' + (audienceData?.cpm_benchmark || 0);
  document.getElementById('kpi-pitches').textContent = sponsorList.length;
  document.getElementById('kpi-pitches-delta').textContent = 'ready to send';

  // AI Actions card
  const actions = [
    `📈 Revenue potential: <strong>$${pot.toLocaleString()}/mo</strong>`,
    `🎯 <strong>${sponsorList.length} sponsors</strong> matched — go to Sponsor Finder`,
    `📍 <strong>${(analysisResult?.ad_breaks||[]).length} ad breaks</strong> identified — see Ad Placement`,
    `✉️ Generate pitches from the Sponsor Finder`,
  ];
  document.getElementById('ai-actions-body').innerHTML =
    '<ul class="actions-list">' + actions.map(a => `<li class="action-item">${a}</li>`).join('') + '</ul>';

  // Pipeline card (top 3 sponsors)
  const top3 = sponsorList.slice(0, 3);
  document.getElementById('pipeline-body').innerHTML = top3.map(s => `
    <div class="pipeline-sponsor-row" onclick="generatePitch('${esc(s.name)}')">
      <div class="ps-info">
        <div class="ps-name">${esc(s.name)}</div>
        <div class="ps-cat">${esc(s.category || '')}</div>
      </div>
      <div class="ps-score">${s.fit_score || 0}</div>
      <div class="ps-deal success dm-mono">$${(s.est_deal_value_monthly||0).toLocaleString()}</div>
    </div>
  `).join('');

  // Revenue chart
  buildRevenueChart(cur, pot);
}

function buildRevenueChart(cur, pot) {
  const bars = document.getElementById('chart-bars');
  document.getElementById('chart-empty').style.display = 'none';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date().getMonth();
  const maxH = 100;
  bars.innerHTML = months.map((m, i) => {
    const progress = i <= now ? (cur + (pot - cur) * (i / now)) : pot;
    const h = Math.round((progress / (pot * 1.1)) * maxH);
    const isNow = i === now;
    return `<div class="chart-bar" style="height:${h}px;opacity:${isNow?1:0.5}${isNow?';box-shadow:0 0 12px rgba(233,69,96,.4)':''}" title="$${Math.round(progress).toLocaleString()}">
      <span class="chart-bar-label">${m}</span>
    </div>`;
  }).join('');
}

/* ── Sponsor Finder ─────────────────────────────────────────────────────── */
function updateSponsorFinder() {
  if (!sponsorList.length) return;

  document.getElementById('sponsors-empty').style.display = 'none';
  document.getElementById('sponsors-grid').style.display = 'grid';

  document.getElementById('sp-total').textContent = sponsorList.length;
  document.getElementById('sp-cpm').textContent = '$' + (audienceData?.cpm_benchmark || 0);
  document.getElementById('sp-pot').textContent = '$' + (audienceData?.monthly_revenue_potential || 0).toLocaleString();

  // Intel strip
  const strip = document.getElementById('intel-strip');
  strip.style.display = 'grid';
  document.getElementById('intel-persona').textContent = audienceData?.audience_persona || '—';
  document.getElementById('intel-intent').innerHTML = (audienceData?.purchase_intent_categories || []).map(t => `<span class="intel-tag">${esc(t)}</span>`).join('');
  document.getElementById('intel-verticals').innerHTML = (audienceData?.ideal_sponsor_verticals || []).map(t => `<span class="intel-tag">${esc(t)}</span>`).join('');

  const circ = 2 * Math.PI * 20;
  document.getElementById('sponsors-grid').innerHTML = sponsorList.map((s, i) => {
    const score = s.fit_score || 0;
    const dash = (score / 100) * circ;
    return `
      <div class="sponsor-card">
        <div class="sc-top">
          <div class="sc-score-ring">
            <svg class="sc-score-svg" viewBox="0 0 48 48">
              <circle class="sc-score-bg" cx="24" cy="24" r="20"/>
              <circle class="sc-score-arc" cx="24" cy="24" r="20"
                stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}"/>
            </svg>
            <span class="sc-score-text">${score}</span>
          </div>
          <div class="sc-info">
            <div class="sc-name">${esc(s.name)}</div>
            <div class="sc-cat">${esc(s.category || '')}</div>
          </div>
          <div class="sc-deal">$${(s.est_deal_value_monthly||0).toLocaleString()}<div style="font-size:10px;color:var(--muted);font-family:Inter">/ mo</div></div>
        </div>
        <div class="sc-reason">${esc(s.match_reason || s.outreach_angle || '')}</div>
        <div class="sc-actions">
          <button class="sc-btn-pitch" onclick="generatePitch('${esc(s.name)}')">✉️ Generate Pitch</button>
          <a href="${s.website || '#'}" target="_blank" class="sc-btn-save" style="text-decoration:none; text-align:center; display:flex; align-items:center; justify-content:center; padding: 0 16px;">↗ Website</a>
        </div>
      </div>`;
  }).join('');
}

/* ── Ad Placement ───────────────────────────────────────────────────────── */
function updateAdPlacement() {
  const breaks = analysisResult?.ad_breaks || [];
  if (!breaks.length) return;

  document.getElementById('placement-empty').style.display = 'none';
  document.getElementById('placement-content').style.display = 'block';

  // Timeline markers (spread evenly)
  const track = document.getElementById('timeline-track');
  track.innerHTML = breaks.map((b, i) => {
    const pct = Math.round((i + 0.5) / breaks.length * 90 + 5);
    const w = 8;
    return `<div class="timeline-marker ${b.engagement_level}" style="left:${pct-w/2}%;width:${w}%" title="${esc(b.timestamp_hint)}"></div>`;
  }).join('');

  // Placement cards
  document.getElementById('placement-cards').innerHTML = breaks.map((b, i) => `
    <div class="placement-card">
      <div class="pl-num">${i+1}</div>
      <div class="pl-body">
        <div class="pl-hint">${esc(b.timestamp_hint)}</div>
        <div class="pl-reason">${esc(b.reason)}</div>
        <div class="pl-tags">
          <span class="pl-tag ${b.engagement_level}">${b.engagement_level} engagement</span>
          <span class="pl-tag">${esc(b.recommended_ad_type)}</span>
          <span class="pl-tag">${esc(b.audience_mindset || '')}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* ── Pricing Tool ───────────────────────────────────────────────────────── */
function updatePricingEmpty() {
  if (!audienceData) return;
  document.getElementById('pricing-empty').style.display = 'none';
  document.getElementById('pricing-content').style.display = 'block';

  const pot = audienceData.monthly_revenue_potential || 0;
  const floor = Math.round(pot * 0.5);
  const ceiling = Math.round(pot * 1.5);

  document.getElementById('pt-floor').textContent = '$' + floor.toLocaleString() + '/mo';
  document.getElementById('pt-rec').textContent = '$' + pot.toLocaleString() + '/mo';
  document.getElementById('pt-ceiling').textContent = '$' + ceiling.toLocaleString() + '/mo';

  const cpm = audienceData.cpm_benchmark || 30;
  const deals = [
    {type: 'Pre-roll', mult: 0.7},
    {type: 'Mid-roll', mult: 1.0},
    {type: 'Host-read', mult: 1.3},
    {type: 'Exclusive', mult: 1.6},
  ];
  const maxVal = cpm * 1.6;
  document.getElementById('cpm-table').innerHTML = deals.map(d => {
    const val = Math.round(cpm * d.mult * 10) / 10;
    const pct = Math.round(val / maxVal * 100);
    return `
      <div class="cpm-row">
        <div class="cpm-type">${d.type}</div>
        <div class="cpm-bar-wrap"><div class="cpm-bar-fill" style="width:${pct}%"></div></div>
        <div class="cpm-val">$${val} CPM</div>
      </div>`;
  }).join('');

  const q = audienceData.audience_quality_score || 0;
  document.getElementById('pt-quality').textContent = q + '/100';
  document.getElementById('pt-quality-fill').style.width = q + '%';
  document.getElementById('pt-persona').textContent = audienceData.audience_persona || '—';
}

/* ── Pitch generation ───────────────────────────────────────────────────── */
async function generatePitch(sponsorName) {
  const sponsor = sponsorList.find(s => s.name === sponsorName) || { name: sponsorName };
  if (!profile) { alert('Please run the AI Analysis first.'); return; }

  showScreen('pitch');
  document.getElementById('pitch-empty').style.display = 'none';
  document.getElementById('pitch-builder').style.display = 'block';
  document.getElementById('pitch-loading').style.display = 'flex';

  document.getElementById('pb-sponsor').textContent = sponsorName;
  const webBtn = document.getElementById('pb-website');
  if (webBtn) {
    webBtn.href = sponsor.website || '#';
    webBtn.style.display = sponsor.website ? 'inline-block' : 'none';
  }
  document.getElementById('pb-subject').textContent = '—';
  document.getElementById('pb-body').textContent = '—';
  document.getElementById('pb-followup').textContent = '—';
  document.getElementById('pb-rate').textContent = '—';
  document.getElementById('pb-range').textContent = '—';
  document.getElementById('pb-strength-val').textContent = '—';
  document.getElementById('pb-strength-fill').style.width = '0%';

  try {
    const r = await post('/api/generate-pitch', {
      podcast_profile: profile,
      sponsor_name: sponsor.name,
      sponsor_category: sponsor.category || '',
      deal_type: 'host-read',
      episodes_per_month: profile.episodes_per_month || 4,
      match_reason: sponsor.match_reason || sponsor.outreach_angle || '',
    });
    currentPitch = r;

    document.getElementById('pitch-loading').style.display = 'none';
    document.getElementById('pb-subject').textContent = r.subject_line || '—';
    document.getElementById('pb-body').textContent = r.email_body || '—';
    document.getElementById('pb-followup').textContent = r.follow_up || '—';
    document.getElementById('pb-rate').textContent = r.recommended_rate ? '$' + r.recommended_rate.toLocaleString() + '/mo' : '—';
    document.getElementById('pb-range').textContent = r.rate_range
      ? '$' + r.rate_range.floor.toLocaleString() + ' – $' + r.rate_range.ceiling.toLocaleString()
      : '—';
    const score = r.pitch_strength_score || 0;
    document.getElementById('pb-strength-val').textContent = score + '/100';
    document.getElementById('pb-strength-fill').style.width = score + '%';
    pollUsage();
  } catch(err) {
    document.getElementById('pitch-loading').style.display = 'none';
    document.getElementById('pb-subject').textContent = 'Error: ' + err.message;
  }
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function copyEl(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const card = document.getElementById(id).closest('.surface-card, .pitch-panel');
    const btn = card ? card.querySelector('.copy-btn') : null;
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = '✓ Copied'; btn.style.color = 'var(--success)';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 2000);
  });
}

async function pollUsage() {
  try {
    const r = await fetch(API + '/health');
    const d = await r.json();
    const u = d.session_usage;
    if (u.calls > 0) {
      document.getElementById('usage-row').style.display = 'block';
      document.getElementById('sidebar-cost').textContent = '$' + u.cost_usd.toFixed(4);
      document.getElementById('sidebar-calls').textContent = u.calls;
    }
  } catch(_){}
}

function showError(msg) {
  const el = document.getElementById('setup-error');
  document.getElementById('setup-error-msg').textContent = msg;
  el.style.display = 'flex';
}
function hideError() { document.getElementById('setup-error').style.display = 'none'; }

async function post(path, body) {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) { const t = await r.text(); throw new Error(r.status + ': ' + t.slice(0, 200)); }
  return r.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function esc(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(s || ''));
  return d.innerHTML;
}

/* ── Extra CSS injected for dashboard list items ────────────────────────── */
const style = document.createElement('style');
style.textContent = `
  .actions-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .action-item { font-size: 13px; color: var(--muted); padding: 10px 12px; background: rgba(255,255,255,.03); border-radius: 6px; border-left: 2px solid var(--accent); }
  .action-item strong { color: var(--text); }
  .pipeline-sponsor-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer; transition: opacity .15s; }
  .pipeline-sponsor-row:last-child { border-bottom: none; }
  .pipeline-sponsor-row:hover { opacity: .8; }
  .ps-info { flex: 1; }
  .ps-name { font-size: 13px; font-weight: 600; }
  .ps-cat { font-size: 11px; color: var(--muted); }
  .ps-score { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--accent); background: rgba(233,69,96,.1); border: 1px solid rgba(233,69,96,.2); padding: 2px 8px; border-radius: 50px; }
  .ps-deal { font-size: 13px; font-weight: 600; }
  .success { color: var(--success) !important; }
`;
document.head.appendChild(style);

/* ── Export to PDF ──────────────────────────────────────────────────────── */
function exportPDF() {
  const btn = document.getElementById('btn-export-pdf');
  const origText = btn.innerHTML;
  btn.innerHTML = '⏳ Generating...';
  btn.disabled = true;

  // We want to capture the dashboard screen
  const element = document.getElementById('screen-dashboard');
  
  // Create a clone to adjust styling for PDF if necessary, or just print directly
  // html2pdf has a nice api:
  const opt = {
    margin:       [10, 10, 10, 10], // top, left, bottom, right
    filename:     \`PodMonetize_Report_\${profile.name.replace(/\\s+/g, '_')}.pdf\`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Temporarily adjust some styles for better PDF output if needed
  const originalHeight = element.style.height;
  element.style.height = 'auto'; // allow full render

  html2pdf().set(opt).from(element).save().then(() => {
    btn.innerHTML = '✓ Downloaded';
    setTimeout(() => {
      btn.innerHTML = origText;
      btn.disabled = false;
    }, 2000);
    element.style.height = originalHeight;
  }).catch(err => {
    console.error('PDF generation failed:', err);
    btn.innerHTML = '⚠ Error';
    setTimeout(() => {
      btn.innerHTML = origText;
      btn.disabled = false;
    }, 2000);
  });
}
