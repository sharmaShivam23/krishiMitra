'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

export default function AiAdvisorButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center justify-end">
      
      {/* Decorative background ping/pulse */}
      <div className="absolute w-14 h-14 bg-emerald-500 rounded-full animate-ping opacity-20 pointer-events-none"></div>
      
      <a 
        href="/mandi-advisor"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center justify-center p-0.5 rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.7)] transition-all duration-300"
      >
        {/* Animated gradient border wrapper */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-300 to-teal-400 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>

        {/* Main Button Inner Container */}
        <motion.div 
          layout
          className="relative flex items-center bg-slate-950 rounded-full px-4 py-4 overflow-hidden"
          initial={{ borderRadius: 50 }}
        >
          {/* Animated background rays/grid inside the button */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#10b981_1px,transparent_1px)] [background-size:8px_8px] mix-blend-screen group-hover:scale-110 transition-transform duration-500"></div>

          {/* Icon */}
          <motion.div 
            layout 
            className="relative z-10 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 transition-colors"
          >
            <Bot className="w-7 h-7" />
            
            {/* Tiny sparkle that appears on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0, rotate: 45 }}
                  className="absolute -top-1 -right-2 text-yellow-300"
                >
                  <Sparkles className="w-3 h-3" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Expanding Text */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                layout
                initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                animate={{ width: 'auto', opacity: 1, marginLeft: 12 }}
                exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="whitespace-nowrap overflow-hidden relative z-10"
              >
                <span className="font-bold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent block pr-2">
                  Launch AI Advisor
                </span>
                <span className="text-[10px] text-emerald-500/80 font-mono font-medium block uppercase tracking-widest mt-0.5">
                  System Online
                </span>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </a>

      {/* Persistent floating label when NOT hovered (Optional, draws attention) */}
      <AnimatePresence>
        {!isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
            className="absolute -top-10 right-0 bg-slate-900 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-900/50 shadow-lg whitespace-nowrap pointer-events-none"
          >
            Predict Prices
            <div className="absolute -bottom-1 right-6 w-2 h-2 bg-slate-900 border-b border-r border-emerald-900/50 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}