import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedChartWrapperProps {
  show: boolean;
  children: ReactNode;
  id: string;
}

export function AnimatedChartWrapper({ show, children, id }: AnimatedChartWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key={id}
          initial={{ 
            opacity: 0, 
            y: 20,
            scale: 0.95,
            height: 0 
          }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: 1,
            height: 'auto',
            transition: {
              duration: 0.4,
              ease: [0.4, 0.0, 0.2, 1],
              height: { duration: 0.3 },
              opacity: { duration: 0.3, delay: 0.1 }
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -10,
            scale: 0.98,
            height: 0,
            transition: {
              duration: 0.25,
              ease: [0.4, 0.0, 1, 1],
              height: { duration: 0.2, delay: 0.05 }
            }
          }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
