'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { features } from '@/app/Data/Tools';
import { useTranslations } from 'next-intl';
import { Sprout } from 'lucide-react';

const SEASONS = [
  { name: 'Kharif', months: 'Jun – Oct', emoji: '🌧️', crops: 'Rice, Cotton, Maize' },
  { name: 'Rabi',   months: 'Nov – Mar', emoji: '❄️', crops: 'Wheat, Mustard, Peas' },
  { name: 'Zaid',   months: 'Mar – Jun', emoji: '☀️', crops: 'Watermelon, Muskmelon' },
  { name: 'Perennial', months: 'Year-round', emoji: '🌿', crops: 'Sugarcane, Banana, Tea' },
];

const activeSeason = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 10) return 'Kharif';
  if (m >= 11 || m <= 3) return 'Rabi';
  if (m >= 3 && m <= 6) return 'Zaid';
  return 'Perennial';
};

export default function Features() {
  const t = useTranslations('Features');
  const current = activeSeason();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } }
  };

  return (
    <section className="bg-stone-50 relative overflow-hidden">

      {/* ── Decorative background crops ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute -top-20 -left-20 text-[200px] opacity-[0.03] rotate-[-15deg]">🌾</div>
        <div className="absolute top-1/2 -right-20 text-[180px] opacity-[0.03] rotate-[15deg]">🌽</div>
        <div className="absolute bottom-0 left-1/3 text-[150px] opacity-[0.03]">🌱</div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 relative z-20">

        {/* ── Section heading ── */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 mb-5"
          >
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-xs font-black uppercase tracking-widest">AI-Powered Farm Tools</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-stone-900 mb-4"
          >
            {t('heading')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-stone-600 font-medium max-w-2xl mx-auto text-lg"
          >
            {t('subheading')}
          </motion.p>
        </div>

        {/* ── Crop Season Strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12"
        >
          {SEASONS.map(s => {
            const isActive = s.name === current;
            return (
              <div
                key={s.name}
                className={`relative rounded-2xl p-4 border transition-all ${
                  isActive
                    ? 'bg-emerald-900 border-emerald-700 shadow-lg shadow-emerald-900/40'
                    : 'bg-white border-stone-200 opacity-70'
                }`}
              >
                {isActive && (
                  <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-800 px-2 py-0.5 rounded-full">
                    NOW
                  </span>
                )}
                <div className="text-2xl mb-2">{s.emoji}</div>
                <div className={`text-sm font-black ${isActive ? 'text-white' : 'text-stone-800'}`}>{s.name}</div>
                <div className={`text-[10px] font-semibold mb-1 ${isActive ? 'text-emerald-400' : 'text-stone-500'}`}>{s.months}</div>
                <div className={`text-[10px] leading-tight ${isActive ? 'text-emerald-200/70' : 'text-stone-400'}`}>{s.crops}</div>
              </div>
            );
          })}
        </motion.div>

        {/* ── Feature bento grid ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[300px]"
        >
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className={`relative overflow-hidden rounded-3xl group cursor-pointer shadow-lg shadow-stone-200/60 hover:shadow-2xl hover:shadow-emerald-900/20 transition-all duration-500 ${feat.span}`}
            >
              {/* Background image with zoom on hover */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                style={{ backgroundImage: `url(${feat.img.src})` }}
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#06241b] via-[#06241b]/55 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500" />

              {/* Subtle green glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl shadow-[inset_0_0_60px_rgba(16,185,129,0.15)]" />

              {/* Content */}
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-amber-300 mb-4 group-hover:-translate-y-2 transition-transform duration-300 shadow-xl">
                  {feat.icon}
                </div>
                <h3 className="text-2xl font-black mb-2 text-white drop-shadow-md group-hover:-translate-y-1 transition-transform duration-300 delay-75">
                  {t(`items.${feat.id}.title`)}
                </h3>
                <p className="text-sm text-stone-200 font-medium leading-relaxed drop-shadow-sm group-hover:-translate-y-1 transition-transform duration-300 delay-100 line-clamp-2 md:line-clamp-3">
                  {t(`items.${feat.id}.desc`)}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}