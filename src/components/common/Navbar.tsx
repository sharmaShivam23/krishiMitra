'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sprout, ArrowRight } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  
  // 1. Initialize the translation hook for the "Navigation" section
  const t = useTranslations('Navigation');
  const locale = useLocale();
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-stone-50/90 backdrop-blur-xl border-b border-stone-200 shadow-sm py-4' : 'bg-transparent py-6'}`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <img src="/favicon.ico" className='bg-cover w-16 h-16' alt="KrishiMitra Logo" />
          <span className={`text-2xl font-black tracking-tight transition-colors ${scrolled ? 'text-stone-900' : 'text-white'}`}>
            Krishi<span className="text-emerald-500">Mitra</span>
          </span>
        </div>
        
        <div className="flex space-x-4 md:space-x-8 items-center">
          
          {/* 🛠️ FIX: Replaced hardcoded "Farmer Login" with dynamic translation */}
          <a href={`/${locale}/login`} className={`text-sm font-bold transition-colors hidden sm:block ${scrolled ? 'text-stone-600 hover:text-emerald-700' : 'text-stone-100 hover:text-emerald-300'}`}>
            {t('farmerLogin')}
          </a>
          
          {/* 🛠️ FIX: Replaced hardcoded "Join Network" with dynamic translation */}
          <a href={`/${locale}/register`} className="px-6 py-2.5 bg-emerald-700 hidden sm:flex text-amber-50 text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/30 active:scale-95 items-center border border-emerald-500/50">
            {t('joinNetwork')} <ArrowRight className="w-4 h-4 ml-2" />
          </a>
          
          <LanguageSwitcher />
        </div>
      </div>
    </motion.nav>
  );
}