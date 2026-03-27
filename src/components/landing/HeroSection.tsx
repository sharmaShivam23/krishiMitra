'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ChevronRight, Leaf } from 'lucide-react';
import ThreeBackground from './ThreeBackground';
import { useTranslations, useLocale } from 'next-intl';

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  
  const t = useTranslations('Hero');
  const locale = useLocale();

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } }
  };

  return (
    <main className="relative min-h-[90vh]  flex items-center pt-20 pb-32 overflow-hidden bg-[#06241b]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#06241b] via-[#06241b]/60 to-[#06241b] z-0"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <ThreeBackground />

      <div className="relative max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center z-10">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl w-full">
          <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md mt-6 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
            <span className="text-xs font-bold text-amber-50  tracking-wider uppercase">Nationwide Agriculture Grid Online</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8 text-white">
            {/* 🛠️ FIX: Replaced hardcoded text with dynamic translations */}
            {t('title1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-green-500 drop-shadow-sm">
              {t('title2')}
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-stone-300 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
            {/* 🛠️ FIX: Replaced the long hardcoded paragraph */}
            {t('subtitle')}
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4">
            <a href={`/${locale}/dashboard/mandi-prices/mandi-advisor`} className="flex items-center justify-center px-8 py-4 bg-amber-400 text-stone-950 rounded-2xl font-black text-lg hover:bg-amber-300 transition-all shadow-[0_0_40px_-10px_rgba(251,191,36,0.6)] group">
              {/* 🛠️ FIX: Replaced button text */}
              {t('btnAdvisor')}
              <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href={`/${locale}/register`} className="flex items-center justify-center px-8 py-4 bg-white/5 border border-white/10 text-white backdrop-blur-sm rounded-2xl font-bold text-lg hover:bg-white/10 transition-all group">
              <Leaf className="w-5 h-5 mr-2 text-emerald-400" />
              {/* 🛠️ FIX: Replaced button text */}
              {t('btnProfile')}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

