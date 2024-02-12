import { motion } from 'framer-motion';

const TunnelTransition = ({ children, isVisible, onExit = () => {} }) => {
  // Enhanced animation variants for a trippy tunnel effect
  const variants = {
    initial: { 
      scale: 0.95, // Start slightly zoomed out to give a starting point for the zoom
      rotate: 0, // Start without rotation
      opacity: 0, // Start fully transparent
      filter: 'blur(0px)' // Start without blur
    },
    animate: { 
      scale: [1, 1.2, 1], // Zoom in slightly and then back to normal for a "through" effect
      rotate: [0, 360, 0], // Rotate a full 360 degrees for a spin effect
      opacity: 1, // Fade in to full visibility
      filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'], // Add a subtle blur effect during transition
      transition: { 
        duration: 1.5, // Duration of the entire animation sequence
        ease: 'easeInOut' // Use an ease-in-out for a smoother transition
      } 
    },
    exit: { 
      scale: 0.9, // Zoom out slightly to give an exit effect
      rotate: -360, // Rotate in the opposite direction for exit
      opacity: 0, // Fade out to fully transparent
      filter: 'blur(2px)', // Add a blur effect on exit
      transition: { 
        duration: 1.5, // Match the duration of the entrance for consistency
        ease: 'easeInOut' // Use an ease-in-out for smoothness
      } 
    }
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
