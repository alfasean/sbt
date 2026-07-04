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
