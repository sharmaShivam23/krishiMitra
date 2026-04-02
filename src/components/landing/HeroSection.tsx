'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, Variants, animate } from 'framer-motion';
import { ChevronRight, Leaf, ArrowDown, Sprout, Star } from 'lucide-react';
import ThreeBackground from './ThreeBackground';
import { useTranslations, useLocale } from 'next-intl';

/* ── Animated counter ───────────────────────────────────── */
function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const ctrl = animate(0, to, {
      duration: 2,
      ease: 'easeOut',
      onUpdate(v) { if (ref.current) ref.current.textContent = prefix + Math.floor(v).toLocaleString('en-IN') + suffix; }
    });
    return () => ctrl.stop();
  }, [inView, to, suffix, prefix]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/* ── Floating crop badge ─────────────────────────────────── */
const CROPS = ['🌾 Wheat', '🌽 Corn', '🍚 Rice', '🧅 Onion', '🌿 Soybean', '🫘 Lentil', '🌱 Cotton', '🍬 Sugarcane'];

function FloatingBadge({ label, delay, x }: { label: string; delay: number; x: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: [0, 0.85, 0.85, 0], y: [60, -20, -60, -120] }}
      transition={{ duration: 5, delay, repeat: Infinity, repeatDelay: Math.random() * 4 + 2, ease: 'easeInOut' }}
      className="absolute bottom-16 pointer-events-none"
      style={{ left: x }}
    >
      <div className="px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 backdrop-blur-sm text-emerald-200 text-xs font-bold whitespace-nowrap shadow-lg shadow-emerald-900/30">
        {label}
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const t = useTranslations('Hero');
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } }
  };

  const stats = [
    { value: 1200000, suffix: '+', label: 'Farmers Empowered', prefix: '' },
    { value: 7000, suffix: '+', label: 'Mandis Tracked', prefix: '' },
    { value: 28, suffix: '', label: 'States Covered', prefix: '' },
  ];

  return (
    <main className="relative min-h-screen flex items-center pt-20 pb-32 overflow-hidden bg-[#06241b]">

      {/* ── Layered background ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        // style={{ backgroundImage: "url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=2070&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#06241b]/80 via-[#06241b]/60 to-[#06241b]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06241b]/70 via-transparent to-[#06241b]/70" />

      {/* Amber sun flare top-right */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-amber-400/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <ThreeBackground />

      {/* ── Floating crop badges ── */}
      {mounted && CROPS.map((crop, i) => (
        <FloatingBadge
          key={crop}
          label={crop}
          delay={i * 0.9}
          x={`${8 + (i * 12) % 85}%`}
        />
      ))}

      {/* ── Main content ── */}
      <div className="relative max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center z-10">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-5xl w-full">

          {/* Live badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 backdrop-blur-md mt-6 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <Star className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-bold text-amber-100 tracking-widest uppercase">Nationwide Agriculture Grid Online</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] mb-6 text-white drop-shadow-2xl">
            {t('title1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-amber-400">
              {t('title2')}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-stone-300/90 mb-10 leading-relaxed max-w-2xl mx-auto font-medium drop-shadow-md">
            {t('subtitle')}
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <a
              href={`/${locale}/dashboard/mandi-prices/mandi-advisor`}
              className="flex items-center justify-center px-9 py-4 bg-amber-400 text-stone-950 rounded-2xl font-black text-lg hover:bg-amber-300 transition-all shadow-[0_0_50px_-8px_rgba(251,191,36,0.7)] hover:shadow-[0_0_60px_-6px_rgba(251,191,36,0.9)] active:scale-95 group"
            >
              {t('btnAdvisor')}
              <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={`/${locale}/register`}
              className="flex items-center justify-center px-9 py-4 bg-white/8 border border-white/15 text-white backdrop-blur-sm rounded-2xl font-bold text-lg hover:bg-white/15 hover:border-white/25 transition-all group"
            >
              <Leaf className="w-5 h-5 mr-2 text-emerald-400 group-hover:scale-110 transition-transform" />
              {t('btnProfile')}
            </a>
          </motion.div>

        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-emerald-400/60 z-10"
      >
        <Sprout className="w-4 h-4" />
        <ArrowDown className="w-4 h-4" />
      </motion.div>
    </main>
  );
}
