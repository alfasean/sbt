# Birthday Greeting Page — Anton Leoman

**Date:** 2026-06-29
**Status:** Approved design

## Purpose

A single-page React web app that wishes Anton Leoman a happy birthday. One-off,
personalized page (name baked in; photo and message to be filled in soon). Styled
with company accent colors plus neutrals.

## Tech Stack

- **Vite + React** — lightweight, fast dev/build for a single-page site.
- **canvas-confetti** — confetti bursts.
- **framer-motion** — smooth reveal/entrance animations.
- **Plain CSS** with CSS custom properties for theming.

## Color Palette

| Role            | Value     |
|-----------------|-----------|
| Primary (blue)  | `#115E9F` |
| Secondary (orange) | `#F07522` |
| Background      | `#FAFAFA` |
| Text            | `#1F2933` |
| Soft gray       | `#E4E7EB` |

## Page Flow (single page, top to bottom)

1. **Hero** — Large "Happy Birthday, Anton! 🎉" headline. Confetti burst on page
   load. Floating balloons in background. Accent-color styling.
2. **Surprise reveal (interactive)** — A "🎁 Click to open your surprise" button.
   On click: gift animates open → confetti burst → smoothly reveals the photo +
   message card below.
3. **Photo + Message card** — Hidden until the surprise is opened. Shows Anton's
   photo (placeholder) and the birthday note (placeholder text).
4. **Music control** — Small floating play/pause button fixed in a corner. Plays a
   placeholder track (swappable). No autoplay (browser-blocked); user taps to start.

## File Structure

```
sbt/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  ├─ anton.jpg          ← placeholder photo (swap later)
│  └─ birthday.mp3       ← placeholder music (swap later)
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ components/
   │  ├─ Hero.jsx
   │  ├─ Surprise.jsx       ← gift button + reveal logic
   │  ├─ MessageCard.jsx    ← photo + message
   │  └─ MusicButton.jsx
   ├─ styles/
   │  └─ index.css          ← CSS variables + global styles
   └─ data/
      └─ content.js         ← name, message, photo/music paths in one place
```

## Components

- **App.jsx** — Owns the `revealed` state (whether the surprise is opened). Composes
  Hero, Surprise, MessageCard, MusicButton. Triggers load confetti.
- **Hero.jsx** — Headline + balloons. Presentational; reads name from `content.js`.
- **Surprise.jsx** — Gift button. On click: fires confetti, calls `onReveal()` to flip
  `revealed` true. Depends on `canvas-confetti`.
- **MessageCard.jsx** — Photo + message. Animates in (framer-motion) when `revealed`.
  Reads photo path and message from `content.js`.
- **MusicButton.jsx** — Floating play/pause toggle wrapping an `<audio>` element.
  Owns its own play/pause state. Reads track path from `content.js`.
- **content.js** — Single source of editable content: `{ name, message, photo, music }`.

## Data Flow

- All editable content lives in `content.js`, imported by the components that render it.
- `revealed` state lives in App, passed down to Surprise (setter) and MessageCard (value).
- Music play state is local to MusicButton.

## Error / Edge Handling

- **Autoplay blocked** — music never autoplays; starts only on user tap. No error path.
- **Missing photo** — placeholder image shipped in `public/` so the page never breaks.
- **Reduced motion** — respect `prefers-reduced-motion`: tone down/skip large animations.

## Testing

- Manual verification: run dev server, confirm confetti on load, gift reveal works,
  music toggles, layout is responsive (mobile + desktop).
- No automated test suite for this small one-off page.

## Out of Scope (YAGNI)

- Countdown/age display (not requested).
- Reusable/multi-person templating (single person only).
- Backend, RSVP, routing, SSR.
