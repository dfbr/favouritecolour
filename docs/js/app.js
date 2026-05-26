/**
 * app.js
 * Main application controller for the Favourite Colour app.
 *
 * Responsibilities:
 *   • Screen transitions (welcome → comparing → results)
 *   • Rendering colour pairs and recording user choices
 *   • Session persistence via Storage
 *   • Results display and share/URL update for analytics
 *
 * Depends on: colours.js, algorithms.js, storage.js (loaded before this file)
 */

/* ══════════════════════════════════════════════
   Application state
   ══════════════════════════════════════════════ */

let ranker  = null;   /* Active TennisLadder or ChessRanking instance */
let session = null;   /* Session metadata: { palette, method, startedAt, complete } */
let choiceInProgress = false;  /* Prevent double-clicks */

/* ══════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════ */

/* WCAG relative-luminance coefficients (ITU-R BT.709) */
const WCAG_R = 0.2126;
const WCAG_G = 0.7152;
const WCAG_B = 0.0722;
/* Luminance threshold above which black text is used (≈ 4.5:1 contrast) */
const CONTRAST_THRESHOLD = 0.179;

/* Show "early results" button after this fraction of estimated comparisons */
const EARLY_RESULTS_FRACTION = 0.4;
/* Lightweight obfuscation key for analytics result token */
const RESULTS_TOKEN_KEY = 'favourite-colour-results-v1';
/* Encoded token layout: version|algorithm|winner|top10|checksum */
const RESULT_TOKEN_PARTS = 5;
/* Checksum modulus equals 36^3 (fits in 3 base36 chars) */
const CHECKSUM_MODULO = 46656;

/* ══════════════════════════════════════════════
   DOM references
   ══════════════════════════════════════════════ */

/* Screens */
const screens = {
  welcome:   document.getElementById('screen-welcome'),
  comparing: document.getElementById('screen-comparing'),
  results:   document.getElementById('screen-results'),
};

/* Welcome */
const formSetup       = document.getElementById('form-setup');
const resumePrompt    = document.getElementById('resume-prompt');
const btnResume       = document.getElementById('btn-resume');
const btnNewSession   = document.getElementById('btn-new-session');
const estComparisons  = document.getElementById('est-comparisons');

/* Comparing */
const btnBack         = document.getElementById('btn-back');
const btnDebug        = document.getElementById('btn-debug');
const btnEarlyResults = document.getElementById('btn-early-results');
const progressText    = document.getElementById('progress-text');
const progressBar     = document.getElementById('progress-bar');
const swatchA         = document.getElementById('swatch-a');
const swatchB         = document.getElementById('swatch-b');
const labelA          = document.getElementById('label-a');
const labelB          = document.getElementById('label-b');
const debugPanel      = document.getElementById('debug-panel');
const debugOutput     = document.getElementById('debug-output');

/* Results */
const winnerColour    = document.getElementById('winner-colour');
const winnerName      = document.getElementById('winner-name');
const winnerHex       = document.getElementById('winner-hex');
const rankingList     = document.getElementById('ranking-list');
const btnShare        = document.getElementById('btn-share');
const btnRestart      = document.getElementById('btn-restart');

/* ══════════════════════════════════════════════
   Initialisation
   ══════════════════════════════════════════════ */

function init() {
  const saved = Storage.load();
  if (saved && saved.session && !saved.session.complete) {
    /* Show resume prompt, hide the setup form */
    resumePrompt.classList.remove('hidden');
    formSetup.classList.add('hidden');
  } else {
    resumePrompt.classList.add('hidden');
    formSetup.classList.remove('hidden');
  }
  showScreen('welcome');
  updateEstimate();
}

/* ══════════════════════════════════════════════
   Screen management
   ══════════════════════════════════════════════ */

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

/* ══════════════════════════════════════════════
   Welcome screen
   ══════════════════════════════════════════════ */

/** Update the "≈ N comparisons" estimate whenever options change. */
function updateEstimate() {
  if (!estComparisons) return;
  const palette = (formSetup.querySelector('input[name="palette"]:checked') || {}).value || '16';
  const method  = (formSetup.querySelector('input[name="method"]:checked')  || {}).value || 'tennis';
  const est     = estimateComparisons(palette, method);
  estComparisons.textContent = `≈ ${est} comparisons`;
}

formSetup.addEventListener('change', updateEstimate);

formSetup.addEventListener('submit', e => {
  e.preventDefault();
  const data      = new FormData(formSetup);
  const palette   = data.get('palette');
  const method    = data.get('method');
  const showNames = data.has('showNames');
  startNewSession(palette, method, showNames);
});

btnResume.addEventListener('click', () => {
  const saved = Storage.load();
  if (saved) restoreSession(saved);
});

btnNewSession.addEventListener('click', () => {
  Storage.clear();
  resumePrompt.classList.add('hidden');
  formSetup.classList.remove('hidden');
  updateEstimate();
});

/* ══════════════════════════════════════════════
   Session management
   ══════════════════════════════════════════════ */

function startNewSession(palette, method, showNames) {
  const colours = getColourSet(palette);
  session = { palette, method, showNames: !!showNames, startedAt: Date.now(), complete: false };

  ranker = method === 'tennis'
    ? new TennisLadder(colours)
    : new ChessRanking(colours);

  Storage.save(session, ranker);
  showComparingScreen();
}

function restoreSession(saved) {
  session = saved.session;
  const state = saved.rankerState;

  ranker = session.method === 'tennis'
    ? new TennisLadder(null, state)
    : new ChessRanking(null, state);

  if (ranker.complete || session.complete) {
    showResultsScreen();
  } else {
    showComparingScreen();
  }
}

/* ══════════════════════════════════════════════
   Comparing screen
   ══════════════════════════════════════════════ */

function showComparingScreen() {
  showScreen('comparing');
  renderPair();
}

/** Render the current comparison pair onto the two swatches. */
function renderPair() {
  if (ranker.complete) {
    showResultsScreen();
    return;
  }

  const pair = ranker.currentPair();
  if (!pair) {
    showResultsScreen();
    return;
  }

  const { a, b } = pair;

  /* Apply background colours */
  swatchA.style.backgroundColor = a.hex;
  swatchB.style.backgroundColor = b.hex;

  /* Label text */
  labelA.textContent = session.showNames ? (a.name || a.hex) : '';
  labelB.textContent = session.showNames ? (b.name || b.hex) : '';

  /* Accessible label (for screen readers) */
  swatchA.setAttribute('aria-label', `Choose ${a.name || a.hex}`);
  swatchB.setAttribute('aria-label', `Choose ${b.name || b.hex}`);

  /* Contrast-aware label colour */
  const contrastA = _contrastColour(a.hex);
  const contrastB = _contrastColour(b.hex);
  labelA.style.color      = contrastA;
  labelB.style.color      = contrastB;
  labelA.style.borderColor = contrastA === '#000000' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)';
  labelB.style.borderColor = contrastB === '#000000' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)';

  /* Progress */
  const done  = ranker.comparisons;
  const total = ranker.estimatedTotal();
  const pct   = Math.min(100, Math.round((done / total) * 100));
  progressText.textContent = `${done} / ~${total}`;
  progressBar.style.width  = `${pct}%`;

  /* Show "early results" button once a meaningful fraction is done */
  if (done >= Math.ceil(total * EARLY_RESULTS_FRACTION)) {
    btnEarlyResults.classList.remove('hidden');
  }

  /* Refresh debug panel if open */
  if (!debugPanel.classList.contains('hidden')) _updateDebug();
}

/* Handle swatch button clicks */
swatchA.addEventListener('click', () => _handleChoice('a'));
swatchB.addEventListener('click', () => _handleChoice('b'));

/* Keyboard: A/ArrowLeft for left swatch, B/ArrowRight for right swatch */
document.addEventListener('keydown', e => {
  if (!screens.comparing.classList.contains('active')) return;
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')  _handleChoice('a');
  if (e.key === 'b' || e.key === 'B' || e.key === 'ArrowRight') _handleChoice('b');
});

function _handleChoice(which) {
  if (choiceInProgress) return;      /* Debounce */
  const pair = ranker.currentPair();
  if (!pair) return;

  choiceInProgress = true;

  const winnerId = which === 'a' ? pair.a.id : pair.b.id;
  const chosen   = which === 'a' ? swatchA : swatchB;

  /* Visual feedback: flash the chosen swatch */
  chosen.classList.add('chosen');

  setTimeout(() => {
    chosen.classList.remove('chosen');
    ranker.recordChoice(winnerId);
    Storage.save(session, ranker);
    renderPair();
    choiceInProgress = false;
  }, 180);
}

btnBack.addEventListener('click', () => showScreen('welcome'));

btnEarlyResults.addEventListener('click', () => {
  /* Force-complete the session so results can be shown from partial state */
  ranker.complete = true;
  showResultsScreen();
});

btnDebug.addEventListener('click', () => {
  debugPanel.classList.toggle('hidden');
  if (!debugPanel.classList.contains('hidden')) _updateDebug();
});

function _updateDebug() {
  const ranking = ranker.getRanking().slice(0, 8);
  debugOutput.textContent = JSON.stringify({
    method:      session.method,
    comparisons: ranker.comparisons,
    estimated:   ranker.estimatedTotal(),
    complete:    ranker.complete,
    top:         ranking.map(r => `#${r.rank} ${r.colour.name || r.colour.hex}`),
  }, null, 2);
}

/* ══════════════════════════════════════════════
   Results screen
   ══════════════════════════════════════════════ */

function showResultsScreen() {
  showScreen('results');

  const ranking = ranker.getRanking();
  if (!ranking.length) return;

  const winner = ranking[0].colour;

  /* Hero swatch */
  winnerColour.style.backgroundColor = winner.hex;
  winnerName.textContent  = winner.name || winner.hex;
  winnerHex.textContent   = winner.hex;

  /* Accessible label colour for winner name */
  winnerName.style.color = _contrastColour(winner.hex);

  /* Full ranking list */
  rankingList.innerHTML = '';
  ranking.forEach(({ colour, rank }) => {
    const li = document.createElement('li');
    li.className = 'ranking-item';
    li.innerHTML = `
      <span class="rank-number">${rank}</span>
      <span class="rank-swatch" style="background:${colour.hex}" title="${colour.hex}"></span>
      <span class="rank-name">${colour.name || colour.hex}</span>
    `;
    rankingList.appendChild(li);
  });

  /* Encode result details into a compact token for URL + analytics path */
  const resultToken = _encodeResultToken(ranking, session ? session.method : 'tennis');
  try {
    history.replaceState(null, '', `?r=${resultToken}`);
  } catch (_) { /* may fail on file:// */ }

  /* Fire GoatCounter event if the tracker is loaded */
  if (window.goatcounter && typeof window.goatcounter.count === 'function') {
    window.goatcounter.count({ path: `results/${resultToken}` });
  }

  /* Mark session complete and persist */
  if (session) {
    session.complete = true;
    Storage.save(session, ranker);
  }
}

btnShare.addEventListener('click', _shareResults);
btnRestart.addEventListener('click', () => {
  Storage.clear();
  choiceInProgress = false;
  resumePrompt.classList.add('hidden');
  formSetup.classList.remove('hidden');
  updateEstimate();
  showScreen('welcome');
});

async function _shareResults() {
  const ranking = ranker.getRanking();
  if (!ranking.length) return;

  const winner = ranking[0].colour;
  const text   = `My favourite colour is ${winner.name || winner.hex} (${winner.hex}) 🎨`;
  const url    = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'My Favourite Colour', text, url });
      return;
    } catch (_) { /* user cancelled or not supported */ }
  }
  /* Clipboard fallback */
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    _toast('Copied to clipboard!');
  } catch (_) {
    _toast(`${winner.hex}`);
  }
}

/* ══════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════ */

/**
 * Choose black or white for text overlaid on a given hex background.
 * Uses the WCAG relative luminance formula.
 * @param {string} hex  e.g. '#FF0000'
 * @returns {'#000000'|'#ffffff'}
 */
function _contrastColour(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = WCAG_R * r + WCAG_G * g + WCAG_B * b;
  return lum > CONTRAST_THRESHOLD ? '#000000' : '#ffffff';
}

/** Show a brief toast notification. */
function _toast(msg) {
  const el      = document.createElement('div');
  el.className  = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  /* Trigger animation */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('toast--visible'));
  });
  setTimeout(() => {
    el.classList.remove('toast--visible');
    setTimeout(() => el.remove(), 400);
  }, 2200);
}

/** Encode algorithm + winner + top10 colours into an obfuscated URL-safe token. */
function _encodeResultToken(ranking, method) {
  const top10 = ranking
    .slice(0, 10)
    .map(({ colour }) => colour.hex.replace('#', '').toUpperCase());

  const winner = top10[0] || '';
  const algo = method === 'elo' ? 'e' : 't';
  const payload = `v1|${algo}|${winner}|${top10.join('.')}`;
  const checksum = _simpleChecksum(payload).toString(36).padStart(3, '0');
  const packed = `${payload}|${checksum}`;
  const obfuscated = _xorString(packed, RESULTS_TOKEN_KEY);

  return _base64UrlEncode(obfuscated);
}

/**
 * Decode a result token back into structured data.
 * Useful for interpreting GoatCounter paths like results/<token>.
 * Returns null when token is invalid/tampered.
 */
function _decodeResultToken(token) {
  try {
    const packed = _xorString(_base64UrlDecode(token), RESULTS_TOKEN_KEY);
    const parts = packed.split('|');
    if (parts.length !== RESULT_TOKEN_PARTS || parts[0] !== 'v1') return null;

    const payload = parts.slice(0, 4).join('|');
    const checksum = parseInt(parts[4], 36);
    if (Number.isNaN(checksum) || checksum !== _simpleChecksum(payload)) return null;

    const algo = parts[1] === 'e' ? 'elo' : 'tennis';
    const winner = parts[2];
    const top10 = parts[3] ? parts[3].split('.').filter(Boolean) : [];
    return {
      algorithm: algo,
      favourite: winner ? `#${winner}` : null,
      top10: top10.map(hex => `#${hex}`),
    };
  } catch (_) {
    return null;
  }
}

function _simpleChecksum(input) {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum = ((sum * 31) + input.charCodeAt(i)) % CHECKSUM_MODULO;
  }
  return sum;
}

function _xorString(input, key) {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    out += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

function _base64UrlEncode(input) {
  return btoa(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function _base64UrlDecode(input) {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return atob(padded);
}

/* Optional helper for owner-side decoding from browser console. */
window.decodeResultToken = _decodeResultToken;

/* ══════════════════════════════════════════════
   Bootstrap
   ══════════════════════════════════════════════ */
init();
