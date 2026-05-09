// ─── Renderer ─────────────────────────────────────────────────────────────────

function render() {
  ctx.imageSmoothingEnabled = false;

  if (gameState === GAME_STATE.MENU) {
    drawMenuScreen();
  } else if (gameState === GAME_STATE.PLAYING || gameState === GAME_STATE.WAVE_START) {
    drawGame();
    if (gameState === GAME_STATE.WAVE_START) drawWaveAnnounce();
  } else if (gameState === GAME_STATE.LEVEL_COMPLETE) {
    drawGame();
    drawLevelCompleteScreen();
  } else if (gameState === GAME_STATE.GAME_OVER) {
    drawGame();
    drawGameOverScreen();
  }
}

// ─── Background ───────────────────────────────────────────────────────────────

function drawBackground() {
  ctx.fillStyle = PALETTE.FLOOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = PALETTE.GRID;
  ctx.lineWidth = 1;
  const GRID = 40;
  for (let x = 0; x <= CANVAS_W; x += GRID) {
    ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_H; y += GRID) {
    ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(CANVAS_W, y + 0.5); ctx.stroke();
  }

  // Subtle corner dots at grid intersections
  ctx.fillStyle = PALETTE.GRID;
  for (let x = 0; x <= CANVAS_W; x += GRID) {
    for (let y = 0; y <= CANVAS_H; y += GRID) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
}

// ─── Player ───────────────────────────────────────────────────────────────────

function drawPlayer(p) {
  if (!p) return;

  // Blink when invincible
  if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 5) % 2 === 0) return;

  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y));

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-10, 6, 20, 7);

  // Legs (4-frame walk cycle)
  const legColor = '#009966';
  const legFrames = [
    [[-5, 3], [2, 5]],
    [[-5, 5], [2, 3]],
    [[-5, 3], [2, 5]],
    [[-5, 5], [2, 3]],
  ];
  if (p.isMoving) {
    const [l1, l2] = legFrames[p.walkFrame];
    ctx.fillStyle = legColor;
    ctx.fillRect(l1[0], l1[1], 5, 9);
    ctx.fillRect(l2[0], l2[1], 5, 9);
    // Boot highlights
    ctx.fillStyle = '#007755';
    ctx.fillRect(l1[0], l1[1] + 6, 5, 3);
    ctx.fillRect(l2[0], l2[1] + 6, 5, 3);
  } else {
    ctx.fillStyle = legColor;
    ctx.fillRect(-5, 4, 5, 8);
    ctx.fillRect(2, 4, 5, 8);
    ctx.fillStyle = '#007755';
    ctx.fillRect(-5, 9, 5, 3);
    ctx.fillRect(2, 9, 5, 3);
  }

  // Torso
  ctx.fillStyle = PALETTE.PLAYER;
  ctx.fillRect(-7, -7, 14, 13);
  // Torso detail (chest stripe)
  ctx.fillStyle = '#00CC7A';
  ctx.fillRect(-5, -5, 10, 4);

  // Head
  ctx.fillStyle = '#EEDDCC';
  ctx.fillRect(-4, -13, 9, 8);
  // Helmet
  ctx.fillStyle = PALETTE.PLAYER;
  ctx.fillRect(-5, -15, 11, 5);
  // Eyes
  ctx.fillStyle = '#111';
  ctx.fillRect(-2, -11, 3, 3);
  ctx.fillRect(3, -11, 3, 3);
  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.fillRect(-1, -11, 1, 1);
  ctx.fillRect(4, -11, 1, 1);

  // Gun (rotates with mouse angle)
  ctx.rotate(p.angle);
  // Gun body
  ctx.fillStyle = '#AAAAAA';
  ctx.fillRect(-2, -3, 8, 6);
  // Barrel
  ctx.fillStyle = '#888888';
  ctx.fillRect(6, -2, 14, 4);
  // Barrel highlight
  ctx.fillStyle = '#CCCCCC';
  ctx.fillRect(6, -2, 14, 1);
  // Grip
  ctx.fillStyle = '#666';
  ctx.fillRect(-2, 2, 5, 5);

  // Muzzle flash
  if (p.muzzleFlash > 0) {
    const alpha = p.muzzleFlash / 6;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = PALETTE.FLASH;
    ctx.fillRect(18, -6, 10, 12);
    ctx.fillStyle = PALETTE.SCORE;
    ctx.fillRect(20, -4, 6, 8);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── Enemies ──────────────────────────────────────────────────────────────────

function drawEnemy(e) {
  ctx.save();
  ctx.translate(Math.round(e.x), Math.round(e.y));

  const flashColor = PALETTE.WHITE;
  const baseColor = e.flashTimer > 0 ? flashColor : ENEMY_DEFS[e.type].color;
  const darkColor = e.flashTimer > 0 ? '#DDDDDD' : ENEMY_DEFS[e.type].darkColor;

  ctx.rotate(e.angle + Math.PI / 2);

  if (e.type === 'grunt') {
    drawGrunt(ctx, baseColor, darkColor, e.walkFrame, e.isMoving);
  } else if (e.type === 'tank') {
    drawTank(ctx, baseColor, darkColor, e.walkFrame, e.isMoving);
  } else {
    drawRunner(ctx, baseColor, darkColor, e.walkFrame, e.isMoving);
  }

  ctx.restore();

  // HP bar (drawn without rotation)
  const barW = e.radius * 2 + 4;
  const barH = 3;
  const bx = Math.round(e.x - barW / 2);
  const by = Math.round(e.y - e.radius - 9);
  ctx.fillStyle = PALETTE.HEALTH_BG;
  ctx.fillRect(bx, by, barW, barH);
  ctx.fillStyle = PALETTE.HEALTH;
  ctx.fillRect(bx, by, Math.round(barW * (e.hp / e.maxHp)), barH);
}

function drawGrunt(ctx, color, dark, frame, moving) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-8, 6, 16, 5);

  // Legs
  const lf = moving ? [[-4, 3 + (frame % 2) * 2], [1, 3 + ((frame + 1) % 2) * 2]] : [[-4, 3], [1, 3]];
  ctx.fillStyle = dark;
  ctx.fillRect(lf[0][0], lf[0][1], 4, 8);
  ctx.fillRect(lf[1][0], lf[1][1], 4, 8);

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(-6, -6, 12, 11);
  ctx.fillStyle = dark;
  ctx.fillRect(-4, -4, 8, 4);

  // Head
  ctx.fillStyle = color;
  ctx.fillRect(-5, -13, 10, 9);
  ctx.fillStyle = dark;
  ctx.fillRect(-3, -11, 6, 3);
  // Eyes (glowing)
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(-2, -10, 2, 2);
  ctx.fillRect(2, -10, 2, 2);
  // Spikes on top
  ctx.fillStyle = dark;
  ctx.fillRect(-4, -15, 3, 3);
  ctx.fillRect(0, -16, 3, 4);
  ctx.fillRect(4, -15, 3, 3);
}

function drawTank(ctx, color, dark, frame, moving) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-12, 8, 24, 7);

  // Legs (thick)
  const lf = moving ? [[-8, 4 + (frame % 2) * 2], [3, 4 + ((frame + 1) % 2) * 2]] : [[-8, 4], [3, 4]];
  ctx.fillStyle = dark;
  ctx.fillRect(lf[0][0], lf[0][1], 6, 10);
  ctx.fillRect(lf[1][0], lf[1][1], 6, 10);

  // Body (wide and squat)
  ctx.fillStyle = color;
  ctx.fillRect(-10, -8, 20, 14);
  // Armor plates
  ctx.fillStyle = dark;
  ctx.fillRect(-8, -6, 6, 5);
  ctx.fillRect(2, -6, 6, 5);
  ctx.fillRect(-8, 1, 16, 4);

  // Head
  ctx.fillStyle = color;
  ctx.fillRect(-7, -17, 14, 11);
  ctx.fillStyle = dark;
  ctx.fillRect(-5, -15, 10, 4);
  // Eyes
  ctx.fillStyle = '#FF6600';
  ctx.fillRect(-3, -13, 3, 3);
  ctx.fillRect(2, -13, 3, 3);
  // Horns
  ctx.fillStyle = dark;
  ctx.fillRect(-7, -20, 4, 5);
  ctx.fillRect(4, -20, 4, 5);
}

function drawRunner(ctx, color, dark, frame, moving) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-5, 5, 10, 4);

  // Legs (thin, fast)
  const lf = moving ? [[-3, 2 + (frame % 2) * 3], [1, 2 + ((frame + 1) % 2) * 3]] : [[-3, 2], [1, 2]];
  ctx.fillStyle = dark;
  ctx.fillRect(lf[0][0], lf[0][1], 3, 9);
  ctx.fillRect(lf[1][0], lf[1][1], 3, 9);

  // Body (slender)
  ctx.fillStyle = color;
  ctx.fillRect(-4, -6, 9, 10);
  ctx.fillStyle = dark;
  ctx.fillRect(-2, -4, 5, 3);

  // Head (elongated)
  ctx.fillStyle = color;
  ctx.fillRect(-3, -14, 8, 9);
  // Eyes (narrow slits)
  ctx.fillStyle = '#00FFFF';
  ctx.fillRect(-1, -12, 6, 1);
  ctx.fillRect(-1, -10, 6, 1);
  // Antennae
  ctx.fillStyle = dark;
  ctx.fillRect(-2, -18, 2, 5);
  ctx.fillRect(4, -17, 2, 4);
}

// ─── Bullet ───────────────────────────────────────────────────────────────────

function drawBullet(b) {
  ctx.save();
  ctx.translate(Math.round(b.x), Math.round(b.y));
  ctx.rotate(b.angle);
  // Glow core
  ctx.fillStyle = PALETTE.BULLET;
  ctx.fillRect(-8, -2, 14, 4);
  // Bright tip
  ctx.fillStyle = PALETTE.FLASH;
  ctx.fillRect(4, -1, 4, 2);
  // Trail
  ctx.fillStyle = 'rgba(255,200,0,0.4)';
  ctx.fillRect(-14, -1, 8, 2);
  ctx.restore();
}

// ─── HUD ──────────────────────────────────────────────────────────────────────

function drawHUD() {
  // Health bar
  const barW = 120, barH = 12;
  const bx = 12, by = 12;
  ctx.fillStyle = '#111';
  ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
  ctx.fillStyle = PALETTE.HEALTH_BG;
  ctx.fillRect(bx, by, barW, barH);
  const hpRatio = player ? Math.max(0, player.hp / player.maxHp) : 0;
  const hpColor = hpRatio > 0.5 ? PALETTE.HEALTH : hpRatio > 0.25 ? '#FF8800' : '#FF0000';
  ctx.fillStyle = hpColor;
  ctx.fillRect(bx, by, Math.round(barW * hpRatio), barH);
  // Shine on bar
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(bx, by, Math.round(barW * hpRatio), 4);
  drawRetroText(ctx, 'HP', bx + barW + 8, by + 6, PALETTE.WHITE, 10, 'left');

  // Score
  drawRetroText(ctx, 'SCORE', CANVAS_W / 2, 16, PALETTE.SCORE, 11, 'center');
  drawRetroText(ctx, String(score).padStart(6, '0'), CANVAS_W / 2, 30, PALETTE.WHITE, 14, 'center');

  // Level / Wave
  const lvlText = 'LV ' + level + '  WV ' + wave + '/' + wavesForLevel(level);
  drawRetroText(ctx, lvlText, CANVAS_W - 12, 16, PALETTE.CYAN, 11, 'right');
}

// ─── Floating score texts ─────────────────────────────────────────────────────

function drawFloatingTexts() {
  for (const ft of floatingTexts) {
    const alpha = ft.life / ft.maxLife;
    ctx.globalAlpha = alpha;
    drawRetroText(ctx, ft.text, ft.x, ft.y, PALETTE.SCORE, 11, 'center');
  }
  ctx.globalAlpha = 1;
}

// ─── Screen overlay helpers ───────────────────────────────────────────────────

function drawDamageFlash() {
  if (screenFlash > 0) {
    ctx.fillStyle = `rgba(255,0,0,${screenFlash / 40})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

function drawScanlines() {
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < CANVAS_H; y += 3) {
    ctx.fillRect(0, y, CANVAS_W, 1);
  }
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function drawMenuScreen() {
  // Background with animated starfield feel
  ctx.fillStyle = PALETTE.DARK_BG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(30,24,70,1)';
  ctx.lineWidth = 1;
  const G = 40;
  for (let x = 0; x <= CANVAS_W; x += G) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_H; y += G) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }

  // Title
  drawRetroText(ctx, 'COSMIC CANYON', CANVAS_W / 2, 120, PALETTE.CYAN, 36, 'center');
  drawRetroText(ctx, '— TOP-DOWN SURVIVOR —', CANVAS_W / 2, 162, PALETTE.SCORE, 13, 'center');

  // Enemy legend
  drawRetroText(ctx, 'ENEMIES:', CANVAS_W / 2 - 110, 220, PALETTE.WHITE, 12, 'left');
  ctx.fillStyle = PALETTE.ENEMY_A; ctx.fillRect(CANVAS_W/2 - 110, 238, 12, 12);
  drawRetroText(ctx, 'GRUNT  — 30HP  slow', CANVAS_W / 2 - 90, 244, PALETTE.ENEMY_A, 11, 'left');
  ctx.fillStyle = PALETTE.ENEMY_B; ctx.fillRect(CANVAS_W/2 - 110, 258, 12, 12);
  drawRetroText(ctx, 'TANK   — 100HP thick', CANVAS_W / 2 - 90, 264, PALETTE.ENEMY_B, 11, 'left');
  ctx.fillStyle = PALETTE.ENEMY_C; ctx.fillRect(CANVAS_W/2 - 110, 278, 12, 12);
  drawRetroText(ctx, 'RUNNER — 15HP  fast', CANVAS_W / 2 - 90, 284, PALETTE.ENEMY_C, 11, 'left');

  // Controls
  drawRetroText(ctx, 'WASD / ARROWS  — MOVE', CANVAS_W / 2, 330, PALETTE.WHITE, 12, 'center');
  drawRetroText(ctx, 'MOUSE          — AIM', CANVAS_W / 2, 350, PALETTE.WHITE, 12, 'center');
  drawRetroText(ctx, 'LEFT CLICK     — SHOOT', CANVAS_W / 2, 370, PALETTE.WHITE, 12, 'center');

  // Pulsing start prompt
  const pulse = Math.sin(frameCount * 0.07) * 0.5 + 0.5;
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  drawRetroText(ctx, '[ CLICK OR PRESS SPACE TO START ]', CANVAS_W / 2, 430, PALETTE.SCORE, 14, 'center');
  ctx.globalAlpha = 1;

  drawScanlines();
}

function drawGame() {
  drawBackground();
  particleSystem.draw(ctx);
  for (const b of bullets) drawBullet(b);
  for (const e of enemies) drawEnemy(e);
  if (player) drawPlayer(player);
  drawFloatingTexts();
  drawHUD();
  drawDamageFlash();
  drawScanlines();
}

function drawWaveAnnounce() {
  const alpha = Math.min(1, (120 - stateTimer) / 30);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, CANVAS_H / 2 - 50, CANVAS_W, 100);
  drawRetroText(ctx, 'WAVE ' + wave, CANVAS_W / 2, CANVAS_H / 2 - 10, PALETTE.SCORE, 32, 'center');
  drawRetroText(ctx, 'INCOMING!', CANVAS_W / 2, CANVAS_H / 2 + 22, PALETTE.WHITE, 14, 'center');
  ctx.globalAlpha = 1;
}

function drawLevelCompleteScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawRetroText(ctx, 'LEVEL COMPLETE!', CANVAS_W / 2, 150, PALETTE.SCORE, 30, 'center');
  drawRetroText(ctx, 'LEVEL ' + level + ' CLEARED', CANVAS_W / 2, 200, PALETTE.CYAN, 16, 'center');
  drawRetroText(ctx, 'SCORE: ' + String(score).padStart(6, '0'), CANVAS_W / 2, 250, PALETTE.WHITE, 18, 'center');
  drawRetroText(ctx, '+30 HP RESTORED', CANVAS_W / 2, 290, PALETTE.PLAYER, 13, 'center');

  const pulse = Math.sin(frameCount * 0.08) * 0.5 + 0.5;
  ctx.globalAlpha = 0.55 + pulse * 0.45;
  drawRetroText(ctx, '[ CLICK OR SPACE — NEXT LEVEL ]', CANVAS_W / 2, 370, PALETTE.SCORE, 14, 'center');
  ctx.globalAlpha = 1;
}

function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawRetroText(ctx, 'GAME OVER', CANVAS_W / 2, 160, PALETTE.HEALTH, 36, 'center');
  drawRetroText(ctx, 'REACHED LEVEL ' + level + '  WAVE ' + wave, CANVAS_W / 2, 220, PALETTE.WHITE, 14, 'center');
  drawRetroText(ctx, 'FINAL SCORE', CANVAS_W / 2, 262, PALETTE.SCORE, 13, 'center');
  drawRetroText(ctx, String(score).padStart(6, '0'), CANVAS_W / 2, 290, PALETTE.WHITE, 28, 'center');

  if (stateTimer > 90) {
    const pulse = Math.sin(frameCount * 0.08) * 0.5 + 0.5;
    ctx.globalAlpha = 0.55 + pulse * 0.45;
    drawRetroText(ctx, '[ CLICK OR SPACE — TRY AGAIN ]', CANVAS_W / 2, 380, PALETTE.SCORE, 14, 'center');
    ctx.globalAlpha = 1;
  }
}

// ─── Retro text helper ────────────────────────────────────────────────────────

function drawRetroText(ctx, text, x, y, color, size, align) {
  ctx.font = `bold ${size}px 'Courier New', monospace`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillText(text, x + 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
