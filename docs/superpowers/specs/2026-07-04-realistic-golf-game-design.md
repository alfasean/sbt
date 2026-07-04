# Realistic Golf Mini-Game — Design Spec

**Date:** 2026-07-04
**Branch:** `feature/anton-birthday-page`
**Status:** Approved (design), pending implementation plan

## Context

This is a birthday surprise page for **Anton**, who loves golf. The page flow is
`intro → game → reveal`. The current game (`src/components/GolfGame.jsx`) is an
SVG side-view mini golf with a hold-to-charge power meter and a fully scripted
outcome (shot 1 always misses, shot 2 always sinks). The user wants the game to
feel **more realistic, classic, and fun** while still hiding a birthday surprise.

Decision: keep the golf theme (personal to Anton), but rebuild the game screen to
be genuinely playable and realistic. The `intro` and `reveal` screens stay as-is.

## Decisions

- **Theme:** Golf, upgraded to realistic.
- **Tech:** Phaser 3 embedded in the existing React/Vite app, using Matter.js
  physics. We write all game code ourselves — no cloning of pre-built game-engine
  bundles (Unity/Godot WebGL builds are heavy and their compiled scripts are not
  practically modifiable).
- **Win mechanic:** Skill-based (aim + power + wind, real physics) with an
  invisible assist that guarantees an eventual win, so Anton never gets stuck.
- **Surprise:** On sink, the hole/flag transforms into a birthday cake, confetti
  fires, then the page transitions to the existing reveal screen.

## Architecture

Flow is unchanged: `intro → game → reveal` (managed by `App.jsx`).

- **`src/components/GolfGame.jsx`** becomes a thin React wrapper:
  - Mounts a `Phaser.Game` into a container `div` on mount.
  - Receives `onComplete` prop; passes it into the Phaser scene (via the game
    registry or scene init data).
  - Destroys the Phaser game on unmount (guards against React StrictMode
    double-mount — track the instance in a ref, `game.destroy(true)` on cleanup).
- **`src/game/GolfScene.js`** (new) — a single Phaser `Scene` that owns:
  input handling, Matter physics bodies, rendering, wind, the assist logic, and
  the win → cake → reveal sequence.
- **`src/game/physics.js`** (new) — pure helper functions (no Phaser/DOM deps) so
  they are unit-testable: wind generation, assist/capture-tolerance calculation,
  sink detection.
- **Bridge to React:** when the ball sinks and the cake animation finishes, the
  scene calls `onComplete()`. `App.jsx` then sets `stage = "reveal"`.

### Component responsibilities

| Unit | Does | Depends on |
|------|------|-----------|
| `GolfGame.jsx` | Mount/unmount Phaser, wire `onComplete`, render container + reduced-motion fallback | Phaser, `content.js` |
| `GolfScene.js` | Gameplay loop, input, physics, graphics, win sequence | Phaser, `physics.js`, `content.js`, `canvas-confetti` |
| `physics.js` | Pure logic: wind, assist tolerance, sink test | (none) |

## Gameplay

- **Layout:** side view. Tee on the left, hole + flag on the right, putting green,
  parallax background.
- **Slingshot control:** player drags the ball back (like Angry Birds). Drag
  distance = power, drag angle = launch direction. One gesture, works on touch and
  mouse. A dashed trajectory preview shows while dragging.
- **Wind:** each shot has a wind vector (arrow + strength indicator) that applies a
  horizontal force during flight — the main source of realism/challenge.
- **Real physics (Matter.js):** ball launches as a projectile under gravity, wind
  applied in flight, bounces on the ground, then rolls on the green with friction
  until it stops.
- **Win** = ball comes to rest inside the cup.

## Guaranteed win (invisible assist)

- Track attempt count.
- A **capture tolerance** around the cup widens with each miss: a ball passing near
  the cup gets pulled in. Shot 1 uses a small (honest) tolerance; tolerance grows
  each attempt.
- After a configured number of attempts, the assist is strong enough that any
  reasonable shot sinks; a hard cap guarantees a sink so Anton can never dead-end.
- Assist is never shown to the player — it should feel earned.
- The attempt count before the guarantee is configurable (default target ~3–5,
  final value set during implementation/playtest).

## Surprise / reveal

- On sink: ball drops into cup → flag + hole transform into a **birthday cake with
  candles** → confetti burst (`canvas-confetti`) → banner "HOLE IN ONE! 🎉".
- After ~2s, scene calls `onComplete()` → existing `Reveal` screen (photo, message,
  music) shows.

## Graphics & polish

- Parallax background (sky gradient, hills, drifting clouds), textured green,
  animated waving flag.
- Optional SFX: soft "thwack" on hit, "plop" on sink — respect the mute state /
  don't autoplay aggressively.
- **Responsive:** Phaser `Scale.FIT` so it fills the container on mobile (touch)
  and desktop (mouse).
- **`prefers-reduced-motion`:** long animations are shortened; the game remains
  completable (fall back to a quick auto-advance path if needed).

## Content

Extend the `game` section of `src/data/content.js` with Indonesian strings:
drag-to-aim hint, wind label, miss text, sink text, cake/reveal text, retry CTA.

## Error handling & edge cases

- Phaser cleanup on unmount; StrictMode double-mount guard.
- Reduced motion (above).
- Guaranteed win prevents a dead-end for the birthday person.
- Responsive scaling for varied screen sizes.

## Testing

- **Unit tests** for `physics.js`: wind generation bounds, capture-tolerance grows
  with attempts and guarantees a sink at the cap, sink detection.
- **Manual playtest** for game feel (can't meaningfully unit-test Phaser rendering
  and input).

## Out of scope

- Multiple holes / levels.
- Other games (badminton, Capsa, durian/bakmi) — considered and set aside.
- Changes to the `intro` and `reveal` screens beyond wiring.
