// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 640;
const CANVAS_H = 480;

const PALETTE = {
  BLACK:   '#0D0208',
  DARK_BG: '#0f0f1a',
  FLOOR:   '#12112a',
  GRID:    '#1a1835',
  PLAYER:  '#00FF9F',
  GUN:     '#CCCCCC',
  BULLET:  '#FFE000',
  ENEMY_A: '#FF3860',  // grunt
  ENEMY_B: '#FF8C00',  // tank
  ENEMY_C: '#C77DFF',  // runner
  HEALTH:  '#FF3860',
  HEALTH_BG: '#3a0a0a',
  SCORE:   '#FFE000',
  WHITE:   '#F0F0F0',
  FLASH:   '#FFFFFF',
  CYAN:    '#00E5FF',
};

const GAME_STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  WAVE_START: 'WAVE_START',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_OVER: 'GAME_OVER',
};

const WAVES_PER_LEVEL = { 1: 3, 2: 3, default: 4 };

// ─── Global State ─────────────────────────────────────────────────────────────

let canvas, ctx;
let gameState = GAME_STATE.MENU;
let player = null;
let enemies = [];
let bullets = [];
let floatingTexts = [];
let score = 0;
let level = 1;
let wave = 1;
let waveSpawnQueue = [];
let spawnTimer = 0;
let stateTimer = 0;       // generic countdown used by transient states
let screenFlash = 0;      // frames of red damage overlay
let frameCount = 0;
let separationTick = 0;   // throttle enemy separation to every 3 frames

// ─── Input ────────────────────────────────────────────────────────────────────

const keys = {};
const mouse = { x: CANVAS_W / 2, y: CANVAS_H / 2, down: false, justPressed: false };

function initInput() {
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
      e.preventDefault();
    }
    if (gameState === GAME_STATE.MENU && (e.key === ' ' || e.key === 'Enter')) {
      startNewGame();
    }
    if (gameState === GAME_STATE.GAME_OVER && (e.key === ' ' || e.key === 'Enter')) {
      startNewGame();
    }
    if (gameState === GAME_STATE.LEVEL_COMPLETE && (e.key === ' ' || e.key === 'Enter')) {
      advanceLevel();
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    mouse.x = (e.clientX - rect.left) * scaleX;
    mouse.y = (e.clientY - rect.top) * scaleY;
  });
  canvas.addEventListener('mousedown', e => {
    if (e.button === 0) { mouse.down = true; mouse.justPressed = true; }
    if (gameState === GAME_STATE.MENU) startNewGame();
    if (gameState === GAME_STATE.GAME_OVER) startNewGame();
    if (gameState === GAME_STATE.LEVEL_COMPLETE) advanceLevel();
  });
  canvas.addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; });
}

function getMovementVector() {
  let dx = 0, dy = 0;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx -= 1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) dy -= 1;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) dy += 1;
  if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
  return { dx, dy };
}

// ─── Wave / Level helpers ─────────────────────────────────────────────────────

function wavesForLevel(lvl) {
  return WAVES_PER_LEVEL[lvl] || WAVES_PER_LEVEL.default;
}

function buildWaveQueue(waveNum, lvl) {
  const queue = [];
  const base = 4 + (waveNum - 1) * 3 + (lvl - 1) * 4;
  const total = Math.min(base, 40);

  for (let i = 0; i < total; i++) {
    const r = Math.random();
    let type;
    if (lvl === 1) {
      type = r < 0.75 ? 'grunt' : 'runner';
    } else if (lvl === 2) {
      type = r < 0.45 ? 'grunt' : r < 0.75 ? 'runner' : 'tank';
    } else {
      const tankRatio = Math.min(0.4, 0.1 + (lvl - 3) * 0.1);
      type = r < tankRatio ? 'tank' : r < tankRatio + 0.35 ? 'runner' : 'grunt';
    }
    queue.push({ type, delay: i * 38 });
  }
  return queue;
}

function getSpawnPosition() {
  const edge = Math.floor(Math.random() * 4);
  const margin = 32;
  switch (edge) {
    case 0: return { x: Math.random() * CANVAS_W, y: -margin };
    case 1: return { x: CANVAS_W + margin, y: Math.random() * CANVAS_H };
    case 2: return { x: Math.random() * CANVAS_W, y: CANVAS_H + margin };
    case 3: return { x: -margin, y: Math.random() * CANVAS_H };
  }
}

function startNewGame() {
  score = 0;
  level = 1;
  wave = 1;
  enemies = [];
  bullets = [];
  floatingTexts = [];
  screenFlash = 0;
  player = new Player(CANVAS_W / 2, CANVAS_H / 2);
  waveSpawnQueue = buildWaveQueue(wave, level);
  spawnTimer = 0;
  gameState = GAME_STATE.PLAYING;
}

function advanceLevel() {
  level++;
  wave = 1;
  enemies = [];
  bullets = [];
  floatingTexts = [];
  screenFlash = 0;
  player.hp = Math.min(player.maxHp, player.hp + 30); // partial heal between levels
  waveSpawnQueue = buildWaveQueue(wave, level);
  spawnTimer = 0;
  gameState = GAME_STATE.PLAYING;
}

function setState(newState) {
  gameState = newState;
  stateTimer = 0;
}

// ─── Collision ────────────────────────────────────────────────────────────────

function circlesOverlap(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy) < a.radius + b.radius;
}

function separateEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i], b = enemies[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius;
      if (dist < minDist && dist > 0.01) {
        const push = (minDist - dist) / 2;
        const nx = dx / dist, ny = dy / dist;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
      }
    }
  }
}

function checkCollisions() {
  // Bullets vs enemies
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    if (b.dead) continue;
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (circlesOverlap(b, e)) {
        e.takeDamage(b.damage);
        b.dead = true;
        if (e.dead) {
          const pts = e.scoreValue;
          score += pts;
          floatingTexts.push({ x: e.x, y: e.y - 10, text: '+' + pts, life: 50, maxLife: 50 });
          spawnDeathParticles(e);
          enemies.splice(ei, 1);
        }
        break;
      }
    }
  }
  bullets = bullets.filter(b => !b.dead);

  // Enemies vs player
  if (player && player.invincibleTimer <= 0) {
    for (const e of enemies) {
      if (circlesOverlap(player, e)) {
        player.takeDamage(e.damage);
        screenFlash = 12;
        if (player.hp <= 0) {
          setState(GAME_STATE.GAME_OVER);
          return;
        }
      }
    }
  }

  // Clamp player to canvas
  if (player) {
    player.x = Math.max(player.radius, Math.min(CANVAS_W - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(CANVAS_H - player.radius, player.y));
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

function update() {
  frameCount++;

  if (gameState === GAME_STATE.PLAYING) {
    updatePlaying();
  } else if (gameState === GAME_STATE.WAVE_START) {
    stateTimer++;
    if (stateTimer >= 120) {
      waveSpawnQueue = buildWaveQueue(wave, level);
      spawnTimer = 0;
      setState(GAME_STATE.PLAYING);
    }
  } else if (gameState === GAME_STATE.LEVEL_COMPLETE) {
    stateTimer++;
  } else if (gameState === GAME_STATE.GAME_OVER) {
    stateTimer++;
  }

  particleSystem.update();

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 0.8;
    ft.life--;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }

  mouse.justPressed = false;
}

function updatePlaying() {
  // Spawn from queue
  if (waveSpawnQueue.length > 0) {
    spawnTimer++;
    while (waveSpawnQueue.length > 0 && spawnTimer >= waveSpawnQueue[0].delay) {
      const s = waveSpawnQueue.shift();
      const pos = getSpawnPosition();
      enemies.push(new Enemy(pos.x, pos.y, s.type));
    }
  }

  // Check wave/level completion
  const allSpawned = waveSpawnQueue.length === 0;
  if (allSpawned && enemies.length === 0) {
    const maxWaves = wavesForLevel(level);
    if (wave >= maxWaves) {
      setState(GAME_STATE.LEVEL_COMPLETE);
      return;
    } else {
      wave++;
      gameState = GAME_STATE.WAVE_START;
      stateTimer = 0;
      return;
    }
  }

  player.update();

  for (const e of enemies) e.update(player);

  for (const b of bullets) b.update();

  separationTick++;
  if (separationTick >= 3) {
    separateEnemies();
    separationTick = 0;
  }

  checkCollisions();

  if (screenFlash > 0) screenFlash--;
}

// ─── Main Loop ────────────────────────────────────────────────────────────────

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  // Scale canvas to fill window while maintaining aspect ratio
  function resize() {
    const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    canvas.style.width  = Math.floor(CANVAS_W * scale) + 'px';
    canvas.style.height = Math.floor(CANVAS_H * scale) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  initInput();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', init);
