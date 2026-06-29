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
