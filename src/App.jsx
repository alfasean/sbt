import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Intro from "./components/Intro";
import GolfGame from "./components/GolfGame";
import Reveal from "./components/Reveal";
import MusicButton from "./components/MusicButton";

// intro → game (shot 1 misses, shot 2 sinks) → reveal
export default function App() {
  const [stage, setStage] = useState("intro");

  return (
    <main className="app">
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <Intro key="intro" onStart={() => setStage("game")} />
        )}

        {stage === "game" && (
          <motion.div
            key="game"
            className="stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <GolfGame onComplete={() => setStage("reveal")} />
          </motion.div>
        )}

        {stage === "reveal" && <Reveal key="reveal" />}
      </AnimatePresence>

      {stage === "reveal" && <MusicButton autoStart />}
    </main>
  );
}
