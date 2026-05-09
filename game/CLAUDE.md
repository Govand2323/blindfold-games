# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the game

Open `index.html` directly in a browser — no build step, no server required. All JS files are loaded via `<script>` tags in dependency order. Use `open index.html` on macOS.

There are no tests, linter, or package manager. Validation is done by playing the game in the browser and checking the browser console for errors.

## Git workflow

**Commit and push after every meaningful change.** Never leave a working session with uncommitted code. The goal is that GitHub always reflects the current state of the project so work is never lost and any change can be reverted.

Use conventional prefixes and push immediately after committing:

```bash
git add <files>
git commit -m "feat: description of change"
git push
```

Prefix guide: `feat:` new feature, `fix:` bug fix, `refactor:` restructure without behavior change, `style:` visual/UI tweak, `docs:` documentation only.

Commit granularity: one logical change per commit (e.g. adding a new enemy type is one commit, fixing a collision bug is a separate commit). Do not batch unrelated changes. Do not wait until the end of a session to commit everything at once.

Remote: https://github.com/Govand2323/cosmic-canyon

## Architecture

The game uses a **single global namespace** — no ES modules, no bundler. All variables and functions are globals accessible across files. Script load order in `index.html` is strict:

```
core.js → renderer.js → particles.js → entities.js
```

`entities.js` depends on globals from all three preceding files (`CANVAS_W`, `PALETTE`, `ENEMY_DEFS`, `bullets`, `mouse`, `particleSystem`, `spawnMuzzleParticles`).

### File responsibilities

| File | Owns |
|---|---|
| `js/core.js` | Constants (`CANVAS_W/H`, `PALETTE`, `GAME_STATE`), all mutable game state (`player`, `enemies`, `bullets`, `score`, `level`, `wave`), input (`keys`, `mouse`), game loop (`update` → `render`), wave/level logic, collision detection |
| `js/renderer.js` | Every draw call — background, sprites, HUD, all screen overlays. Reads globals, never writes them. Entry point is `render()` |
| `js/particles.js` | `Particle` + `ParticleSystem` classes; global singleton `particleSystem`; preset emitters `spawnDeathParticles(enemy)` and `spawnMuzzleParticles(x, y, angle)` |
| `js/entities.js` | `ENEMY_DEFS` lookup table; `Player`, `Enemy`, `Bullet` classes. `Player.update()` reads `keys`, `mouse`, and pushes to `bullets[]`. `Enemy.update(player)` moves toward player |

### Game state machine

```
MENU → PLAYING ⇄ WAVE_START → LEVEL_COMPLETE → PLAYING (next level)
               ↘ GAME_OVER → MENU
```

`gameState` is a string from `GAME_STATE`. `setState(newState)` sets it and resets `stateTimer`. `stateTimer` is a frame counter used by transient states (WAVE_START auto-advances at 120 frames; GAME_OVER delays the restart prompt by 90 frames).

### Wave / level progression

`buildWaveQueue(wave, level)` returns an array of `{type, delay}` objects. `spawnTimer` counts up each frame; enemies are shifted off the queue when `spawnTimer >= entry.delay`. A wave ends when the queue is empty **and** `enemies.length === 0`. Levels 1–2 have 3 waves; level 3+ has 4 waves (`WAVES_PER_LEVEL` in `core.js`).

### Collision

All collision is circle–circle via `circlesOverlap(a, b)` (checks `Math.hypot < a.radius + b.radius`). `separateEnemies()` is O(n²) and runs every 3 frames (`separationTick`) to avoid performance issues with large enemy counts.

### Adding a new enemy type

1. Add an entry to `ENEMY_DEFS` in `entities.js` with `hp`, `speed`, `radius`, `damage`, `score`, `color`, `darkColor`, `walkSpeed`.
2. Add a `drawXxx(ctx, color, dark, frame, moving)` function in `renderer.js` and call it from `drawEnemy()`.
3. Include the new type string in the `buildWaveQueue` logic in `core.js`.

### Rendering conventions

- `ctx.imageSmoothingEnabled = false` is set at the top of every `render()` call.
- All coordinates are `Math.round()`-ed before drawing to keep the pixel-art look crisp.
- Sprites are built entirely from `ctx.fillRect` calls — no arcs, no images.
- `ctx.save()` / `ctx.restore()` wrap every sprite that uses `ctx.translate` or `ctx.rotate`.
- `ctx.globalAlpha` must always be reset to `1` after any partial-alpha draw.
- `drawRetroText(ctx, text, x, y, color, size, align)` renders monospace text with a 2px black shadow; use it for all on-screen text.
