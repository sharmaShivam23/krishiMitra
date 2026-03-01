'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Sun, CloudRain, Leaf, ArrowRight } from 'lucide-react';
import Logo from './common/Logo';

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Systems...');
  const [isFinished, setIsFinished] = useState(false);
  
  // 🛠️ FIX: Track if the component has mounted on the client
  const [isMounted, setIsMounted] = useState(false);

  // Agricultural loading sequence messages
  const loadingSteps = [
    { threshold: 0, text: 'Initializing KrishiMitra Engine...' },
    { threshold: 25, text: 'Connecting to APMC Mandi Grids...' },
    { threshold: 50, text: 'Syncing Meteorological Data...' },
    { threshold: 75, text: 'Calibrating AI Yield Predictors...' },
    { threshold: 90, text: 'Securing Farmer Network...' },
    { threshold: 100, text: 'System Online. Welcome.' }
  ];

  useEffect(() => {
    // 🛠️ FIX: Tell React the component is safely in the browser now
    setIsMounted(true);

    // Simulate loading progress
    const duration = 4000; // 4 seconds total loading time
    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setIsFinished(true);
          // Redirect after a brief pause when reaching 100%
          setTimeout(() => {
            window.location.href = '/login';
          }, 800);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Update text based on progress
  useEffect(() => {
    const currentStep = [...loadingSteps].reverse().find(step => progress >= step.threshold);
    if (currentStep && currentStep.text !== loadingText) {
      setLoadingText(currentStep.text);
    }
  }, [progress, loadingText]);

  // Floating particles configuration
  const particles = Array.from({ length: 15 });

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-emerald-950 font-sans selection:bg-emerald-500/30">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0">
        {/* Cinematic dark background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop')" }}
        />
        
        {/* Light Leaks / Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* 🛠️ FIX: Only render random particles IF isMounted is true */}
        {isMounted && particles.map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              y: '100vh', 
              x: `${Math.random() * 100}vw`,
              opacity: Math.random() * 0.5 + 0.2,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: '-10vh',
              x: `${Math.random() * 100}vw`,
              rotate: 360
            }}
            transition={{ 
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
            className="absolute z-0 w-2 h-2 bg-emerald-300 rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        
        {/* Animated Logo Container with 3D Perspective */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
          style={{ perspective: '1000px' }} // Added 3D perspective to parent
        >
          {/* Glowing ring behind logo */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border border-emerald-500/30 border-t-emerald-400 opacity-50"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 rounded-full border border-dashed border-teal-500/20 opacity-30"
          />

          {/* 3D Glassmorphism Logo Element */}
          <motion.div 
            animate={{ 
              rotateX: [0, 10, 0, -10, 0],
              rotateY: [0, -15, 0, 15, 0],
              y: [0, -5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative w-28 h-28 border-b border-r border-black/20 rounded-[2rem] shadow-[0_20px_40px_rgba(4,47,46,0.8),inset_0_4px_10px_rgba(255,255,255,0.4),inset_0_-4px_10px_rgba(16,185,129,0.2)] flex items-center justify-center group"
            style={{ transformStyle: 'preserve-3d' }} 
          >
            <div className="absolute inset-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem] -z-10"></div>
            
            {/* The icon popping out in the Z-axis */}
            <motion.div 
              style={{ transform: 'translateZ(40px)' }} 
              className="flex items-center justify-center"
            >
              <Logo/>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Brand Name Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2">
            Krishi<span className="text-emerald-400">Mitra</span>
          </h1>
          <p className="text-emerald-100/70 font-medium text-sm tracking-widest uppercase">
            Empowering the Modern Farmer
          </p>
        </motion.div>

        {/* Loading Interface */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="w-full space-y-4"
        >
          {/* Progress Bar Container */}
          <div className="w-full h-1.5 bg-emerald-900/50 rounded-full overflow-hidden backdrop-blur-sm border border-emerald-800/50 shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 relative"
              style={{ width: `${progress}%` }}
              layout
            >
              <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-sm translate-x-1/2"></div>
            </motion.div>
          </div>

          {/* Dynamic Loading Text & Percentage */}
          <div className="flex justify-between items-center text-xs font-mono">
            <AnimatePresence mode="wait">
              <motion.span 
                key={loadingText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-emerald-300/80"
              >
                {loadingText}
              </motion.span>
            </AnimatePresence>
            <span className="text-emerald-400 font-bold">
              {Math.floor(progress)}%
            </span>
          </div>
        </motion.div>

      </div>

      {/* Footer / Skip Button (Optional UX) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 z-20"
      >
        <button 
          onClick={() => window.location.href = '/login'}
          className="group flex items-center space-x-2 text-emerald-500/60 hover:text-emerald-400 transition-colors text-sm font-semibold"
        >
          <span>Skip Initialization</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* Subtle Bottom Ambient Icons */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-emerald-950 to-transparent pointer-events-none flex items-end justify-center pb-4 opacity-20 space-x-12">
         <CloudRain className="w-8 h-8 text-white" />
         <Sun className="w-8 h-8 text-white" />
         <Leaf className="w-8 h-8 text-white" />
      </div>

    </div>
  );
}