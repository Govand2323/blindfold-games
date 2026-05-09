// ─── Enemy Definitions ────────────────────────────────────────────────────────

const ENEMY_DEFS = {
  grunt: {
    hp: 30, speed: 1.3, radius: 11, damage: 10, score: 100,
    color: PALETTE.ENEMY_A, darkColor: '#AA1133',
    walkSpeed: 7,
  },
  tank: {
    hp: 100, speed: 0.65, radius: 15, damage: 20, score: 300,
    color: PALETTE.ENEMY_B, darkColor: '#994400',
    walkSpeed: 12,
  },
  runner: {
    hp: 15, speed: 2.4, radius: 8, damage: 5, score: 150,
    color: PALETTE.ENEMY_C, darkColor: '#7733BB',
    walkSpeed: 4,
  },
};

// ─── Player ───────────────────────────────────────────────────────────────────

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 3;
    this.angle = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.radius = 10;
    this.invincibleTimer = 0;
    this.shootCooldown = 0;
    this.shootRate = 9;
    this.muzzleFlash = 0;
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.walkSpeed = 7;
    this.isMoving = false;
  }

  update() {
    const { dx, dy } = getMovementVector();
    this.x += dx * this.speed;
    this.y += dy * this.speed;
    this.isMoving = (dx !== 0 || dy !== 0);

    // Walking animation
    if (this.isMoving) {
      this.walkTimer++;
      if (this.walkTimer >= this.walkSpeed) {
        this.walkTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 4;
      }
    } else {
      this.walkFrame = 0;
      this.walkTimer = 0;
    }

    // Aim at mouse
    this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

    // Auto-fire while holding mouse
    if (mouse.down && this.shootCooldown <= 0) {
      this.shoot();
    }
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    if (this.muzzleFlash > 0) this.muzzleFlash--;
  }

  shoot() {
    const muzzleX = this.x + Math.cos(this.angle) * 22;
    const muzzleY = this.y + Math.sin(this.angle) * 22;
    bullets.push(new Bullet(muzzleX, muzzleY, this.angle));
    this.muzzleFlash = 6;
    this.shootCooldown = this.shootRate;
    spawnMuzzleParticles(muzzleX, muzzleY, this.angle);
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.invincibleTimer = 65;
  }
}

// ─── Enemy ────────────────────────────────────────────────────────────────────

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    const def = ENEMY_DEFS[type];
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.radius = def.radius;
    this.damage = def.damage;
    this.scoreValue = def.score;
    this.angle = 0;
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.walkSpeed = def.walkSpeed;
    this.isMoving = true;
    this.flashTimer = 0;
    this.dead = false;
  }

  update(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
      this.angle = Math.atan2(dy, dx);
    }

    // Walk animation
    this.walkTimer++;
    if (this.walkTimer >= this.walkSpeed) {
      this.walkTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 4;
    }

    if (this.flashTimer > 0) this.flashTimer--;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flashTimer = 7;
    if (this.hp <= 0) this.dead = true;
  }
}

// ─── Bullet ───────────────────────────────────────────────────────────────────

class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 9;
    this.damage = 10;
    this.radius = 4;
    this.life = 110;
    this.dead = false;
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.life--;
    if (
      this.life <= 0 ||
      this.x < -20 || this.x > CANVAS_W + 20 ||
      this.y < -20 || this.y > CANVAS_H + 20
    ) {
      this.dead = true;
    }
  }
}
