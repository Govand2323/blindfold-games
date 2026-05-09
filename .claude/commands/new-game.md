# New Game

Adds a new game to the BlindFold Games portal at `/Users/govandmurad/GDev/ClaudeCodeTest/`.

This command handles every file that needs to change: creating the game's portal page, updating the home page, and updating every existing game page. Follow the steps below exactly.

---

## Step 1 — Gather game info

If the user provided args (e.g. `/new-game Snake`), use the game name from args. Otherwise ask.

Collect the following, either from args or by asking the user:

| Field | Description |
|---|---|
| **Game name** | Display name, e.g. "Snake" |
| **Genre** | One of: Shooter / Puzzle / Strategy / Adventure / Racing / Other |
| **Emoji** | Single emoji to use as thumbnail icon, e.g. 🐍 |
| **Game source** | Path to an existing `.html` game file, OR the word `scratch` to generate a starter |
| **Thumbnail image** | Path to an image file (JPG/PNG) provided by the user — a screenshot or artwork of the game. This is required; do NOT generate or create an image yourself. |
| **Controls** | How the player controls the game (keys, mouse, etc.) |
| **How to play** | 1-2 sentences describing the objective and rules |

Then derive:
- **Slug**: lowercase game name, spaces → hyphens, strip non-alphanumeric. "Space Invaders" → `space-invaders`
- **Thumb class** (for `card-thumb` and `mini-thumb`):
  - Shooter → `space`
  - Puzzle → `teal`
  - Strategy → `dark1`
  - Adventure → `dark2`
  - Racing → `dark3`
  - Other → `dark4`
- **Tag class** (for `card-tag`):
  - Shooter → `shooter`
  - Puzzle → `puzzle`
  - All others → `strategy`
- **Genre label**: display string for the tag (use the genre exactly as given)

---

## Step 1b — Handle thumbnail image

The user MUST provide an image (screenshot or artwork). Do NOT generate or create images yourself.

- Copy the user-provided image to `assets/games/[slug].png` (use `.jpg` if the source is a JPEG)
- macOS screenshot filenames often contain a Unicode narrow no-break space (U+202F) before AM/PM — use a glob pattern to copy them safely:
  ```bash
  cp "/path/to/Screenshot"*".png" "assets/games/[slug].png"
  ```
- If the user has not provided an image, ask them for one before proceeding. Do not continue without it.

---

## Step 2 — Discover existing games

Read every `games/*/index.html` file (excluding the new game's slug) to build a list of currently live games. For each, extract: slug, game name, emoji, thumb class, tag class, genre label.

This is needed so the new game page has a complete Other Games + Top Picks section, and so you know which existing pages to update in Step 5.

---

## Step 3 — Create the game's portal page

Create `games/[slug]/index.html` using the template below. Fill in all placeholders. The "Other Games" sidebar and "Top Picks" shelf must list ALL existing live games (discovered in Step 2) — not coming-soon cards.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Game Name] — BlindFold Games</title>
  <meta name="description" content="Play [Game Name] free in your browser. No download, no login.">
  <link rel="stylesheet" href="../../css/style.css">
</head>
<body>

<div class="layout">

  <aside class="sidebar">
    <a href="../../index.html" class="sidebar-logo-wrap">
      <img src="../../assets/logo.jpg" alt="BlindFold Games">
    </a>
    <nav class="sidebar-nav">
      <a href="../../index.html" class="sidebar-btn" data-tip="Home">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </a>
      <a href="../../index.html#all-games" class="sidebar-btn" data-tip="All Games">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M12 12h.01M8 12h.01M16 12h.01"/>
          <path d="M6 10v4M10 10v4"/>
        </svg>
      </a>
    </nav>
  </aside>

  <div class="main">

    <header class="top-header">
      <a href="../../index.html" class="site-name">BLIND<span>FOLD</span> GAMES</a>
      <div class="header-right">
        <a href="../../index.html" class="back-btn">← All Games</a>
      </div>
    </header>

    <div class="ad-banner">
      <div class="ad-slot leaderboard">Advertisement</div>
    </div>

    <div class="game-page-content">
      <div class="game-page-title">
        <span class="card-tag [tag-class]" style="font-size:0.68rem;padding:0.2rem 0.55rem">[Genre Label]</span>
        <h1>[Game Name]</h1>
      </div>

      <div class="game-layout">
        <div class="game-frame-wrap">
          <iframe src="[iframe-src]" title="[Game Name]" allowfullscreen tabindex="0"></iframe>
        </div>

        <div class="game-sidebar-ads">
          <div class="ad-slot rectangle">Advertisement</div>

          <div class="sidebar-section">
            <div class="shelf-header">
              <span class="shelf-icon">🎮</span>
              <h2>Other Games</h2>
            </div>
            <!-- One mini-card per existing live game (from Step 2) -->
            [MINI-CARDS FOR ALL EXISTING GAMES]
          </div>
        </div>
      </div>
    </div>

    <div class="ad-banner">
      <div class="ad-slot leaderboard">Advertisement</div>
    </div>

    <div class="about-game">
      <h2>About This Game</h2>
      <p>[About text — describe the game objective and setting in 1-2 sentences.]</p>
    </div>

    <div class="game-controls">
      <h2>Controls</h2>
      <div class="controls-list">
        <!-- One .control-item per input, e.g.: -->
        <!-- <div class="control-item"><kbd>W A S D</kbd> &nbsp;Move</div> -->
        <!-- <div class="control-item"><kbd>Left Click</kbd> &nbsp;Shoot</div> -->
        [CONTROLS LIST — one control-item per action, using <kbd> tags for keys]
      </div>
      <p>[How to play — 1-2 sentences on the rules and objective.]</p>
    </div>

    <div class="game-page-shelf">
      <div class="shelf-header">
        <span class="shelf-icon">🔥</span>
        <h2>Top Picks</h2>
      </div>
      <div class="games-grid">
        <!-- One game-card per existing live game (from Step 2) -->
        [GAME CARDS FOR ALL EXISTING GAMES]
      </div>
    </div>

    <footer>
      <div class="footer-links">
        <a href="../../index.html">Home</a>
        <a href="../../privacy-policy.html">Privacy Policy</a>
      </div>
      <span>© 2026 BlindFold Games</span>
    </footer>

  </div>
</div>

</body>
</html>
```

**iframe src rules:**
- If user provided an existing file path: use the relative path from `games/[slug]/` to that file
- If `scratch`: use `game.html` (will be created in Step 4)

**Mini-card pattern** (for sidebar Other Games, one per existing game):
```html
<a href="../[other-slug]/index.html" class="mini-card">
  <div class="mini-thumb"><img src="../../assets/games/[other-slug].png" alt="[Other Game Name]"></div>
  <div class="mini-info">
    <div class="mini-title">[Other Game Name]</div>
    <span class="card-tag [other-tag-class]">[Other Genre]</span>
  </div>
</a>
```

**Top Picks card pattern** (for bottom shelf, one per existing game):
```html
<a href="../[other-slug]/index.html" class="game-card">
  <div class="card-thumb"><img src="../../assets/games/[other-slug].png" alt="[Other Game Name]"></div>
  <div class="card-info">
    <div class="card-title">[Other Game Name]</div>
    <span class="card-tag [other-tag-class]">[Other Genre]</span>
  </div>
</a>
```

---

## Step 4 — Create game scaffold (only if user said "scratch")

Create `games/[slug]/game.html` — a minimal self-contained canvas game:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>[Game Name]</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    canvas { display: block; image-rendering: pixelated; }
  </style>
</head>
<body>
<canvas id="canvas"></canvas>
<script>
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    const scale = Math.min(window.innerWidth / 640, window.innerHeight / 360);
    canvas.width = 640;
    canvas.height = 360;
    canvas.style.width  = Math.floor(640 * scale) + 'px';
    canvas.style.height = Math.floor(360 * scale) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Game state ────────────────────────────────────────
  // Add your variables here

  // ── Input ─────────────────────────────────────────────
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup',   e => keys[e.key] = false);

  // ── Update ────────────────────────────────────────────
  function update() {
    // Add your game logic here
  }

  // ── Render ────────────────────────────────────────────
  function render() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 640, 360);

    // Add your drawing code here
    ctx.fillStyle = '#F97316';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[Game Name]', 320, 180);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('Start coding your game here', 320, 215);
  }

  // ── Game loop ─────────────────────────────────────────
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  loop();
</script>
</body>
</html>
```

---

## Step 5 — Update `index.html`

Read `index.html`. Make two edits:

**Edit A — Hero section small-card grid:**
Find the FIRST `<div class="game-card coming-soon">` inside the `.small-card-grid` div. Replace the entire element (from `<div class="game-card coming-soon">` to its closing `</div>`) with a real `<a>` card:
```html
<a href="games/[slug]/index.html" class="game-card">
  <div class="card-thumb">
    <img src="assets/games/[slug].png" alt="[Game Name]">
  </div>
  <div class="card-info">
    <div class="card-title">[Game Name]</div>
    <span class="card-tag [tag-class]">[Genre Label]</span>
  </div>
</a>
```

**Edit B — All Games grid:**
Find the FIRST `<div class="game-card coming-soon">` inside the `.games-grid` div. Replace it with the same real `<a>` card pattern above.

---

## Step 6 — Update every existing game page

For each existing game page discovered in Step 2 (loop over all `games/*/index.html` except the new game):

**Edit A — Other Games sidebar:**
Find the comment `<!-- Other Games -->` section. Insert a new `<a class="mini-card">` for the new game immediately BEFORE the first `<div class="mini-card coming-soon">` in that sidebar section.

```html
<a href="../[slug]/index.html" class="mini-card">
  <div class="mini-thumb"><img src="../../assets/games/[slug].png" alt="[Game Name]"></div>
  <div class="mini-info">
    <div class="mini-title">[Game Name]</div>
    <span class="card-tag [tag-class]">[Genre Label]</span>
  </div>
</a>
```

**Edit B — Top Picks shelf:**
Find the `.game-page-shelf` div (the Top Picks section at the bottom). Insert a new `<a class="game-card">` for the new game immediately BEFORE the first `<div class="game-card coming-soon">` in that shelf's `.games-grid`.

```html
<a href="../[slug]/index.html" class="game-card">
  <div class="card-thumb"><img src="../../assets/games/[slug].png" alt="[Game Name]"></div>
  <div class="card-info">
    <div class="card-title">[Game Name]</div>
    <span class="card-tag [tag-class]">[Genre Label]</span>
  </div>
</a>
```

---

## Step 7 — Commit and push

Stage all new and modified files, then commit and push:

```bash
git add games/[slug]/ assets/games/[slug].png index.html games/*/index.html
git commit -m "feat: add [Game Name] to BlindFold Games portal"
git push
```

---

## Step 8 — Report completion

Tell the user:
- What files were created
- What files were updated
- The local URL to test: `http://localhost:8080/games/[slug]/`
- If scaffold was created, remind them to replace the placeholder game code in `games/[slug]/game.html`
