# Realistic Golf Mini-Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scripted SVG mini-golf screen with a genuinely playable, physics-based Phaser golf game that guarantees an eventual win and then reveals the birthday surprise.

**Architecture:** A thin React wrapper (`GolfGame.jsx`) mounts a `Phaser.Game` into a div and passes an `onComplete` callback through the Phaser registry. A single `GolfScene` owns input (slingshot aim), Matter.js physics (flight, bounce, roll, wind), an invisible assist that widens the cup-capture zone each miss, and the win sequence (cake + confetti) that calls `onComplete()` to advance the existing `App.jsx` flow to the reveal screen. Pure, framework-free logic lives in `physics.js` and is unit-tested with Vitest.

**Tech Stack:** React 19, Vite 8, Phaser 3 (Matter.js physics), canvas-confetti, Vitest (new), oxlint.

## Global Constraints

- Keep the existing `intro → game → reveal` flow in `App.jsx`; only the game screen changes. Do NOT modify `Intro.jsx`, `Reveal.jsx`, or `MusicButton.jsx`.
- All player-facing copy is in Indonesian and lives in `src/data/content.js` — no hardcoded strings in components/scene.
- No external/binary game assets (no sprite/audio files). Draw all game graphics with Phaser Graphics / generated textures. (Keeps the repo asset-free and license-clean.)
- Respect `prefers-reduced-motion`: shorten/skip long animations; the game must stay completable.
- Responsive: Phaser `Scale.FIT`, logical size 800×480, works with mouse and touch.
- The game must be impossible to dead-end: a sink is guaranteed by attempt `ASSIST.guaranteeAttempt`.
- Brand colors (from `src/styles/index.css`): blue `#115E9F`, orange `#F07522`, gold `#E0A92E`.
- Package manager: npm.

---

### Task 1: Pure physics/assist logic + Vitest tooling

**Files:**
- Modify: `package.json` (add `vitest` devDependency, `test` script)
- Create: `src/game/physics.js`
- Test: `src/game/physics.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ASSIST` — `{ baseRadius: number, growthPerMiss: number, guaranteeAttempt: number }`
  - `captureRadius(attempt: number, cfg = ASSIST): number`
  - `isSunk(ballX: number, cupX: number, attempt: number, cfg = ASSIST): boolean`
  - `generateWind(rand = Math.random): { direction: -1 | 1, strength: number }` (strength in `[0,1]`)

- [ ] **Step 1: Add Vitest tooling to `package.json`**

Add a `test` script and the `vitest` devDependency. The `scripts` and `devDependencies` blocks become:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview",
    "test": "vitest run"
  },
```

Add to `devDependencies` (keep existing entries):

```json
    "vitest": "^3.2.4"
```

Then install:

```bash
npm install
```

- [ ] **Step 2: Write the failing test**

Create `src/game/physics.test.js`:

```js
import { describe, it, expect } from "vitest";
import { ASSIST, captureRadius, isSunk, generateWind } from "./physics";

describe("captureRadius", () => {
  it("is baseRadius on the first attempt", () => {
    expect(captureRadius(1)).toBe(ASSIST.baseRadius);
  });

  it("widens with each miss", () => {
    expect(captureRadius(3)).toBe(ASSIST.baseRadius + 2 * ASSIST.growthPerMiss);
    expect(captureRadius(3)).toBeGreaterThan(captureRadius(1));
  });
});

describe("isSunk", () => {
  it("sinks a ball inside the capture zone", () => {
    expect(isSunk(680, 680, 1)).toBe(true);
    expect(isSunk(680 - ASSIST.baseRadius, 680, 1)).toBe(true);
  });

  it("misses a ball outside the capture zone on an early attempt", () => {
    expect(isSunk(680 - ASSIST.baseRadius - 5, 680, 1)).toBe(false);
  });

  it("is guaranteed once guaranteeAttempt is reached, regardless of distance", () => {
    expect(isSunk(0, 680, ASSIST.guaranteeAttempt)).toBe(true);
    expect(isSunk(0, 680, ASSIST.guaranteeAttempt + 2)).toBe(true);
  });
});

describe("generateWind", () => {
  it("uses the injected rng for strength and direction", () => {
    const values = [0.42, 0.2]; // first call -> strength, second -> direction
    const rand = () => values.shift();
    const wind = generateWind(rand);
    expect(wind.strength).toBe(0.42);
    expect(wind.direction).toBe(-1); // 0.2 < 0.5 => left
  });

  it("keeps strength within [0,1]", () => {
    const wind = generateWind(() => 0.999);
    expect(wind.strength).toBeGreaterThanOrEqual(0);
    expect(wind.strength).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/game/physics.test.js`
Expected: FAIL — cannot resolve `./physics` (module does not exist yet).

- [ ] **Step 4: Write minimal implementation**

Create `src/game/physics.js`:

```js
// Pure, framework-free helpers for the golf game. No Phaser/DOM imports so
// these can be unit-tested directly.

export const ASSIST = {
  baseRadius: 10,      // capture half-width (world px) on the first shot
  growthPerMiss: 16,   // how much the capture zone widens after each miss
  guaranteeAttempt: 4, // on this attempt (1-indexed) the shot always sinks
};

// Half-width of the "counts as in the cup" zone for a given attempt.
export function captureRadius(attempt, cfg = ASSIST) {
  return cfg.baseRadius + Math.max(0, attempt - 1) * cfg.growthPerMiss;
}

// Did the ball (resting at ballX) end up in the cup (at cupX) this attempt?
// The zone widens after each miss and is guaranteed once guaranteeAttempt hits,
// so the player always eventually sinks it.
export function isSunk(ballX, cupX, attempt, cfg = ASSIST) {
  if (attempt >= cfg.guaranteeAttempt) return true;
  return Math.abs(ballX - cupX) <= captureRadius(attempt, cfg);
}

// Randomised wind for a shot. `rand` is injectable for deterministic tests.
// direction: -1 (left) or +1 (right); strength: 0..1 (2 decimals).
export function generateWind(rand = Math.random) {
  const strength = Math.round(rand() * 100) / 100;
  const direction = rand() < 0.5 ? -1 : 1;
  return { direction, strength };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/game/physics.test.js`
Expected: PASS — all assertions green.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/game/physics.js src/game/physics.test.js
git commit -m "feat: add golf physics/assist helpers with vitest"
```

---

### Task 2: Indonesian copy for the new game

**Files:**
- Modify: `src/data/content.js` (the `game` object)

**Interfaces:**
- Consumes: nothing.
- Produces: `content.game` gains `windLabel`, `tapToRetry`; existing `hint`, `missText`, `retryCta`, `sinkText` are updated. Shape used by the scene:
  `{ hint: string, windLabel: string, missText: string, tapToRetry: string, retryCta: string, sinkText: string }`

- [ ] **Step 1: Update the `game` object**

Replace the current `game: { ... }` block in `src/data/content.js` with:

```js
  // --- The game: real physics golf. The win is guaranteed via a hidden assist
  // that widens the cup after each miss (see src/game/physics.js). ---
  game: {
    hint: "Tarik bolanya ke belakang, lalu lepas untuk memukul. Awas anginnya! ⛳",
    windLabel: "Angin",
    missText: "Yaah, meleset tipis! 😅",
    tapToRetry: "Ketuk untuk coba lagi 🔁",
    retryCta: "Coba Lagi 🔁",
    sinkText: "MASUK! HOLE IN ONE! 🎉",
  },
```

- [ ] **Step 2: Verify it parses**

Run: `npm run lint`
Expected: no errors introduced by `content.js`.

- [ ] **Step 3: Commit**

```bash
git add src/data/content.js
git commit -m "feat: add copy for realistic golf game"
```

---

### Task 3: React wrapper + static Phaser scene

Mounts Phaser and draws the (non-interactive) course so we can confirm the engine boots inside the existing flow.

**Files:**
- Modify: `package.json` (add `phaser` dependency)
- Modify: `src/components/GolfGame.jsx` (full replacement of current SVG implementation)
- Create: `src/game/GolfScene.js`

**Interfaces:**
- Consumes: `content.game` (Task 2); `generateWind` (Task 1); `Phaser`.
- Produces:
  - `GolfGame` React component: props `{ onComplete: () => void }`.
  - `GolfScene` Phaser scene (key `"golf"`) with, at this stage: `create()`, `drawBackground()`, `buildGround()`, `buildHole()`, `createBall()`, `buildHud()`. Reads `onComplete` and `reduceMotion` from the game registry. Module exports these world constants for later tasks: `W=800, H=480, GROUND_Y=400, TEE_X=120, CUP_X=680, BALL_R=12`.

- [ ] **Step 1: Add Phaser and install**

Add to `dependencies` in `package.json` (keep existing entries):

```json
    "phaser": "^3.90.0"
```

Then:

```bash
npm install
```

- [ ] **Step 2: Replace `GolfGame.jsx` with the Phaser wrapper**

Overwrite `src/components/GolfGame.jsx`:

```jsx
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { GolfScene, W, H } from "../game/GolfScene";

// Thin React wrapper: mounts a Phaser game into a div and hands the scene an
// onComplete callback (via the registry). The scene calls it once the winning
// putt + cake sequence finishes, which advances App.jsx to the reveal screen.
export default function GolfGame({ onComplete }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (gameRef.current) return; // guard React StrictMode double-mount
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: "#bfe6ff",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: W,
        height: H,
      },
      physics: {
        default: "matter",
        matter: { gravity: { y: 1 }, debug: false },
      },
      scene: [GolfScene],
    });

    game.registry.set("onComplete", () => onCompleteRef.current?.());
    game.registry.set("reduceMotion", reduceMotion);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="golf-canvas" />;
}
```

- [ ] **Step 3: Create the static scene**

Create `src/game/GolfScene.js`:

```js
import Phaser from "phaser";
import content from "../data/content";
import { generateWind } from "./physics";

const { game: T } = content;

export const W = 800;
export const H = 480;
export const GROUND_Y = 400;
export const TEE_X = 120;
export const CUP_X = 680;
export const BALL_R = 12;

export class GolfScene extends Phaser.Scene {
  constructor() {
    super("golf");
  }

  create() {
    this.onComplete = this.registry.get("onComplete");
    this.reduceMotion = this.registry.get("reduceMotion");

    this.attempt = 1;
    this.state = "aiming"; // aiming | flying | missed | won
    this.wind = generateWind();

    this.drawBackground();
    this.buildGround();
    this.buildHole();
    this.createBall();
    this.buildHud();
  }

  drawBackground() {
    // sky gradient (two stacked rects as a cheap gradient)
    this.add.rectangle(W / 2, H / 2, W, H, 0x7ec4ff).setDepth(-10);
    this.add.rectangle(W / 2, H * 0.75, W, H * 0.5, 0xbfe6ff).setDepth(-10);
    this.add.circle(W - 120, 90, 46, 0xfff3b0).setDepth(-9); // sun

    // rolling hills
    const hills = this.add.graphics().setDepth(-8);
    hills.fillStyle(0xbfe3a8, 1);
    hills.fillEllipse(220, GROUND_Y, 640, 260);
    hills.fillStyle(0x8ccf7e, 1);
    hills.fillEllipse(620, GROUND_Y + 20, 720, 300);

    // drifting clouds (skip motion when reduced)
    [{ x: 200, y: 90, s: 1 }, { x: 520, y: 60, s: 0.7 }].forEach((c) => {
      const cloud = this.add.graphics().setDepth(-7);
      cloud.fillStyle(0xffffff, 0.95);
      cloud.fillCircle(c.x, c.y, 26 * c.s);
      cloud.fillCircle(c.x + 30 * c.s, c.y + 6 * c.s, 20 * c.s);
      cloud.fillCircle(c.x - 26 * c.s, c.y + 8 * c.s, 16 * c.s);
      if (!this.reduceMotion) {
        this.tweens.add({
          targets: cloud,
          x: 80,
          duration: 26000 / c.s,
          repeat: -1,
          yoyo: true,
        });
      }
    });
  }

  buildGround() {
    // visible fairway/green
    const g = this.add.graphics().setDepth(-5);
    g.fillStyle(0x2f8b3f, 1);
    g.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    g.fillStyle(0x3fa14b, 1);
    g.fillEllipse(CUP_X, GROUND_Y + 6, 220, 40); // putting green
    // static physics floor; top surface sits at GROUND_Y
    this.matter.add.rectangle(W / 2, GROUND_Y + 60, W, 120, {
      isStatic: true,
      friction: 0.9,
      restitution: 0.2,
      label: "ground",
    });
  }

  buildHole() {
    const g = this.add.graphics().setDepth(-4);
    g.fillStyle(0x0a1d10, 1);
    g.fillEllipse(CUP_X, GROUND_Y, 26, 12); // the cup

    // flag pole + flag (waves unless reduced motion)
    this.add.line(0, 0, CUP_X, GROUND_Y, CUP_X, GROUND_Y - 90, 0xefe9dc)
      .setLineWidth(2)
      .setOrigin(0, 0)
      .setDepth(-4);
    this.flag = this.add.triangle(
      CUP_X, GROUND_Y - 82, 0, 0, 34, 9, 0, 18, 0xf07522
    ).setOrigin(0, 0).setDepth(-4);
    if (!this.reduceMotion) {
      this.tweens.add({
        targets: this.flag,
        scaleX: 0.85,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
  }

  createBall() {
    if (!this.textures.exists("ball")) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(BALL_R, BALL_R, BALL_R);
      g.lineStyle(2, 0xc7ced6, 1);
      g.strokeCircle(BALL_R, BALL_R, BALL_R);
      g.generateTexture("ball", BALL_R * 2, BALL_R * 2);
      g.destroy();
    }
    this.ball = this.matter.add.image(TEE_X, GROUND_Y - BALL_R, "ball");
    this.ball.setCircle(BALL_R);
    this.ball.setBounce(0.45);
    this.ball.setFriction(0.08);
    this.ball.setFrictionAir(0.02);
    this.ball.setDepth(2);
  }

  buildHud() {
    this.hintText = this.add
      .text(W / 2, H - 28, T.hint, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.windText = this.add
      .text(W / 2, 28, "", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#0c4374",
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.updateHud();
  }

  updateHud() {
    const arrow = this.wind.direction < 0 ? "←" : "→";
    const pct = Math.round(this.wind.strength * 100);
    this.windText.setText(`${T.windLabel} ${arrow} ${pct}%`);
  }
}
```

- [ ] **Step 4: Verify the scene mounts inside the app flow**

Run: `npm run dev`, open the app, click **Mulai Main**.
Expected: the golf course renders on a canvas (sky, hills, green, flag, ball on the tee, wind readout up top, hint at the bottom); no console errors; navigating away/back does not spawn duplicate canvases.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/GolfGame.jsx src/game/GolfScene.js
git commit -m "feat: mount Phaser golf scene with static course"
```

---

### Task 4: Slingshot aim, launch, wind, and physics flight

Adds interaction and motion. On stop, the ball just resets to the tee for the next attempt (win/miss handling comes in Task 5).

**Files:**
- Modify: `src/game/GolfScene.js`

**Interfaces:**
- Consumes: everything from Task 3.
- Produces (new scene members): `aimGfx` graphics; input handlers `onPointerDown/onPointerMove/onPointerUp`; `launch(vx, vy)`; `update()`; `resolveShot()` (Task 4 impl: resets); `resetForRetry()`; module constants `MAX_PULL=240`, `POWER=0.05`, `WIND_ACCEL=0.14`, `STOP_SPEED=0.6`.

- [ ] **Step 1: Add tuning constants**

In `src/game/GolfScene.js`, below the existing `export const BALL_R = 12;` line, add:

```js
const MAX_PULL = 240; // px; drag beyond this is clamped
const POWER = 0.05; // pull-distance (px) -> launch velocity
const WIND_ACCEL = 0.14; // per-frame vx nudge at full wind strength (airborne only)
const STOP_SPEED = 0.6; // speed below which a grounded ball counts as stopped
```

- [ ] **Step 2: Register input and the aim graphics in `create()`**

In `create()`, after the `this.buildHud();` line, append:

```js
    this.aimGfx = this.add.graphics().setDepth(5);
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);
```

- [ ] **Step 3: Add input handlers, launch, aim preview, update, and reset**

Add these methods to the `GolfScene` class (below `updateHud()`):

```js
  onPointerDown(pointer) {
    if (this.state !== "aiming") return;
    this.dragging = true;
    this.onPointerMove(pointer);
  }

  onPointerMove(pointer) {
    if (!this.dragging || this.state !== "aiming") return;
    // Slingshot: launch vector points from the pointer back toward the ball.
    let vx = this.ball.x - pointer.x;
    let vy = this.ball.y - pointer.y;
    const len = Math.hypot(vx, vy);
    if (len > MAX_PULL) {
      vx = (vx / len) * MAX_PULL;
      vy = (vy / len) * MAX_PULL;
    }
    this.aim = { vx, vy };
    this.drawTrajectory(vx, vy);
  }

  onPointerUp() {
    if (!this.dragging || this.state !== "aiming" || !this.aim) return;
    this.dragging = false;
    this.aimGfx.clear();
    this.launch(this.aim.vx * POWER, this.aim.vy * POWER);
    this.aim = null;
  }

  drawTrajectory(vx, vy) {
    // Cheap preview: integrate a projectile (ignores wind/bounce). Hint only.
    this.aimGfx.clear();
    this.aimGfx.fillStyle(0xffffff, 0.7);
    let x = this.ball.x;
    let y = this.ball.y;
    let dx = vx * POWER;
    let dy = vy * POWER;
    for (let i = 0; i < 22; i++) {
      x += dx;
      y += dy;
      dy += 0.35; // approx gravity per step
      if (y > GROUND_Y - BALL_R) break;
      if (i % 2 === 0) this.aimGfx.fillCircle(x, y, 2.5);
    }
  }

  launch(vx, vy) {
    this.state = "flying";
    this.hintText.setVisible(false);
    this.ball.setVelocity(vx, vy);
    this.ball.setAngularVelocity(vx * 0.02);
  }

  update() {
    if (this.state !== "flying") return;
    const v = this.ball.body.velocity;
    const airborne = this.ball.y < GROUND_Y - BALL_R - 4;
    if (airborne) {
      this.ball.setVelocityX(
        v.x + this.wind.direction * this.wind.strength * WIND_ACCEL
      );
    }
    const speed = Math.hypot(v.x, v.y);
    if (!airborne && speed < STOP_SPEED) {
      this.resolveShot();
    }
    // safety: ball left the field
    if (this.ball.x < -50 || this.ball.x > W + 50) this.resolveShot();
  }

  // Task 4: just reset. Task 5 replaces this with win/miss logic.
  resolveShot() {
    this.resetForRetry();
  }

  resetForRetry() {
    this.attempt += 1;
    this.wind = generateWind();
    this.updateHud();
    this.ball.setVelocity(0, 0);
    this.ball.setAngularVelocity(0);
    this.ball.setPosition(TEE_X, GROUND_Y - BALL_R);
    this.ball.setRotation(0);
    this.hintText.setVisible(true);
    this.state = "aiming";
  }
```

- [ ] **Step 4: Verify play feel**

Run: `npm run dev`, start the game.
Expected: pressing and dragging back from the ball shows a dashed trajectory arc; releasing launches the ball; it arcs, is pushed sideways by the wind, bounces on the ground, rolls, and stops; the ball then resets to the tee with a fresh wind reading. Try on a narrow window / device emulation — controls work with touch. If the ball never settles or flies off too easily, nudge `POWER`, `WIND_ACCEL`, `STOP_SPEED`, or the ball's `setFrictionAir` and re-test.

- [ ] **Step 5: Commit**

```bash
git add src/game/GolfScene.js
git commit -m "feat: add slingshot aim, wind, and flight physics"
```

---

### Task 5: Assist-based sink, miss/retry, and win → reveal

Wires the pure `isSunk` logic in, adds the miss banner + tap-to-retry, and the winning cake + confetti sequence that calls `onComplete()`.

**Files:**
- Modify: `src/game/GolfScene.js`

**Interfaces:**
- Consumes: `isSunk` (Task 1); `onComplete` from registry (Task 3); `confetti` from `canvas-confetti`.
- Produces (new/replaced scene members): import of `isSunk` and `confetti`; replaced `resolveShot()`; new `miss()`, `win()`, `showBanner(text, tint)`; retry now triggered by a tap while `state === "missed"`.

- [ ] **Step 1: Extend imports**

At the top of `src/game/GolfScene.js`, update the imports to add `isSunk` and `confetti`:

```js
import Phaser from "phaser";
import confetti from "canvas-confetti";
import content from "../data/content";
import { generateWind, isSunk } from "./physics";
```

- [ ] **Step 2: Replace `resolveShot()` with win/miss branching**

Replace the entire Task-4 `resolveShot()` method (the one that just calls `this.resetForRetry()`) with:

```js
  resolveShot() {
    if (this.state !== "flying") return;
    this.state = "resolving";
    if (isSunk(this.ball.x, CUP_X, this.attempt)) {
      this.win();
    } else {
      this.miss();
    }
  }
```

- [ ] **Step 3: Handle a miss with a retry-on-tap**

Add a `miss()` method to the class:

```js
  miss() {
    this.state = "missed";
    this.hintText.setVisible(false);
    this.showBanner(`${T.missText}\n${T.tapToRetry}`, 0x5c6b7a);
    // next tap anywhere clears the banner and re-tees
    this.input.once("pointerdown", () => {
      if (this.banner) this.banner.destroy();
      this.resetForRetry();
    });
  }
```

- [ ] **Step 4: Add the win sequence**

Add `win()` and `showBanner()` methods to the class:

```js
  win() {
    this.state = "won";
    this.hintText.setVisible(false);
    this.aimGfx.clear();

    // ball drops into the cup
    this.ball.setStatic(true);
    this.tweens.add({
      targets: this.ball,
      y: GROUND_Y + 6,
      scale: 0.2,
      duration: this.reduceMotion ? 1 : 260,
    });

    // hole/flag become a birthday cake
    this.drawCake();
    this.showBanner(T.sinkText, 0xe0a92e);
    if (!this.reduceMotion) this.burstConfetti();

    const wait = this.reduceMotion ? 400 : 2100;
    this.time.delayedCall(wait, () => this.onComplete && this.onComplete());
  }

  drawCake() {
    const cx = CUP_X;
    const top = GROUND_Y - 46;
    const cake = this.add.container(0, 0).setDepth(6);
    cake.add(this.add.rectangle(cx, top + 30, 70, 46, 0xf6c9a0)); // base
    cake.add(this.add.rectangle(cx, top + 8, 70, 12, 0xffffff)); // icing
    for (let i = -1; i <= 1; i++) {
      cake.add(this.add.rectangle(cx + i * 20, top - 8, 4, 18, 0xff8a3d)); // candle
      cake.add(this.add.circle(cx + i * 20, top - 20, 4, 0xffe08a)); // flame
    }
    if (this.flag) this.flag.setVisible(false);
    if (!this.reduceMotion) {
      cake.setScale(0);
      this.tweens.add({ targets: cake, scale: 1, duration: 420, ease: "Back.out" });
    }
  }

  burstConfetti() {
    confetti({
      particleCount: 200,
      spread: 110,
      startVelocity: 48,
      origin: { y: 0.7 },
      colors: ["#115E9F", "#F07522", "#FAFAFA", "#E0A92E"],
    });
  }

  showBanner(text, tint) {
    if (this.banner) this.banner.destroy();
    this.banner = this.add
      .text(W / 2, 90, text, {
        fontFamily: "Anton, sans-serif",
        fontSize: "30px",
        color: Phaser.Display.Color.IntegerToColor(tint).rgba,
        align: "center",
        backgroundColor: "#ffffffcc",
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(9);
    if (!this.reduceMotion) {
      this.banner.setScale(0.8);
      this.tweens.add({
        targets: this.banner,
        scale: 1,
        duration: 300,
        ease: "Back.out",
      });
    }
  }
```

- [ ] **Step 5: Verify the full loop**

Run: `npm run dev`, start the game, and play.
Expected: a shot that lands away from the cup shows the miss banner + "ketuk untuk coba lagi"; tapping re-tees with new wind. Because the assist widens each miss and guarantees a sink by attempt 4, within a few tries the ball drops into the cup → a cake with candles pops up, confetti fires, the "HOLE IN ONE!" banner shows, and ~2s later the page transitions to the birthday **reveal** screen (photo, message, music). Verify a first-shot bullseye also wins immediately.

- [ ] **Step 6: Commit**

```bash
git add src/game/GolfScene.js
git commit -m "feat: guaranteed-win sink, retry, and birthday cake reveal"
```

---

### Task 6: Styling, reduced-motion pass, and cleanup

Style the canvas container, remove the now-dead SVG-era CSS, and confirm build/lint/tests all pass.

**Files:**
- Modify: `src/styles/index.css`

**Interfaces:**
- Consumes: `.golf-canvas` class rendered by `GolfGame.jsx` (Task 3).
- Produces: canvas container styling; removal of obsolete `.scene-svg`, `.golf-cloud*`, `.golf-flag`, `@keyframes drift/sway`, `.power-meter`, `.power-fill`, `.golf-hint`, `.golf-banner*`, `@keyframes pop` rules (all superseded by in-canvas rendering).

- [ ] **Step 1: Replace the golf-scene CSS block**

In `src/styles/index.css`, replace the entire section that starts at the `/* ---------- golf scene ---------- */` comment and ends just before `/* ---------- reveal ---------- */` with:

```css
/* ---------- golf scene (Phaser canvas) ---------- */
.golf-wrap { width: 100%; display: flex; flex-direction: column; align-items: center; }
.golf-canvas {
  width: 100%;
  max-width: 480px;
  aspect-ratio: 800 / 480;
  border-radius: 16px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 0 18px 44px rgba(17, 40, 70, 0.18), inset 0 0 0 1px rgba(17,40,70,0.06);
}
.golf-canvas canvas { display: block; width: 100% !important; height: 100% !important; }
```

- [ ] **Step 2: Verify reduced motion**

In the browser dev tools, emulate `prefers-reduced-motion: reduce` (Rendering tab), then play a full round.
Expected: clouds/flag don't animate, the cake/banner appear without the pop/scale tweens, and the win still advances to the reveal (after a short delay). The game remains fully playable and completable.

- [ ] **Step 3: Verify build, lint, and tests**

Run each and confirm all pass:

```bash
npm test
npm run lint
npm run build
```

Expected: `npm test` — physics tests pass; `npm run lint` — no errors; `npm run build` — production build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/styles/index.css
git commit -m "chore: style Phaser canvas and remove dead golf SVG styles"
```

---

## Notes for the implementer

- **Physics tuning is expected.** The constants in `GolfScene.js` (`POWER`, `WIND_ACCEL`, `STOP_SPEED`, ball friction/bounce) and in `physics.js` (`ASSIST`) are starting points. Play the game and adjust for a fun, fair feel. The only hard requirement: a sink must be guaranteed by `ASSIST.guaranteeAttempt`.
- **Assist stays invisible.** Never surface the capture radius or attempt count to the player — the win must feel earned.
- **Don't touch** `Intro.jsx`, `Reveal.jsx`, `MusicButton.jsx`, or the `App.jsx` stage flow. The scene's `onComplete()` is the only bridge back to React.
```
