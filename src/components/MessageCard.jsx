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
