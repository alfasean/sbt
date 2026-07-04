import { motion } from "framer-motion";
import content from "../data/content";

const { intro } = content;

export default function Intro({ onStart }) {
  return (
    <motion.section
      className="stage intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <span className="kicker">{intro.kicker}</span>
      <h1 className="display title">{intro.title}</h1>
      <p className="subtitle">{intro.subtitle}</p>
      <button className="btn-primary" onClick={onStart}>
        {intro.cta}
      </button>
    </motion.section>
  );
}
