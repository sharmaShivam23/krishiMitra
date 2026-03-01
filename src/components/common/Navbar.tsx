'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sprout, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

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
        <div className="flex items-center  space-x-3 group cursor-pointer">
          {/* <div className="p-2.5   rounded-xl shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform"> */}
             {/* <Sprout className="w-6 h-6 text-amber-50" /> */}
             <img src="/favicon.ico" className='bg-cover w-16 h-16' alt="" />
          {/* </div> */}
          <span className={`text-2xl font-black tracking-tight transition-colors ${scrolled ? 'text-stone-900' : 'text-white'}`}>
            Krishi<span className="text-emerald-500">Mitra</span>
          </span>
        </div>
        <div className="flex space-x-4 md:space-x-8 items-center">
          <a href="/login" className={`text-sm font-bold transition-colors hidden sm:block ${scrolled ? 'text-stone-600 hover:text-emerald-700' : 'text-stone-100 hover:text-emerald-300'}`}>
            Farmer Login
          </a>
          <a href="/register" className="px-6 py-2.5 bg-emerald-700 hidden sm:flex text-amber-50 text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/30 active:scale-95 flex items-center border border-emerald-500/50">
            Join Network <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </div>
      </div>
    </motion.nav>
  );
}