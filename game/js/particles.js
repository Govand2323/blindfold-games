// ─── Particle System ──────────────────────────────────────────────────────────

class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.91;
    this.vy *= 0.91;
    this.life--;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    const s = Math.max(1, Math.round(this.size * alpha));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x) - Math.floor(s / 2), Math.round(this.y) - Math.floor(s / 2), s, s);
  }
}

class ParticleSystem {
  constructor() { this.particles = []; }

  emit(x, y, options) {
    const { count, colors, minSpeed, maxSpeed, minLife, maxLife, minSize, maxSize, spread } = options;
    const baseAngle = options.angle !== undefined ? options.angle : null;
    const arc = spread !== undefined ? spread : Math.PI * 2;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle !== null
        ? baseAngle + (Math.random() - 0.5) * arc
        : Math.random() * Math.PI * 2;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const life  = minLife  + Math.floor(Math.random() * (maxLife  - minLife));
      const size  = minSize  + Math.random() * (maxSize  - minSize);
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, life, size));
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].dead) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.particles) p.draw(ctx);
    ctx.globalAlpha = 1;
  }
}

const particleSystem = new ParticleSystem();

// ─── Preset emitters ──────────────────────────────────────────────────────────

function spawnDeathParticles(enemy) {
  const color = ENEMY_DEFS[enemy.type].color;
  const dark  = ENEMY_DEFS[enemy.type].darkColor;

  // Main explosion burst
  particleSystem.emit(enemy.x, enemy.y, {
    count: 18, colors: [color, PALETTE.FLASH, PALETTE.SCORE],
    minSpeed: 1.5, maxSpeed: 5.5, minLife: 22, maxLife: 48, minSize: 4, maxSize: 9,
  });
  // Sparks
  particleSystem.emit(enemy.x, enemy.y, {
    count: 14, colors: [PALETTE.SCORE, PALETTE.FLASH, '#FFFFFF'],
    minSpeed: 3, maxSpeed: 9, minLife: 10, maxLife: 28, minSize: 1.5, maxSize: 3,
  });
  // Dark debris
  particleSystem.emit(enemy.x, enemy.y, {
    count: 8, colors: [dark, '#222222'],
    minSpeed: 1, maxSpeed: 3.5, minLife: 18, maxLife: 35, minSize: 3, maxSize: 6,
  });
}

function spawnMuzzleParticles(x, y, angle) {
  particleSystem.emit(x, y, {
    count: 6, colors: [PALETTE.FLASH, PALETTE.SCORE, '#FFAA00'],
    minSpeed: 2, maxSpeed: 5, minLife: 5, maxLife: 14, minSize: 2, maxSize: 5,
    angle: angle, spread: 0.6,
  });
}
