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
