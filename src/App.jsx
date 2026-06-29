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
