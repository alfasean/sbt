import { motion } from "framer-motion";
import content from "../data/content";

const { reveal } = content;

export default function Reveal() {
  return (
    <motion.section
      className="stage reveal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.p
        className="reveal-teaser"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {reveal.teaser}
      </motion.p>

      <motion.h1
        className="display reveal-title"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.55, ease: "easeOut" }}
      >
        {reveal.title}
      </motion.h1>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.55, ease: "easeOut" }}
      >
        <img className="card-photo" src={content.photo} alt={content.name} />
        <p className="card-message">{content.message}</p>
      </motion.div>
    </motion.section>
  );
}
