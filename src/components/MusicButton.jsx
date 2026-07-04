import { useEffect, useRef, useState } from "react";
import content from "../data/content";

export default function MusicButton({ autoStart = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Try to start the song as soon as the button mounts (reveal moment).
  // This runs right after a user gesture (the winning putt), so most
  // browsers allow it; if blocked, the user can still tap to play.
  useEffect(() => {
    if (!autoStart) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [autoStart]);

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
