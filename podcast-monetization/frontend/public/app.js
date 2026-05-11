const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API = isLocal ? 'http://localhost:4000' : 'https://podmonetize-backend.onrender.com';
let profile = null, analysisResult = null, audienceData = null, sponsorList = [], currentPitch = null;

const SPONSOR_DB = [
  {"id":"s001","name":"Shopify","category":"Productivity Software","avg_cpm":35,"min_listeners":10000,"max_listeners":500000,"typical_deal_size":3000,"website":"https://www.shopify.com"},
  {"id":"s002","name":"QuickBooks","category":"Accounting Software","avg_cpm":38,"min_listeners":5000,"max_listeners":200000,"typical_deal_size":2500,"website":"https://quickbooks.intuit.com"},
  {"id":"s003","name":"Squarespace","category":"Professional Network","avg_cpm":30,"min_listeners":5000,"max_listeners":1000000,"typical_deal_size":2000,"website":"https://www.squarespace.com"},
  {"id":"s011","name":"Notion","category":"Productivity Software","avg_cpm":28,"min_listeners":5000,"max_listeners":300000,"typical_deal_size":2200,"website":"https://www.notion.so"},
  {"id":"s005","name":"LinkedIn","category":"Professional Network","avg_cpm":36,"min_listeners":20000,"max_listeners":1000000,"typical_deal_size":5000,"website":"https://www.linkedin.com"},
  {"id":"s014","name":"MasterClass","category":"Online Learning","avg_cpm":30,"min_listeners":10000,"max_listeners":500000,"typical_deal_size":3000,"website":"https://www.masterclass.com"}
];

// -- Persistence --
function saveToLocal() {
  const data = { profile, analysisResult, audienceData, sponsorList };
  localStorage.setItem('podmonetize_last_analysis', JSON.stringify(data));
}

function loadFromLocal() {
  const raw = localStorage.getItem('podmonetize_last_analysis');
  if (!raw) {
    // If no data, still try to show defaults for discovery mode
    if (window.location.pathname.includes('sponsors.html')) showAllSponsors();
    if (window.location.pathname.includes('pricing.html')) showManualPricing();
    return;
  }
  try {
    const data = JSON.parse(raw);
    profile = data.profile;
    analysisResult = data.analysisResult;
    audienceData = data.audienceData;
    sponsorList = data.sponsorList;
    
    if (profile) {
      const nameEl = document.getElementById('podcast-name-display');
      if (nameEl) nameEl.textContent = profile.name;
    }
    
    // Call all update functions safely
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof updateSponsorFinder === 'function') updateSponsorFinder();
    if (typeof updateAdPlacement === 'function') updateAdPlacement();
    if (typeof updatePricingEmpty === 'function') updatePricingEmpty();
    pollUsage();
  } catch(e) { console.error('Failed to load local data', e); }
}

// Auto-load on startup
window.addEventListener('DOMContentLoaded', () => {
  loadFromLocal();
  initNavigation();
  initMobileMenu();
  
  // Initialize Editor Bridge
  if (window.editorBridge) {
    window.editorBridge.connect();
    window.editorBridge.onStatusChange((status) => {
      console.log('[App] Editor Bridge status:', status);
      updateEditorStatusUI(status);
    });
  }
});

function updateEditorStatusUI(status) {
  const footer = document.querySelector('.sidebar-footer');
  if (!footer) return;
  
  let statusEl = document.getElementById('editor-status-pill');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'editor-status-pill';
    statusEl.style.fontSize = '9px';
    statusEl.style.marginTop = '12px';
    statusEl.style.padding = '4px 8px';
    statusEl.style.borderRadius = '4px';
    statusEl.style.background = 'rgba(255,255,255,0.05)';
    statusEl.style.display = 'flex';
    statusEl.style.alignItems = 'center';
    statusEl.style.gap = '6px';
    footer.appendChild(statusEl);
  }
  
  const color = status === 'connected' ? 'var(--success)' : 'var(--muted)';
  statusEl.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:${color}"></span> Editor Bridge: ${status}`;
}

function initNavigation() {
  // Navigation is now handled by physical <a> href links
}

function initMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main');
  
  // Create mobile toggle button if it doesn't exist
  if (!document.getElementById('mobile-toggle')) {
    const btn = document.createElement('button');
    btn.id = 'mobile-toggle';
    btn.innerHTML = '☰';
    btn.className = 'mobile-menu-btn';
    btn.onclick = () => {
      sidebar.classList.toggle('active');
    };
    document.body.appendChild(btn);
  }
}

/* -- Navigation -- */
function showScreen(name) {
  const screen = document.getElementById('screen-' + name);
  
  if (!screen) {
    // If we are on a separate page and try to show a screen that isn't here, redirect
    const pages = {
      'dashboard': 'app.html',
      'sponsors': 'sponsors.html',
      'pitch': 'pitch.html',
      'placement': 'placement.html',
      'pricing': 'pricing.html',
      'setup': 'setup.html'
    };
    if (pages[name]) {
      window.location.href = pages[name];
      return;
    }
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  
  if (screen) screen.classList.add('active');
  
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');
  
  // Close sidebar on mobile after selection
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('active');
  
  const main = document.getElementById('main');
  if (main) main.scrollTo(0, 0);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

/* -- Runway Logic -- */
let currentRunwayStep = 1;
function nextRunwayStep(n) {
  document.querySelectorAll('.runway-card').forEach(c => c.classList.remove('active'));
  document.getElementById('runway-step-' + n).classList.add('active');
  
  document.querySelectorAll('.runway-stepper .step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 < n) s.classList.add('done');
    if (i + 1 === n) s.classList.add('active');
  });
  currentRunwayStep = n;
}

function selectPill(el, id, val) {
  el.parentElement.querySelectorAll('.pill-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(id).value = val;
}

function selectAmbition(el, val) {
  document.querySelectorAll('.ambition-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('f-rev-goal').value = val;
}

/* -- Word count -- */
const txEl = document.getElementById('f-transcript');
if (txEl) {
  txEl.addEventListener('input', function () {
    const w = this.value.trim().split(/\s+/).filter(Boolean).length;
    const badge = document.getElementById('wc-badge');
    if (badge) badge.textContent = w + ' words';
  });
}

/* -- Sample data -- */
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
  const el = document.getElementById('f-transcript');
  if (el) el.value = tx;
  const w = tx.trim().split(/\s+/).filter(Boolean).length;
  const badge = document.getElementById('wc-badge');
  if (badge) badge.textContent = w + ' words';
}

/* -- Fetch transcript from YouTube URL -- */
async function fetchYTTranscript(autoRun = false) {
  const url = document.getElementById('f-yt-url').value.trim();
  if (!url) { alert('Please paste a YouTube URL first.'); return; }

  const btn = document.querySelector('.source-input-area .btn-accent');
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Fetching…';

  try {
    const r = await fetch(API + '/api/fetch-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Fetch failed');

    document.getElementById('f-transcript').value = data.transcript;
    btn.textContent = '✓ Fetched';
    btn.style.background = 'var(--success)';
    
    if (autoRun) {
      setTimeout(() => runFullPipeline(), 500);
    }
  } catch(err) {
    alert('Fetch failed: ' + err.message);
    btn.textContent = origText;
    btn.disabled = false;
  }
}


/* -- Build profile -- */
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

/* -- Stage updater -- */
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

/* -- Main pipeline -- */
async function runFullPipeline() {
  const tx = document.getElementById('f-transcript').value.trim();
  if (tx.split(/\s+/).filter(Boolean).length < 50) {
    alert('Transcript must be at least 50 words.');
    return;
  }

  profile = buildProfile();
  showScreen('analysis');
  
  const setNode = (n, status) => {
    const node = document.getElementById('node-' + n);
    node.className = 'pipeline-node ' + status;
    if (status === 'done') node.querySelector('.node-circle').textContent = '✓';
    const msg = {
      1: 'Parsing transcript...',
      2: 'Identifying ad breaks...',
      3: 'Profiling audience...',
      4: 'Matching sponsors...',
      5: 'Calculating pricing...'
    };
    document.getElementById('analysis-status').textContent = msg[n];
  };

  try {
    setNode(1, 'running');
    const r1 = await post('/api/analyze-episode', {
      transcript: tx, episode_duration: 2700, podcast_id: 'live'
    });
    analysisResult = r1;
    setNode(1, 'done');

    setNode(2, 'running');
    await sleep(800);
    setNode(2, 'done');

    setNode(3, 'running');
    const r2 = await post('/api/recommend-sponsors', {
      podcast_id: 'live', podcast_profile: profile, num_recommendations: 5
    });
    audienceData = r2.audience_profile;
    sponsorList = r2.sponsors;
    setNode(3, 'done');

    setNode(4, 'running');
    await sleep(600);
    setNode(4, 'done');

    setNode(5, 'running');
    await sleep(400);
    setNode(5, 'done');

    updateDashboard();
    updateSponsorFinder();
    updateAdPlacement();
    updatePricingEmpty();
    pollUsage();

    // Persist to local storage
    saveToLocal();

    setTimeout(() => showScreen('dashboard'), 500);

  } catch(err) {
    alert('Pipeline error: ' + err.message);
    showScreen('setup');
  }
}

/* -- Dashboard update -- */
function updateDashboard() {
  if (!profile) return; // Safety check
  
  document.getElementById('btn-export-pdf').style.display = 'block';

  const cur = profile.monthly_revenue_current || 0;
  const pot = (audienceData && audienceData.monthly_revenue_potential) || 0;
  const lift = Math.max(0, pot - cur);

  const revenueEl = document.getElementById('kpi-revenue');
  if (revenueEl) revenueEl.textContent = '$' + pot.toLocaleString();
  
  const deltaEl = document.getElementById('kpi-revenue-delta');
  if (deltaEl) deltaEl.textContent = '+$' + lift.toLocaleString() + ' vs current';
  
  const sponsorsEl = document.getElementById('kpi-sponsors');
  if (sponsorsEl) sponsorsEl.textContent = sponsorList.length;
  
  const cpmEl = document.getElementById('kpi-cpm');
  if (cpmEl) cpmEl.textContent = '$' + (audienceData ? audienceData.cpm_benchmark : 0);
  
  const pitchesEl = document.getElementById('kpi-pitches');
  if (pitchesEl) pitchesEl.textContent = sponsorList.length;

  // Hide empty states
  const aiActionsBody = document.getElementById('ai-actions-body');
  if (aiActionsBody) {
    aiActionsBody.classList.remove('empty-state');
    const actions = [
      `📈 Revenue potential: <strong>$${pot.toLocaleString()}/mo</strong>`,
      `🎯 <strong>${sponsorList.length} sponsors</strong> matched — go to Sponsor Finder`,
      `📍 <strong>${(analysisResult ? analysisResult.ad_breaks : []).length} ad breaks</strong> identified — see Ad Placement`,
      `✉️ Generate pitches from the Sponsor Finder`,
    ];
    aiActionsBody.innerHTML = '<ul class="actions-list">' + actions.map(a => `<li class="action-item">${a}</li>`).join('') + '</ul>';
  }

  const pipelineBody = document.getElementById('pipeline-body');
  if (pipelineBody && sponsorList.length > 0) {
    pipelineBody.classList.remove('empty-state');
    const top3 = sponsorList.slice(0, 3);
    pipelineBody.innerHTML = top3.map(s => `
      <div class="pipeline-sponsor-row" onclick="generatePitch('${esc(s.name)}')">
        <div class="ps-info">
          <div class="ps-name">${esc(s.name)}</div>
          <div class="ps-cat">${esc(s.category || '')}</div>
        </div>
        <div class="ps-score">${s.fit_score || 0}</div>
        <div class="ps-deal success dm-mono">$${(s.est_deal_value_monthly||0).toLocaleString()}</div>
      </div>
    `).join('');
  }

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

/* -- Sponsor Finder -- */
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

  renderSponsorGrid(sponsorList);
  
  // Populate categories
  const cats = [...new Set(sponsorList.map(s => s.category))].filter(Boolean);
  const sel = document.getElementById('sp-filter-cat');
  sel.innerHTML = '<option value="all">All Categories</option>' + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
}

function filterSponsors() {
  const cat = document.getElementById('sp-filter-cat').value;
  const sort = document.getElementById('sp-sort').value;
  const q = document.getElementById('sp-search').value.toLowerCase();

  let filtered = sponsorList.filter(s => {
    const matchCat = cat === 'all' || s.category === cat;
    const matchSearch = s.name.toLowerCase().includes(q) || (s.category||'').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  if (sort === 'score') {
    filtered.sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));
  } else if (sort === 'value') {
    filtered.sort((a, b) => (b.est_deal_value_monthly || 0) - (a.est_deal_value_monthly || 0));
  }

  renderSponsorGrid(filtered);
}

function renderSponsorGrid(list) {
  const circ = 2 * Math.PI * 20;
  document.getElementById('sponsors-grid').innerHTML = list.map((s, i) => {
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

/* -- Ad Placement -- */
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

/* -- Pricing Tool -- */
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

  // Set initial slider values
  document.getElementById('pt-cpm-slider').value = cpm;
  document.getElementById('pt-cpm-val').textContent = '$' + cpm;
  document.getElementById('pt-eps-slider').value = profile.episodes_per_month || 4;
  document.getElementById('pt-eps-val').textContent = profile.episodes_per_month || 4;
}

let isExcl = false;
function toggleExcl() {
  isExcl = !isExcl;
  const btn = document.getElementById('pt-excl-toggle');
  btn.textContent = isExcl ? 'ON' : 'OFF';
  btn.classList.toggle('active', isExcl);
  recalcPricing();
}

function recalcPricing() {
  if (!audienceData) return;
  const cpm = parseInt(document.getElementById('pt-cpm-slider').value);
  const eps = parseInt(document.getElementById('pt-eps-slider').value);
  document.getElementById('pt-cpm-val').textContent = '$' + cpm;
  document.getElementById('pt-eps-val').textContent = eps;

  const mult = isExcl ? 1.4 : 1.0;
  const monthly = Math.round(cpm * profile.avg_listeners / 1000 * eps * mult);
  const floor = Math.round(monthly * 0.7);
  const ceiling = Math.round(monthly * 1.5);

  document.getElementById('pt-rec').textContent = '$' + monthly.toLocaleString();
  document.getElementById('pt-floor').textContent = '$' + floor.toLocaleString();
  document.getElementById('pt-ceiling').textContent = '$' + ceiling.toLocaleString();

  // Update CPM table
  const deals = [
    {type: 'Pre-roll', m: 0.7},
    {type: 'Mid-roll', m: 1.0},
    {type: 'Host-read', m: 1.3},
    {type: 'Exclusive', m: 1.6},
  ];
  const maxVal = cpm * 1.6 * mult;
  document.getElementById('cpm-table').innerHTML = deals.map(d => {
    const val = Math.round(cpm * d.m * mult * 10) / 10;
    const pct = Math.round(val / maxVal * 100);
    return `
      <div class="cpm-row">
        <div class="cpm-type">${d.type}</div>
        <div class="cpm-bar-wrap"><div class="cpm-bar-fill" style="width:${pct}%"></div></div>
        <div class="cpm-val">$${val} CPM</div>
      </div>`;
  }).join('');
}

/* -- Pitch generation -- */
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

/* -- Helpers -- */
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

/* -- Individual Page Workflows (Manual/Discovery) -- */

function showAllSponsors() {
  sponsorList = SPONSOR_DB.map(s => ({
    ...s,
    fit_score: 85,
    match_reason: 'Benchmark fit for business/tech podcasts based on industry averages.'
  }));
  updateSponsorFinder();
  document.getElementById('sponsors-empty').style.display = 'none';
  document.getElementById('sponsors-grid').style.display = 'grid';
  document.getElementById('intel-persona').textContent = 'Discovery Mode: Showing Market Benchmarks';
}

function showManualPitchForm() {
  document.getElementById('pitch-empty').style.display = 'none';
  document.getElementById('manual-pitch-form').style.display = 'block';
}

async function generateManualPitch() {
  const name = document.getElementById('m-sponsor-name').value;
  const cat = document.getElementById('m-sponsor-cat').value;
  const hook = document.getElementById('m-hook').value;

  if (!name || !hook) {
    alert('Please provide at least a sponsor name and a hook.');
    return;
  }

  // Ensure a basic profile exists
  if (!profile) {
    profile = { name: 'My Podcast', category: 'Business', avg_listeners: 10000 };
  }

  document.getElementById('manual-pitch-form').style.display = 'none';
  generatePitch(name); // generatePitch already handles the UI transitions
}

function showManualPricing() {
  if (!profile) {
    profile = { name: 'My Podcast', category: 'Business', avg_listeners: 10000, episodes_per_month: 4 };
  }
  audienceData = {
    monthly_revenue_potential: 1200,
    cpm_benchmark: 30,
    audience_quality_score: 75,
    audience_persona: 'Standard Professional Audience'
  };
  updatePricingEmpty();
}

function esc(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(s || ''));
  return d.innerHTML;
}

/* -- Extra CSS injected for dashboard list items -- */
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

/* -- Export to PDF -- */
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
