// TunnelTransition.js or TunnelTransition.tsx if using TypeScript
import { motion } from 'framer-motion';

const TunnelTransition = ({ children, isVisible, onExit }) => {
  // Animation variants
  const variants = {
    initial: { scale: 1, opacity: 1 },
    animate: { scale: 0, opacity: 0, transition: { duration: 1.5 } },
    exit: { scale: 1, opacity: 1, transition: { duration: 1.5 } }
  };

  return (
    <motion.div
      initial="initial"
      animate={isVisible ? "animate" : "exit"}
      variants={variants}
      onAnimationComplete={() => !isVisible && onExit()}
    >
      {children}
    </motion.div>
  );
};

export default TunnelTransition;
