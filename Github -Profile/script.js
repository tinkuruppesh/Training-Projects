/**
 * GitScope — script.js
 * GitHub Profile Finder using the GitHub Public API.
 * No backend required. No API key needed (rate limited at 60 req/hr).
 *
 * Features:
 *  - Live API fetch (user + repos)
 *  - Animated skeleton loader
 *  - Animated number counters
 *  - Language usage bars
 *  - Top 5 repo cards
 *  - Simulated activity pulse grid
 *  - Dark/light theme toggle
 *  - Copy profile link with toast
 *  - Download as PDF via print
 *  - Recent search history (localStorage)
 *  - Auto-suggest from history
 */

/* ── DOM References ─────────────────────────────────── */
const searchInput  = document.getElementById('searchInput');
const searchBtn    = document.getElementById('searchBtn');
const themeToggle  = document.getElementById('themeToggle');
const skeletonWrap = document.getElementById('skeletonWrap');
const errorCard    = document.getElementById('errorCard');
const errorMsg     = document.getElementById('errorMsg');
const profileWrap  = document.getElementById('profileWrap');
const recentWrap   = document.getElementById('recentWrap');
const recentChips  = document.getElementById('recentChips');
const clearHistory = document.getElementById('clearHistory');
const suggestList  = document.getElementById('suggestList');
const copyBtn      = document.getElementById('copyBtn');
const copyBtnText  = document.getElementById('copyBtnText');
const downloadBtn  = document.getElementById('downloadBtn');

/* ── State ──────────────────────────────────────────── */
let currentProfile = null;               // Holds current user object
const HISTORY_KEY  = 'gitscope_history'; // localStorage key

/* ── Language color palette ─────────────────────────── */
const LANG_COLORS = {
  JavaScript:'#f7df1e', TypeScript:'#3178c6', Python:'#3572a5',
  Java:'#b07219',       Ruby:'#701516',       Go:'#00add8',
  Rust:'#dea584',       C:'#555555',          'C++':'#f34b7d',
  'C#':'#178600',       PHP:'#4f5d95',        Swift:'#fa7343',
  Kotlin:'#a97bff',     Dart:'#00b4ab',       HTML:'#e34c26',
  CSS:'#563d7c',        Shell:'#89e051',      Vue:'#41b883',
  Scala:'#c22d40',      Haskell:'#5d4f85',
};

/** Returns a color for a language, falling back to a generated hue. */
function langColor(lang) {
  if (!lang) return '#888';
  if (LANG_COLORS[lang]) return LANG_COLORS[lang];
  // Generate a deterministic hue from the lang name
  let hash = 0;
  for (let i = 0; i < lang.length; i++) hash = lang.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${hash % 360}, 60%, 55%)`;
}

/* ── Theme ──────────────────────────────────────────── */
(function initTheme() {
  const saved = localStorage.getItem('gitscope_theme') || 'dark';
  document.documentElement.dataset.theme = saved;
})();

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('gitscope_theme', next);
});

/* ── Search Triggers ────────────────────────────────── */
searchBtn.addEventListener('click', () => doSearch());
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

/** Main search entry point */
function doSearch() {
  const username = searchInput.value.trim();
  if (!username) { searchInput.focus(); return; }
  closeSuggest();
  fetchProfile(username);
}

/* ── API Fetch ──────────────────────────────────────── */
async function fetchProfile(username) {
  showSkeleton();

  try {
    // Fetch user and repos in parallel
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`),
    ]);

    if (!userRes.ok) {
      throw new Error(userRes.status === 404
        ? `No GitHub user found with username "${username}".`
        : `GitHub API error: ${userRes.status} – ${userRes.statusText}`);
    }

    const user  = await userRes.json();
    const repos = reposRes.ok ? await reposRes.json() : [];

    currentProfile = { user, repos };
    saveHistory(username);
    renderProfile(user, repos);

  } catch (err) {
    showError(err.message);
  }
}

/* ── Render ─────────────────────────────────────────── */
function renderProfile(user, repos) {
  hideSkeleton();
  hideError();

  // -- Avatar & name --
  document.getElementById('avatar').src       = user.avatar_url;
  document.getElementById('profileName').textContent = user.name || user.login;

  const loginEl = document.getElementById('profileLogin');
  loginEl.textContent = `@${user.login}`;
  loginEl.href        = user.html_url;

  document.getElementById('profileBio').textContent = user.bio || '';

  // -- Details (location, company, blog, twitter) --
  const detailsEl = document.getElementById('profileDetails');
  detailsEl.innerHTML = '';
  const details = [
    { icon: locationIcon(),  text: user.location },
    { icon: companyIcon(),   text: user.company },
    { icon: linkIcon(),      text: user.blog, href: normalizeUrl(user.blog) },
    { icon: twitterIcon(),   text: user.twitter_username ? `@${user.twitter_username}` : null,
                              href: user.twitter_username ? `https://twitter.com/${user.twitter_username}` : null },
  ];
  details.forEach(({ icon, text, href }) => {
    if (!text) return;
    const div = document.createElement('div');
    div.className = 'detail-item';
    div.innerHTML = icon;
    if (href) {
      const a = document.createElement('a');
      a.href = href; a.textContent = text;
      a.target = '_blank'; a.rel = 'noopener';
      a.style.cssText = 'color:inherit;text-decoration:none;';
      a.onmouseenter = () => a.style.textDecoration = 'underline';
      a.onmouseleave = () => a.style.textDecoration = 'none';
      div.appendChild(a);
    } else {
      div.appendChild(document.createTextNode(text));
    }
    detailsEl.appendChild(div);
  });

  // -- Visit / Copy buttons --
  document.getElementById('visitBtn').href = user.html_url;

  // -- Stats --
  const statsRow = document.getElementById('statsRow');
  statsRow.innerHTML = '';
  const stats = [
    { label: 'Followers',   value: user.followers },
    { label: 'Following',   value: user.following },
    { label: 'Public Repos',value: user.public_repos },
  ];
  stats.forEach(({ label, value }) => {
    const div = document.createElement('div');
    div.className = 'stat-item';
    div.innerHTML = `<div class="stat-value" data-target="${value}">0</div>
                     <div class="stat-label">${label}</div>`;
    statsRow.appendChild(div);
  });

  // Show profile
  profileWrap.hidden = false;

  // Animate counters after a tick
  requestAnimationFrame(() => animateCounters());

  // -- Language bars --
  renderLanguages(repos);

  // -- Top repos --
  renderRepos(repos);

  // -- Activity grid --
  renderActivity(repos);

  // Scroll into view smoothly
  profileWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Animated Counters ──────────────────────────────── */
function animateCounters() {
  document.querySelectorAll('.stat-value[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1200;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/** Format large numbers: 1200 → 1.2k */
function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return n.toString();
}

/* ── Language Bars ──────────────────────────────────── */
function renderLanguages(repos) {
  const langBars = document.getElementById('langBars');
  langBars.innerHTML = '';

  // Count repos per language
  const counts = {};
  repos.forEach(r => {
    if (r.language) counts[r.language] = (counts[r.language] || 0) + 1;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) { document.getElementById('langSection').hidden = true; return; }
  document.getElementById('langSection').hidden = false;

  // Sort and take top 8
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  sorted.forEach(([lang, count], i) => {
    const pct = ((count / total) * 100).toFixed(1);
    const color = langColor(lang);
    const row = document.createElement('div');
    row.className = 'lang-row';
    row.innerHTML = `
      <div class="lang-header">
        <span class="lang-name">
          <span class="lang-dot" style="background:${color}"></span>
          ${escapeHtml(lang)}
        </span>
        <span class="lang-pct">${pct}%</span>
      </div>
      <div class="lang-track">
        <div class="lang-fill" style="background:${color}" data-width="${pct}%"></div>
      </div>
    `;
    langBars.appendChild(row);
  });

  // Animate bars after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.lang-fill').forEach(el => {
        el.style.width = el.dataset.width;
      });
    });
  });
}

/* ── Repos Grid ─────────────────────────────────────── */
function renderRepos(repos) {
  const grid = document.getElementById('reposGrid');
  grid.innerHTML = '';

  // Top 5 by stars, then forks
  const top = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count)
    .slice(0, 5);

  if (top.length === 0) { document.getElementById('reposSection').hidden = true; return; }
  document.getElementById('reposSection').hidden = false;

  top.forEach(repo => {
    const card = document.createElement('a');
    card.className = 'repo-card';
    card.href      = repo.html_url;
    card.target    = '_blank';
    card.rel       = 'noopener';
    card.setAttribute('aria-label', `Repository: ${repo.name}`);

    const color = langColor(repo.language);
    card.innerHTML = `
      <div class="repo-name">${escapeHtml(repo.name)}</div>
      <div class="repo-desc">${escapeHtml(repo.description || 'No description provided.')}</div>
      <div class="repo-meta">
        ${repo.language ? `
          <span class="repo-stat">
            <span class="repo-lang-dot" style="background:${color}"></span>
            ${escapeHtml(repo.language)}
          </span>` : ''}
        <span class="repo-stat">
          ${starIcon()}
          ${formatNumber(repo.stargazers_count)}
        </span>
        <span class="repo-stat">
          ${forkIcon()}
          ${formatNumber(repo.forks_count)}
        </span>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ── Activity Pulse (Simulated) ─────────────────────── */
/**
 * GitHub's contribution graph requires auth.
 * We simulate a visually convincing grid using push_at dates from repos.
 */
function renderActivity(repos) {
  const grid    = document.getElementById('activityGrid');
  const section = document.getElementById('activitySection');
  grid.innerHTML = '';

  const WEEKS   = 26; // 6 months
  const DAYS    = 7;
  const CELLS   = WEEKS * DAYS;

  // Build a map of date → intensity from recent repo updates
  const dateMap = {};
  repos.forEach(r => {
    if (r.pushed_at) {
      const key = r.pushed_at.slice(0, 10);
      dateMap[key] = (dateMap[key] || 0) + 1;
    }
    if (r.updated_at) {
      const key = r.updated_at.slice(0, 10);
      dateMap[key] = Math.max(dateMap[key] || 0, 1);
    }
  });

  const now = new Date();

  for (let i = CELLS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = dateMap[key] || 0;

    const cell = document.createElement('div');
    cell.className = 'act-cell';
    cell.title     = `${key}: ${count} event${count !== 1 ? 's' : ''}`;

    if (count === 0) {
      // Add slight random noise for visual depth
      const noise = Math.random();
      if (noise > 0.92) cell.classList.add('l1');
    } else if (count === 1)     cell.classList.add('l1');
    else if (count <= 3)        cell.classList.add('l2');
    else if (count <= 6)        cell.classList.add('l3');
    else                        cell.classList.add('l4');

    grid.appendChild(cell);
  }

  section.hidden = false;
}

/* ── Copy Profile Link ──────────────────────────────── */
copyBtn.addEventListener('click', async () => {
  if (!currentProfile) return;
  const url = currentProfile.user.html_url;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  copyBtnText.textContent = 'Copied!';
  copyBtn.classList.add('copied');
  setTimeout(() => {
    copyBtnText.textContent = 'Copy Link';
    copyBtn.classList.remove('copied');
  }, 2000);
});

/* ── Download as PDF ────────────────────────────────── */
downloadBtn.addEventListener('click', () => {
  if (!currentProfile) return;
  window.print();
});

/* Add print styles inline */
const printStyle = document.createElement('style');
printStyle.textContent = `
  @media print {
    .site-header, .hero, .profile-actions, #activitySection,
    .recent-wrap, .search-wrap { display: none !important; }
    body { background: white !important; color: black !important; }
    .glass, .repo-card, .lang-bars, .activity-grid {
      background: white !important; border: 1px solid #ccc !important;
      box-shadow: none !important; backdrop-filter: none !important;
    }
    .profile-name, .stat-value, .section-title, .repo-name { color: black !important; }
    .profile-login, .profile-bio, .profile-details, .stat-label,
    .repo-desc, .repo-stat, .lang-name, .lang-pct { color: #444 !important; }
    body::before, body::after { display: none !important; }
    .avatar-ring::before { display: none !important; }
    .content { max-width: 100% !important; }
  }
`;
document.head.appendChild(printStyle);

/* ── Recent Search History ──────────────────────────── */
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch { return []; }
}

function saveHistory(username) {
  let history = loadHistory().filter(u => u.toLowerCase() !== username.toLowerCase());
  history.unshift(username);
  history = history.slice(0, 8); // max 8 entries
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = loadHistory();
  if (history.length === 0) { recentWrap.hidden = true; return; }
  recentWrap.hidden = false;
  recentChips.innerHTML = '';
  history.forEach(name => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = name;
    chip.addEventListener('click', () => {
      searchInput.value = name;
      doSearch();
    });
    recentChips.appendChild(chip);
  });
}

clearHistory.addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  recentWrap.hidden = true;
});

// Init history on load
renderHistory();

/* ── Auto-suggest from History ──────────────────────── */
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { closeSuggest(); return; }
  const matches = loadHistory().filter(u => u.toLowerCase().startsWith(q) && u.toLowerCase() !== q);
  if (matches.length === 0) { closeSuggest(); return; }
  suggestList.innerHTML = '';
  matches.slice(0, 5).forEach(name => {
    const li = document.createElement('li');
    li.innerHTML = `${searchIcon()}<span>${escapeHtml(name)}</span>`;
    li.addEventListener('click', () => {
      searchInput.value = name;
      closeSuggest();
      doSearch();
    });
    suggestList.appendChild(li);
  });
  suggestList.classList.add('open');
});

searchInput.addEventListener('blur', () => {
  // Delay to allow click on suggest items
  setTimeout(closeSuggest, 150);
});

function closeSuggest() {
  suggestList.classList.remove('open');
}

/* ── State Helpers ──────────────────────────────────── */
function showSkeleton() {
  profileWrap.hidden = true;
  errorCard.hidden   = true;
  skeletonWrap.hidden = false;
}
function hideSkeleton() {
  skeletonWrap.hidden = true;
}
function showError(msg) {
  hideSkeleton();
  profileWrap.hidden = true;
  errorCard.hidden   = false;
  errorMsg.textContent = msg;
}
function hideError() {
  errorCard.hidden = true;
}

/* ── Inline SVG Icons ───────────────────────────────── */
function searchIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
}
function locationIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/></svg>`;
}
function companyIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/></svg>`;
}
function linkIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
}
function twitterIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>`;
}
function starIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}
function forkIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="6" y1="3" x2="6" y2="15"/>
    <circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
    <path d="M18 9a9 9 0 0 1-9 9"/></svg>`;
}

/* ── Utilities ──────────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function normalizeUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `https://${url}`;
}
