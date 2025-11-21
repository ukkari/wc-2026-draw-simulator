import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team } from '../types';
import { MOCK_FLAGS } from '../constants';

interface DrawStageProps {
  currentTeam: Team | null;
  isAnimating: boolean;
  onAnimationComplete: () => void;
  potNumber: number;
}

const DrawStage: React.FC<DrawStageProps> = ({ currentTeam, isAnimating, onAnimationComplete, potNumber }) => {
  // Internal stage to handle the ball opening sequence
  const [stage, setStage] = useState<'ball' | 'reveal' | 'finished'>('ball');

  useEffect(() => {
    if (isAnimating && currentTeam) {
      setStage('ball');
      const timer1 = setTimeout(() => setStage('reveal'), 600); // Ball shakes then opens
      const timer2 = setTimeout(() => {
         setStage('finished');
         onAnimationComplete();
      }, 2500); // Show team for 2 seconds then fly away

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isAnimating, currentTeam, onAnimationComplete]);

  if (!isAnimating && !currentTeam) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 italic">
        Ready to draw Pot {potNumber}...
      </div>
    );
  }

  return (
    <div className="h-64 w-full relative flex items-center justify-center overflow-hidden bg-slate-900/50 rounded-xl border border-slate-700/50 shadow-inner">
      <AnimatePresence mode="wait">
        {stage === 'ball' && (
          <motion.div
            key="ball"
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              rotate: 0,
              transition: { type: "spring", duration: 0.8 }
            }}
            exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
            className="relative z-10 cursor-pointer"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-blue-600 shadow-[0_0_30px_rgba(45,212,191,0.5)] flex items-center justify-center border-4 border-white">
              <span className="text-4xl font-bold text-white drop-shadow-md">26</span>
            </div>
          </motion.div>
        )}

        {stage === 'reveal' && currentTeam && (
          <motion.div
            key="reveal"
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ 
              scale: 1.2, 
              opacity: 1, 
              y: 0,
              transition: { type: "spring", bounce: 0.5 }
            }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            className="flex flex-col items-center z-20"
          >
            <div className="text-6xl mb-4 animate-bounce">
              {MOCK_FLAGS[currentTeam.name] || '⚽️'}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-white uppercase tracking-wider text-center drop-shadow-sm">
              {currentTeam.name}
            </h2>
            <div className="mt-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm border border-teal-500/30">
              Pot {currentTeam.pot}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background Effects */}
      {isAnimating && (
         <motion.div 
           className="absolute inset-0 bg-gradient-to-t from-teal-500/10 to-transparent"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
         />
      )}
    </div>
  );
};

export default DrawStage;