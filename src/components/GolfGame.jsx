import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import content from "../data/content";

const { game } = content;

// viewBox: 200 x 120 (landscape side-view)
const PLAY_Y = 90; // ground line the ball travels along
const BALL_X0 = 41; // tee position
const BALL_R = 2.4;
const CUP_X = 172;
const MISS_LAND_X = 149; // where a missed shot lands...
const MISS_STOP_X = 161; // ...and rolls to a stop, just short of the cup

const SHOULDER = { x: 27, y: 73 }; // pivot for the swinging club
const CLUB_REST = 0;
const CLUB_BACK = -86;
const CLUB_FOLLOW = 40;

const POWER_PERIOD = 1300; // ms for one up/down sweep of the power bar

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInQuad = (t) => t * t;

export default function GolfGame({ onComplete }) {
  const svgRef = useRef(null);
  const rafs = useRef({}); // named raf handles so they don't clobber each other
  const powerRef = useRef(0);

  const [phase, setPhase] = useState("idle"); // idle|charging|backswing|down|flying|rolling|missed|done
  const [power, setPower] = useState(0);
  const [clubAngle, setClubAngle] = useState(CLUB_REST);
  const [ball, setBall] = useState({ x: BALL_X0, y: PLAY_Y, r: BALL_R });
  const [attempt, setAttempt] = useState(1);
  const [banner, setBanner] = useState(null); // { text, kind }

  const reduceMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(
    () => () => Object.values(rafs.current).forEach((id) => cancelAnimationFrame(id)),
    []
  );

  // Generic single-value tween.
  function tween(key, from, to, dur, onUpdate, onDone, ease = easeOutCubic) {
    cancelAnimationFrame(rafs.current[key]);
    if (reduceMotion()) {
      onUpdate(to, 1);
      onDone && onDone();
      return;
    }
    const t0 = performance.now();
    const loop = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      onUpdate(from + (to - from) * ease(p), p);
      if (p < 1) rafs.current[key] = requestAnimationFrame(loop);
      else onDone && onDone();
    };
    rafs.current[key] = requestAnimationFrame(loop);
  }

  // --- power bar ---
  function startCharge() {
    if (phase !== "idle") return;
    setPhase("charging");
    if (reduceMotion()) {
      powerRef.current = 80;
      setPower(80);
      return;
    }
    const t0 = performance.now();
    const loop = (now) => {
      const ph = ((now - t0) % POWER_PERIOD) / POWER_PERIOD;
      const v = (ph < 0.5 ? ph * 2 : (1 - ph) * 2) * 100;
      powerRef.current = v;
      setPower(v);
      rafs.current.power = requestAnimationFrame(loop);
    };
    rafs.current.power = requestAnimationFrame(loop);
  }

  // --- release → swing → (scripted) flight ---
  function release() {
    if (phase !== "charging") return;
    cancelAnimationFrame(rafs.current.power);
    const outcome = attempt === 1 ? "miss" : "sink";

    setPhase("backswing");
    let launched = false;
    tween("swing", CLUB_REST, CLUB_BACK, 260, setClubAngle, () => {
      setPhase("down");
      tween(
        "swing",
        CLUB_BACK,
        CLUB_FOLLOW,
        200,
        (a, p) => {
          setClubAngle(a);
          if (!launched && p >= 0.7) {
            launched = true;
            startFlight(outcome);
          }
        },
        undefined,
        easeInQuad
      );
    });
  }

  function startFlight(outcome) {
    setPhase("flying");
    const landX = outcome === "sink" ? CUP_X : MISS_LAND_X;
    const peak = outcome === "sink" ? 54 : 44;
    const dur = 900;

    if (reduceMotion()) {
      setBall((b) => ({ ...b, x: landX, y: PLAY_Y }));
      outcome === "sink" ? dropIn() : rollOut();
      return;
    }
    const t0 = performance.now();
    const loop = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const x = BALL_X0 + (landX - BALL_X0) * p;
      const y = PLAY_Y - peak * Math.sin(Math.PI * p);
      setBall((b) => ({ ...b, x, y }));
      if (p < 1) rafs.current.flight = requestAnimationFrame(loop);
      else outcome === "sink" ? dropIn() : rollOut();
    };
    rafs.current.flight = requestAnimationFrame(loop);
  }

  function rollOut() {
    setPhase("rolling");
    tween(
      "roll",
      MISS_LAND_X,
      MISS_STOP_X,
      650,
      (x) => setBall((b) => ({ ...b, x, y: PLAY_Y })),
      () => {
        setBanner({ text: game.missText, kind: "miss" });
        setPhase("missed");
      }
    );
  }

  function dropIn() {
    tween(
      "drop",
      0,
      1,
      300,
      (t) => setBall((b) => ({ ...b, r: BALL_R * (1 - t), y: PLAY_Y + t * 2.5 })),
      () => {
        celebrate();
        setBanner({ text: game.sinkText, kind: "sink" });
        setPhase("done");
        setTimeout(() => onComplete(), 2100);
      }
    );
  }

  function celebrate() {
    if (reduceMotion()) return;
    confetti({
      particleCount: 200,
      spread: 110,
      startVelocity: 48,
      origin: { y: 0.7 },
      colors: ["#115E9F", "#F07522", "#FAFAFA", "#FFD166"],
    });
  }

  function retry() {
    Object.values(rafs.current).forEach((id) => cancelAnimationFrame(id));
    setBall({ x: BALL_X0, y: PLAY_Y, r: BALL_R });
    setClubAngle(CLUB_REST);
    setPower(0);
    setBanner(null);
    setAttempt(2);
    setPhase("idle");
  }

  const canSwing = phase === "idle" || phase === "charging";

  return (
    <div className="golf-wrap">
      <svg
        ref={svgRef}
        className="scene-svg"
        viewBox="0 0 200 120"
        role="img"
        aria-label="Mini golf course"
        style={{ cursor: canSwing ? "pointer" : "default" }}
        onPointerDown={canSwing ? startCharge : undefined}
        onPointerUp={canSwing ? release : undefined}
        onPointerLeave={phase === "charging" ? release : undefined}
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7ec4ff" />
            <stop offset="70%" stopColor="#bfe6ff" />
            <stop offset="100%" stopColor="#e8f7ff" />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5cb85a" />
            <stop offset="100%" stopColor="#2f8b3f" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff6cf" />
            <stop offset="40%" stopColor="#ffe98a" />
            <stop offset="100%" stopColor="rgba(255,233,138,0)" />
          </radialGradient>
          <radialGradient id="ballg" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#eef1f4" />
            <stop offset="100%" stopColor="#c7ced6" />
          </radialGradient>
        </defs>

        {/* sky + sun */}
        <rect x="0" y="0" width="200" height="120" fill="url(#sky)" />
        <circle cx="170" cy="24" r="22" fill="url(#sun)" />
        <circle cx="170" cy="24" r="9" fill="#fff3b0" />

        {/* clouds */}
        <g className="golf-cloud" opacity="0.95" fill="#ffffff">
          <ellipse cx="50" cy="26" rx="11" ry="6" />
          <ellipse cx="60" cy="24" rx="9" ry="7" />
          <ellipse cx="41" cy="28" rx="7" ry="5" />
        </g>
        <g className="golf-cloud golf-cloud2" opacity="0.85" fill="#ffffff">
          <ellipse cx="120" cy="18" rx="9" ry="5" />
          <ellipse cx="129" cy="17" rx="7" ry="5" />
        </g>

        {/* far + mid hills */}
        <path d="M0 84 Q50 70 100 80 T200 78 L200 120 L0 120 Z" fill="#bfe3a8" />
        <path d="M0 90 Q60 78 120 88 T200 86 L200 120 L0 120 Z" fill="#8ccf7e" />

        {/* trees on the hills */}
        {[{ x: 80, y: 80 }, { x: 132, y: 82 }].map((t, i) => (
          <g key={i}>
            <rect x={t.x - 1} y={t.y} width="2" height="6" fill="#6b4423" />
            <circle cx={t.x} cy={t.y - 1} r="4.5" fill="#3f9d52" />
            <circle cx={t.x - 3} cy={t.y + 1} r="3.2" fill="#48ab5b" />
            <circle cx={t.x + 3} cy={t.y + 1} r="3.2" fill="#48ab5b" />
          </g>
        ))}

        {/* fairway */}
        <path d="M0 92 Q70 84 140 90 T200 90 L200 120 L0 120 Z" fill="url(#ground)" />
        {/* putting green near the hole */}
        <ellipse cx="170" cy="93" rx="26" ry="5.5" fill="#3fa14b" />

        {/* tee patch */}
        <ellipse cx={BALL_X0} cy={PLAY_Y + 1.5} rx="7" ry="2.2" fill="#3fa14b" />

        {/* hole + flag */}
        <ellipse cx={CUP_X} cy={PLAY_Y + 0.5} rx="3" ry="1.6" fill="rgba(0,0,0,0.3)" />
        <ellipse cx={CUP_X} cy={PLAY_Y} rx="2.8" ry="1.5" fill="#0a1d10" />
        <g className="golf-flag" style={{ transformOrigin: `${CUP_X}px 60px` }}>
          <line x1={CUP_X} y1={PLAY_Y} x2={CUP_X} y2="60" stroke="#efe9dc" strokeWidth="1" strokeLinecap="round" />
          <path d={`M ${CUP_X} 60 L ${CUP_X + 14} 63.5 L ${CUP_X} 67 Z`} fill="#F07522" />
        </g>

        {/* golfer */}
        <g>
          {/* legs */}
          <line x1="25.5" y1="82" x2="22.5" y2="93" stroke="#1b2a3a" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="25.5" y1="82" x2="29" y2="93" stroke="#22344a" strokeWidth="2.6" strokeLinecap="round" />
          {/* torso */}
          <rect x="22" y="68" width="7.5" height="15" rx="3.2" fill="#115E9F" />
          {/* head */}
          <circle cx="25.8" cy="63.8" r="4" fill="#f1c9a5" />
          {/* cap */}
          <path d="M21.7 63 A4.1 4.1 0 0 1 29.9 63 Z" fill="#F07522" />
          <path d="M29 62.8 L34.5 64.4 L29 64.6 Z" fill="#d35e16" />
          {/* swinging arm + club (pivots at the shoulder) */}
          <g transform={`rotate(${clubAngle} ${SHOULDER.x} ${SHOULDER.y})`}>
            <line x1={SHOULDER.x} y1={SHOULDER.y} x2="41" y2="89" stroke="#e7e7e7" strokeWidth="1.4" strokeLinecap="round" />
            <ellipse cx="41.4" cy="89" rx="2.1" ry="1.4" fill="#cfd3d8" />
          </g>
        </g>

        {/* aim trajectory hint while charging */}
        {phase === "charging" && (
          <path
            d={`M ${BALL_X0} ${PLAY_Y} Q ${(BALL_X0 + CUP_X) / 2} ${PLAY_Y - 44} ${CUP_X} ${PLAY_Y}`}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="0.9"
            strokeDasharray="2 2.5"
          />
        )}

        {/* ball */}
        {ball.r > 0 && (
          <>
            <ellipse cx={ball.x} cy={ball.y + ball.r * 0.9} rx={ball.r * 0.95} ry={ball.r * 0.4} fill="rgba(0,0,0,0.22)" />
            <circle cx={ball.x} cy={ball.y} r={ball.r} fill="url(#ballg)" />
          </>
        )}
      </svg>

      {/* power meter */}
      <div className="power-meter" aria-hidden="true">
        <div className="power-fill" style={{ width: `${power}%` }} />
      </div>

      {(phase === "idle" || phase === "charging") && (
        <p className="golf-hint">{game.hint}</p>
      )}

      {banner && (
        <div className={`golf-banner ${banner.kind}`} role="status">
          {banner.text}
        </div>
      )}

      {phase === "missed" && (
        <button className="btn-primary" onClick={retry}>
          {game.retryCta}
        </button>
      )}
    </div>
  );
}
