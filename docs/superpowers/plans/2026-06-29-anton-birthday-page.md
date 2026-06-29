# Anton Leoman Birthday Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page React birthday greeting site for Anton Leoman with a hero, an interactive gift-surprise reveal (photo + message), confetti, and a music toggle.

**Architecture:** Vite + React single-page app. `App` owns a `revealed` boolean; clicking the gift fires confetti and flips `revealed`, animating in the photo/message card (framer-motion). All editable content (name, message, asset paths) lives in `src/data/content.js`. A floating button toggles an `<audio>` element (no autoplay).

**Tech Stack:** Vite, React 18, canvas-confetti, framer-motion, plain CSS with custom properties.

## Global Constraints

- Accent colors (exact): primary blue `#115E9F`, secondary orange `#F07522`.
- Neutrals: background `#FAFAFA`, text `#1F2933`, soft gray `#E4E7EB`.
- Single person only (Anton Leoman) — no multi-person templating.
- Photo and message are placeholders, editable in one file (`src/data/content.js`).
- Music must NOT autoplay; starts only on user interaction.
- Respect `prefers-reduced-motion`.
- Verification is manual (run dev server and observe). No automated test suite.

---

### Task 1: Scaffold Vite + React project and install dependencies

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx` (via Vite template, then trim)
- Create: `.gitignore`

**Interfaces:**
- Produces: a runnable Vite dev server; `App` default export rendered by `main.jsx`.

- [ ] **Step 1: Scaffold the Vite React template into the current directory**

Run (from `C:/Users/sean/Documents/sbt`):
```bash
npm create vite@latest . -- --template react
```
If prompted that the directory is not empty, choose to keep existing files (the `docs/` and `.git/` must remain). If the CLI refuses, scaffold into a temp dir and copy `package.json`, `vite.config.js`, `index.html`, and `src/` over.

- [ ] **Step 2: Install base + project dependencies**

Run:
```bash
npm install
npm install canvas-confetti framer-motion
```

- [ ] **Step 3: Verify the dev server boots**

Run:
```bash
npm run dev
```
Expected: Vite prints a `http://localhost:5173/` URL with no errors. Stop the server (Ctrl+C) after confirming.

- [ ] **Step 4: Ensure `.gitignore` excludes node_modules and build output**

Confirm `.gitignore` contains `node_modules` and `dist` (Vite template adds these). Add them if missing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React project with deps"
```

---

### Task 2: Content data module and global theme styles

**Files:**
- Create: `src/data/content.js`
- Create: `src/styles/index.css`
- Modify: `src/main.jsx` (import `./styles/index.css`)

**Interfaces:**
- Produces: `content` default export `{ name: string, message: string, photo: string, music: string }`.
- Produces: CSS custom properties on `:root` — `--blue`, `--orange`, `--bg`, `--text`, `--gray`.

- [ ] **Step 1: Create the content module**

`src/data/content.js`:
```js
const content = {
  name: "Anton Leoman",
  message:
    "Wishing you a fantastic birthday, Anton! Thank you for everything you bring to the team. Here's to a year full of wins, laughter, and good coffee. 🎂",
  photo: "/anton.jpg",   // placeholder — replace file in public/
  music: "/birthday.mp3", // placeholder — replace file in public/
};

export default content;
```

- [ ] **Step 2: Create global theme styles**

`src/styles/index.css`:
```css
:root {
  --blue: #115E9F;
  --orange: #F07522;
  --bg: #FAFAFA;
  --text: #1F2933;
  --gray: #E4E7EB;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root { min-height: 100%; }

body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

.app {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem 1.25rem 6rem;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Import the stylesheet in main.jsx**

Ensure `src/main.jsx` imports the stylesheet (replace the template's `index.css` import):
```jsx
import "./styles/index.css";
```
Delete the leftover template `src/index.css` and `src/App.css` if present, removing their imports.

- [ ] **Step 4: Verify no import errors**

Run `npm run dev`, confirm the page loads with the off-white background and no console errors. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add content data module and theme styles"
```

---

### Task 3: Hero component with load confetti

**Files:**
- Create: `src/components/Hero.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `content.name` from `src/data/content.js`; `canvas-confetti`.
- Produces: `<Hero />` (no props) rendering the headline + balloons.

- [ ] **Step 1: Create Hero component**

`src/components/Hero.jsx`:
```jsx
import content from "../data/content";

export default function Hero() {
  return (
    <header className="hero">
      <div className="balloons" aria-hidden="true">
        <span>🎈</span><span>🎈</span><span>🎈</span>
      </div>
      <h1 className="hero-title">
        Happy Birthday,<br />
        <span className="hero-name">{content.name}!</span> 🎉
      </h1>
      <p className="hero-sub">There's a little surprise waiting for you below.</p>
    </header>
  );
}
```

- [ ] **Step 2: Add Hero styles to index.css**

Append to `src/styles/index.css`:
```css
.hero { padding: 3rem 0 2rem; position: relative; }
.hero-title { font-size: clamp(2rem, 6vw, 3.25rem); line-height: 1.1; font-weight: 800; color: var(--blue); }
.hero-name { color: var(--orange); }
.hero-sub { margin-top: 1rem; font-size: 1.05rem; color: #52606D; }
.balloons { display: flex; gap: 1.5rem; justify-content: center; font-size: 2.5rem; margin-bottom: 1rem; }
.balloons span { animation: float 3s ease-in-out infinite; }
.balloons span:nth-child(2) { animation-delay: .4s; }
.balloons span:nth-child(3) { animation-delay: .8s; }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
```

- [ ] **Step 3: Render Hero in App and fire confetti on mount**

Replace `src/App.jsx` with:
```jsx
import { useEffect } from "react";
import confetti from "canvas-confetti";
import Hero from "./components/Hero";

export default function App() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 },
      colors: ["#115E9F", "#F07522", "#FAFAFA"] });
  }, []);

  return (
    <main className="app">
      <Hero />
    </main>
  );
}
```

- [ ] **Step 4: Verify**

Run `npm run dev`. Expected: headline "Happy Birthday, Anton Leoman!" with blue/orange styling, floating balloons, and a confetti burst on load. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add hero section with load confetti"
```

---

### Task 4: Surprise reveal + MessageCard with placeholder assets

**Files:**
- Create: `src/components/Surprise.jsx`
- Create: `src/components/MessageCard.jsx`
- Create: `public/anton.jpg` (placeholder image)
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `content.message`, `content.photo`; `canvas-confetti`; `framer-motion`.
- `Surprise` props: `{ revealed: boolean, onReveal: () => void }`.
- `MessageCard` props: `{ revealed: boolean }`.
- Produces: reveal interaction driven by App's `revealed` state.

- [ ] **Step 1: Add a placeholder photo**

Place any image at `public/anton.jpg`. If none available, create a simple placeholder:
```bash
# minimal 1x1 placeholder if no image on hand; replace later
node -e "require('fs').writeFileSync('public/anton.jpg', Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAAv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AvwD/2Q==','base64'));"
```

- [ ] **Step 2: Create Surprise component**

`src/components/Surprise.jsx`:
```jsx
import confetti from "canvas-confetti";

export default function Surprise({ revealed, onReveal }) {
  if (revealed) return null;

  function handleClick() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.7 },
        colors: ["#115E9F", "#F07522", "#FAFAFA"] });
    }
    onReveal();
  }

  return (
    <section className="surprise">
      <button className="gift-btn" onClick={handleClick}>
        🎁 Click to open your surprise
      </button>
    </section>
  );
}
```

- [ ] **Step 3: Create MessageCard component**

`src/components/MessageCard.jsx`:
```jsx
import { motion, AnimatePresence } from "framer-motion";
import content from "../data/content";

export default function MessageCard({ revealed }) {
  return (
    <AnimatePresence>
      {revealed && (
        <motion.section
          className="card"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <img className="card-photo" src={content.photo} alt={content.name} />
          <p className="card-message">{content.message}</p>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Add styles for surprise + card**

Append to `src/styles/index.css`:
```css
.surprise { margin: 2.5rem 0; }
.gift-btn {
  font-size: 1.15rem; font-weight: 700; color: #fff;
  background: var(--orange); border: none; border-radius: 999px;
  padding: 0.9rem 1.8rem; cursor: pointer; box-shadow: 0 6px 18px rgba(240,117,34,.35);
  transition: transform .15s ease, box-shadow .15s ease;
}
.gift-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(240,117,34,.45); }
.card {
  background: #fff; border: 1px solid var(--gray); border-radius: 20px;
  padding: 1.75rem; box-shadow: 0 10px 30px rgba(31,41,51,.08); margin-top: 1rem;
}
.card-photo {
  width: 180px; height: 180px; object-fit: cover; border-radius: 50%;
  border: 4px solid var(--blue); margin-bottom: 1.25rem;
}
.card-message { font-size: 1.1rem; line-height: 1.6; color: var(--text); }
```

- [ ] **Step 5: Wire state in App**

Update `src/App.jsx`:
```jsx
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import Hero from "./components/Hero";
import Surprise from "./components/Surprise";
import MessageCard from "./components/MessageCard";

export default function App() {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 },
      colors: ["#115E9F", "#F07522", "#FAFAFA"] });
  }, []);

  return (
    <main className="app">
      <Hero />
      <Surprise revealed={revealed} onReveal={() => setRevealed(true)} />
      <MessageCard revealed={revealed} />
    </main>
  );
}
```

- [ ] **Step 6: Verify**

Run `npm run dev`. Expected: gift button visible; clicking it bursts confetti, hides the button, and animates in the photo + message card. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add surprise reveal and message card"
```

---

### Task 5: Floating music toggle

**Files:**
- Create: `src/components/MusicButton.jsx`
- Create: `public/birthday.mp3` (placeholder track)
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `content.music`.
- Produces: `<MusicButton />` (no props), self-contained play/pause over an `<audio>` ref.

- [ ] **Step 1: Add a placeholder audio file**

Place any short `.mp3` at `public/birthday.mp3` (swap later). If none on hand, create a tiny silent file as a stand-in:
```bash
node -e "require('fs').writeFileSync('public/birthday.mp3', Buffer.from('SUQzAwAAAAAAFlRTU0UAAAAMAAADTGF2ZjU4LjI5AAAAAAAAAAAAAAD/8w==','base64'));"
```

- [ ] **Step 2: Create MusicButton component**

`src/components/MusicButton.jsx`:
```jsx
import { useRef, useState } from "react";
import content from "../data/content";

export default function MusicButton() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  return (
    <>
      <audio ref={audioRef} src={content.music} loop />
      <button
        className="music-btn"
        onClick={toggle}
        aria-label={playing ? "Pause music" : "Play music"}
      >
        {playing ? "⏸️" : "🔊"}
      </button>
    </>
  );
}
```

- [ ] **Step 3: Add music button styles**

Append to `src/styles/index.css`:
```css
.music-btn {
  position: fixed; right: 1.25rem; bottom: 1.25rem; z-index: 10;
  width: 56px; height: 56px; border-radius: 50%; border: none;
  background: var(--blue); color: #fff; font-size: 1.5rem; cursor: pointer;
  box-shadow: 0 6px 18px rgba(17,94,159,.4); transition: transform .15s ease;
}
.music-btn:hover { transform: scale(1.07); }
```

- [ ] **Step 4: Render MusicButton in App**

Add `import MusicButton from "./components/MusicButton";` and render `<MusicButton />` inside `<main className="app">`, after `<MessageCard />`.

- [ ] **Step 5: Verify**

Run `npm run dev`. Expected: floating blue button bottom-right; clicking toggles the icon between 🔊 and ⏸️ (audio plays if the placeholder has sound). No autoplay on load. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add floating music toggle"
```

---

### Task 6: Final polish and production build check

**Files:**
- Modify: `index.html` (title + lang), any minor style touch-ups.

- [ ] **Step 1: Set the page title and lang**

In `index.html`, set `<html lang="en">` and `<title>Happy Birthday, Anton!</title>`.

- [ ] **Step 2: Responsive check**

Run `npm run dev`, view at mobile width (~375px) and desktop. Confirm hero, gift button, card, and music button all render without overflow. Adjust padding only if something clips.

- [ ] **Step 3: Production build**

Run:
```bash
npm run build
```
Expected: build completes with no errors, output in `dist/`.

- [ ] **Step 4: Preview the build**

Run:
```bash
npm run preview
```
Expected: served page behaves like dev (confetti, reveal, music). Stop after confirming.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: final polish and verified production build"
```

---

## Self-Review

**Spec coverage:**
- Hero + confetti + balloons → Task 3 ✓
- Surprise reveal (gift) → Task 4 ✓
- Photo + message card → Task 4 ✓
- Music control (no autoplay) → Task 5 ✓
- Single editable content file → Task 2 (`content.js`) ✓
- Color palette → Task 2 (CSS vars) ✓
- prefers-reduced-motion → Task 2 (CSS) + Tasks 3/4 (JS guards) ✓
- File structure from spec → covered across Tasks 1–5 ✓
- Manual verification → every task has a run-and-observe step ✓

**Placeholder scan:** Placeholder *assets* (photo/music) are intentional per spec and editable in `content.js`; no plan-step placeholders.

**Type consistency:** `content` shape `{ name, message, photo, music }` used consistently. `revealed`/`onReveal` prop names match between App, Surprise, and MessageCard.

## Notes

- To personalize later: replace `public/anton.jpg` and `public/birthday.mp3`, and edit text in `src/data/content.js`. No component changes needed.
