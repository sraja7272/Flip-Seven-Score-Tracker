'use strict';

// ── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'flipSeven';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── State ─────────────────────────────────────────────────────────────────────
let state = loadState();

// ── App entry ─────────────────────────────────────────────────────────────────
function init() {
  if (!state) {
    renderLanding();
  } else {
    renderPhase();
  }
}

function renderPhase() {
  switch (state.phase) {
    case 'setup':      renderSetup();      break;
    case 'scoring':    renderScoring();    break;
    case 'leaderboard': renderLeaderboard(); break;
    case 'gameover':   renderGameOver();   break;
    default:           renderLanding();
  }
}

// ── Landing ───────────────────────────────────────────────────────────────────
function renderLanding() {
  setApp(`
    <div class="card screen">
      <div class="landing-hero stack text-center">
        <div class="card-suit-deco">🃏</div>
        <h1>Flip Seven</h1>
        <p class="subtitle">Track scores for every round of the push-your-luck card game everyone's obsessed with.</p>
        <div class="landing-rules">
          <h3>Quick Rules</h3>
          <ul>
            <li>Draw cards and collect points — but duplicates bust you to 0</li>
            <li>Collect 7 unique cards for a +15 bonus and end the round instantly</li>
            <li>First player to 200+ points wins — highest score breaks ties</li>
          </ul>
        </div>
        <div class="mt-24">
          <button class="btn btn-primary btn-lg" id="get-started-btn">
            Get Started →
          </button>
        </div>
      </div>
    </div>
  `);
  document.getElementById('get-started-btn').addEventListener('click', goToSetup);
}

// ── Setup ─────────────────────────────────────────────────────────────────────
function goToSetup() {
  state = { phase: 'setup', currentRound: 1, players: [] };
  saveState(state);
  renderSetup();
}

function renderSetup() {
  const existingNames = state.players.map(p => p.name);
  const rows = existingNames.length >= 2
    ? existingNames.map((n, i) => playerRowHTML(i, n))
    : [playerRowHTML(0, ''), playerRowHTML(1, '')];

  setApp(`
    <div class="card screen">
      <h2>Who's Playing?</h2>
      <p class="text-muted mt-8">Add 2–10 players to get started.</p>
      <div class="stack mt-24" id="player-list">
        ${rows.join('')}
      </div>
      <button class="add-player-btn mt-16" id="add-player-btn">+ Add Player</button>
      <div class="mt-24">
        <button class="btn btn-primary" style="width:100%" id="start-game-btn">Start Game →</button>
      </div>
    </div>
  `);

  document.getElementById('add-player-btn').addEventListener('click', addPlayerRow);
  document.getElementById('start-game-btn').addEventListener('click', startGame);
  document.getElementById('player-list').addEventListener('click', handleRemovePlayer);
}

function playerRowHTML(index, value) {
  return `
    <div class="player-row" data-index="${index}">
      <input class="input" type="text" placeholder="Player ${index + 1} name" value="${escHtml(value)}" maxlength="30" />
      <button class="remove-btn" title="Remove">✕</button>
    </div>
  `;
}

function addPlayerRow() {
  const list = document.getElementById('player-list');
  const count = list.querySelectorAll('.player-row').length;
  if (count >= 10) return;
  const div = document.createElement('div');
  div.innerHTML = playerRowHTML(count, '');
  list.appendChild(div.firstElementChild);
}

function handleRemovePlayer(e) {
  if (!e.target.classList.contains('remove-btn')) return;
  const list = document.getElementById('player-list');
  if (list.querySelectorAll('.player-row').length <= 2) return;
  e.target.closest('.player-row').remove();
}

function startGame() {
  const inputs = document.querySelectorAll('#player-list .input');
  const names = [];
  for (const inp of inputs) {
    const name = inp.value.trim();
    if (!name) { inp.focus(); showError('All player names must be filled in.'); return; }
    if (names.includes(name)) { inp.focus(); showError(`Duplicate name: "${name}"`); return; }
    names.push(name);
  }
  if (names.length < 2) { showError('Add at least 2 players.'); return; }

  state = {
    phase: 'scoring',
    currentRound: 1,
    players: names.map(name => ({ name, totalScore: 0, roundScores: [] }))
  };
  saveState(state);
  renderScoring();
}

// ── Scoring ───────────────────────────────────────────────────────────────────
function renderScoring() {
  const rows = state.players.map((p, i) => `
    <div class="score-row score-anim" style="transition-delay:${i * 50}ms">
      <span class="player-label">${escHtml(p.name)}</span>
      <span class="current-total">${p.totalScore} pts</span>
      <label class="bust-label" title="Player busted — score 0 this round">
        <input type="checkbox" class="bust-check" id="bust-${i}" />
        <span class="bust-text">Bust</span>
      </label>
      <input class="input score-input" type="number" min="0" max="999"
             placeholder="Score" id="score-${i}" inputmode="numeric" />
    </div>
  `).join('');

  setApp(`
    <div class="card card-wide screen">
      <div class="top-bar">
        <h2>Round ${state.currentRound}</h2>
        <div class="row" style="gap:8px">
          <span class="round-badge">Round ${state.currentRound}</span>
          <button class="btn btn-danger btn-sm" id="new-game-btn">New Game</button>
        </div>
      </div>
      <p class="text-muted" style="margin-bottom:20px">Enter each player's score for this round.</p>
      <div id="score-rows">${rows}</div>
      <div class="mt-24">
        <button class="btn btn-primary" style="width:100%" id="submit-scores-btn" disabled>Submit Scores →</button>
      </div>
    </div>
  `);

  const submitBtn = document.getElementById('submit-scores-btn');

  function updateSubmitButton() {
    const allFilled = state.players.every((_, i) => {
      const busted = document.getElementById(`bust-${i}`).checked;
      const val = document.getElementById(`score-${i}`).value.trim();
      return busted || val !== '';
    });
    submitBtn.disabled = !allFilled;
  }

  state.players.forEach((_, i) => {
    const checkbox = document.getElementById(`bust-${i}`);
    const scoreInput = document.getElementById(`score-${i}`);

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        scoreInput.value = '';
        scoreInput.disabled = true;
      } else {
        scoreInput.disabled = false;
        scoreInput.focus();
      }
      updateSubmitButton();
    });

    scoreInput.addEventListener('input', updateSubmitButton);
  });

  submitBtn.addEventListener('click', submitScores);
  document.getElementById('new-game-btn').addEventListener('click', confirmNewGame);

  // Animate rows in
  requestAnimationFrame(() => {
    document.querySelectorAll('.score-anim').forEach(el => el.classList.add('visible'));
  });

  // Enter key moves to next input / submits
  const inputs = document.querySelectorAll('.score-input');
  inputs.forEach((inp, i) => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (i < inputs.length - 1) inputs[i + 1].focus();
        else submitBtn.click();
      }
    });
  });

  if (inputs.length > 0) inputs[0].focus();
}

function submitScores() {
  const scores = [];
  for (let i = 0; i < state.players.length; i++) {
    if (document.getElementById(`bust-${i}`).checked) {
      scores.push(0);
      continue;
    }
    const val = document.getElementById(`score-${i}`).value.trim();
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) {
      document.getElementById(`score-${i}`).focus();
      showError('Scores must be 0 or higher.');
      return;
    }
    scores.push(n);
  }

  state.players.forEach((p, i) => {
    p.roundScores.push(scores[i]);
    p.totalScore += scores[i];
  });
  state.currentRound += 1;
  state.phase = 'leaderboard';
  saveState(state);
  renderLeaderboard();
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function renderLeaderboard() {
  const lastRound = state.currentRound - 2; // 0-indexed round index for the just-completed round
  const sorted = [...state.players]
    .map((p, i) => ({ ...p, origIndex: i }))
    .sort((a, b) => b.totalScore - a.totalScore);

  const winners = findWinners(sorted);

  const rows = sorted.map((p, rankIdx) => {
    const roundScore = p.roundScores[lastRound] ?? 0;
    const isWinner = winners.length > 0 && winners[0].name === p.name;
    const overTwoHundred = p.totalScore >= 200;
    return `
      <tr class="score-anim rank-${rankIdx + 1} ${isWinner ? 'winner-row' : ''}" style="transition-delay:${rankIdx * 60}ms">
        <td>
          <div class="rank-cell">
            <span class="rank-num">${rankIdx + 1}</span>
            <span class="player-name-cell">
              ${escHtml(p.name)}
              ${isWinner ? '<span class="winner-badge">👑 Winner</span>' : ''}
              ${overTwoHundred && !isWinner ? '<span class="winner-badge" style="background:#4ade80">200+</span>' : ''}
            </span>
          </div>
        </td>
        <td class="round-score-cell ${roundScore === 0 ? 'bust-score' : ''}">${roundScore === 0 ? '—' : '+' + roundScore}</td>
        <td class="total-score-cell">${p.totalScore}</td>
      </tr>
    `;
  }).join('');

  const actionHTML = winners.length > 0
    ? `<button class="btn btn-primary btn-lg" id="see-winner-btn">See Winner 🎉</button>`
    : `<button class="btn btn-primary" id="next-round-btn">Start Round ${state.currentRound} →</button>`;

  setApp(`
    <div class="card card-wide screen">
      <div class="top-bar">
        <h2>After Round ${state.currentRound - 1}</h2>
        <button class="btn btn-danger btn-sm" id="new-game-btn">New Game</button>
      </div>
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>This Round</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody id="lb-body">${rows}</tbody>
      </table>
      <div class="mt-24 text-center stack-sm">
        ${actionHTML}
        <button class="btn-edit-scores" id="edit-scores-btn">← Edit scores for this round</button>
      </div>
    </div>
  `);

  if (winners.length > 0) {
    document.getElementById('see-winner-btn').addEventListener('click', () => {
      state.phase = 'gameover';
      saveState(state);
      renderGameOver();
    });
  } else {
    document.getElementById('next-round-btn').addEventListener('click', () => {
      state.phase = 'scoring';
      saveState(state);
      renderScoring();
    });
  }

  document.getElementById('edit-scores-btn').addEventListener('click', editLastRound);
  document.getElementById('new-game-btn').addEventListener('click', confirmNewGame);

  requestAnimationFrame(() => {
    document.querySelectorAll('.score-anim').forEach(el => el.classList.add('visible'));
  });
}

function editLastRound() {
  state.players.forEach(p => {
    const lastScore = p.roundScores.pop();
    p.totalScore -= lastScore;
  });
  state.currentRound -= 1;
  state.phase = 'scoring';
  saveState(state);
  renderScoring();
}

function findWinners(sortedPlayers) {
  const at200 = sortedPlayers.filter(p => p.totalScore >= 200);
  if (at200.length === 0) return [];
  const max = at200[0].totalScore;
  return at200.filter(p => p.totalScore === max);
}

// ── Game Over ─────────────────────────────────────────────────────────────────
function renderGameOver() {
  const sorted = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
  const winners = findWinners(sorted);
  const winner = winners[0];

  const rows = sorted.map((p, rankIdx) => {
    const isWinner = winner && p.name === winner.name;
    return `
      <tr class="${isWinner ? 'winner-row' : ''}">
        <td>
          <div class="rank-cell">
            <span class="rank-num">${rankIdx + 1}</span>
            <span class="player-name-cell">${escHtml(p.name)}</span>
          </div>
        </td>
        <td class="total-score-cell">${p.totalScore}</td>
      </tr>
    `;
  }).join('');

  setApp(`
    <div class="card card-wide screen">
      <div class="winner-hero text-center">
        <div class="winner-crown">👑</div>
        <div class="winner-name">${escHtml(winner.name)}</div>
        <div class="winner-score">${winner.totalScore} points · ${state.currentRound - 1} rounds played</div>
      </div>
      <div class="divider mt-24"></div>
      <table class="leaderboard-table mt-16">
        <thead>
          <tr>
            <th>Player</th>
            <th>Final Score</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="mt-24 text-center">
        <button class="btn btn-primary btn-lg" id="new-game-btn">Play Again</button>
      </div>
    </div>
  `);

  document.getElementById('new-game-btn').addEventListener('click', startNewGame);
  launchConfetti();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function setApp(html) {
  document.getElementById('app').innerHTML = html;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showError(msg) {
  const existing = document.getElementById('error-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'error-toast';
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #f87171; color: #fff; padding: 12px 24px; border-radius: 10px;
    font-weight: 600; font-size: 0.9rem; z-index: 200; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    animation: fadeIn 0.2s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function confirmNewGame() {
  if (confirm('Start a new game? All current scores will be lost.')) {
    startNewGame();
  }
}

function startNewGame() {
  clearState();
  state = null;
  stopConfetti();
  goToSetup();
}

// ── Confetti ──────────────────────────────────────────────────────────────────
let confettiFrame = null;
const COLORS = ['#f5c518', '#4ade80', '#f87171', '#60a5fa', '#c084fc', '#fb923c'];

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 100,
    w: 8 + Math.random() * 8,
    h: 4 + Math.random() * 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.15,
    vx: (Math.random() - 0.5) * 2,
    vy: 2 + Math.random() * 3,
    opacity: 1
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height * 0.7) p.opacity -= 0.015;
      if (p.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }
    if (alive) confettiFrame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  draw();
}

function stopConfetti() {
  if (confettiFrame) cancelAnimationFrame(confettiFrame);
  const canvas = document.getElementById('confetti-canvas');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
init();
