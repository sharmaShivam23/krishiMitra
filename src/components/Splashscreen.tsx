'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Sun, CloudRain, Leaf, ArrowRight } from 'lucide-react';
import Logo from './common/Logo';
import {DEFAULT_LOCALE, SUPPORTED_LOCALES} from '@/i18n/locales';
import { useTranslations } from 'next-intl';

const SUPPORTED_LOCALE_SET = new Set(SUPPORTED_LOCALES);

const getPreferredLocale = () => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const pathLocale = window.location.pathname.split('/').filter(Boolean)[0];
  if (pathLocale && SUPPORTED_LOCALE_SET.has(pathLocale as (typeof SUPPORTED_LOCALES)[number])) return pathLocale;

  const storedLocale = localStorage.getItem('preferredLocale');
  if (storedLocale && SUPPORTED_LOCALE_SET.has(storedLocale as (typeof SUPPORTED_LOCALES)[number])) return storedLocale;

  return DEFAULT_LOCALE;
};

export default function SplashScreen() {
  const t = useTranslations('Splash');
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(t('initializing'));
  const [isFinished, setIsFinished] = useState(false);
  
  // 🛠️ FIX: Track if the component has mounted on the client
  const [isMounted, setIsMounted] = useState(false);

  // Professional agricultural app loading sequence
  const loadingSteps = [
    { threshold: 0, text: t('steps.starting') },
    { threshold: 25, text: t('steps.connectingMarkets') },
    { threshold: 50, text: t('steps.syncingWeather') },
    { threshold: 75, text: t('steps.preparingInsights') },
    { threshold: 90, text: t('steps.securing') },
    { threshold: 100, text: t('steps.welcome') }
  ];

  useEffect(() => {
    // 🛠️ FIX: Tell React the component is safely in the browser now
    setIsMounted(true);

    // Simulate loading progress
    const duration = 3800; // 3.8 seconds total loading time
    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setIsFinished(true);
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

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-emerald-950 font-sans selection:bg-emerald-500/30">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0">
        {/* Cinematic dark background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.15] mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop')" }}
        />
        
        {/* Light Leaks / Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        
        {/* Premium Logo Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8 flex justify-center"
        >
          {/* Subtle Outer Glow */}
          <div className="absolute inset-0 rounded-[2rem] bg-emerald-500/20 blur-xl animate-pulse"></div>

          {/* Clean Glassmorphism Logo Element */}
          <div className="relative w-28 h-28 bg-white/5 border border-white/10 backdrop-blur-md rounded-[2rem] shadow-xl flex items-center justify-center overflow-hidden">
             {/* Dynamic inner highlight */}
             <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/10 to-transparent"></div>
             <motion.div 
               animate={{ y: [0, -3, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="relative z-10"
             >
               <img src="/favicon.ico" alt="KrishiMitra Start Logo" className="w-16 h-16 object-contain drop-shadow-md" />
             </motion.div>
          </div>
        </motion.div>

        {/* Brand Name Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2">
            Krishi<span className="text-emerald-400">Mitra</span>
          </h1>
          <p className="text-emerald-100/70 font-medium text-sm tracking-widest uppercase">
            {t('tagline')}
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
          onClick={() => {
            const locale = getPreferredLocale();
            window.location.href = `/${locale}/login`;
          }}
          className="group flex items-center space-x-2 text-emerald-500/60 hover:text-emerald-400 transition-colors text-sm font-semibold"
        >
          <span>{t('skip')}</span>
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