'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useInView, animate, Variants } from 'framer-motion';
import { features } from '@/app/Data/Tools';
import { useTranslations } from 'next-intl';
import { ShieldCheck, MapPin, IndianRupee, Sprout, Users, TrendingUp, Award } from 'lucide-react';

/* ── Animated counter (same pattern as Hero) ───────────── */
function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const ctrl = animate(0, to, {
      duration: 2.2,
      ease: 'easeOut',
      onUpdate(v) {
        if (ref.current) ref.current.textContent = prefix + Math.floor(v).toLocaleString('en-IN') + suffix;
      }
    });
    return () => ctrl.stop();
  }, [inView, to, suffix, prefix]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/* ── Season strip ───────────────────────────────────────── */
const SEASONS = [
  { name: 'Kharif',    months: 'Jun – Oct', emoji: '🌧️', color: 'from-blue-500/20 to-cyan-500/20',   border: 'border-blue-400/30',   text: 'text-blue-300' },
  { name: 'Rabi',      months: 'Nov – Mar', emoji: '❄️', color: 'from-indigo-500/20 to-violet-500/20', border: 'border-indigo-400/30', text: 'text-indigo-300' },
  { name: 'Zaid',      months: 'Mar – Jun', emoji: '☀️', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-400/30',  text: 'text-amber-300' },
  { name: 'Perennial', months: 'Year-round',emoji: '🌿', color: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-400/30', text: 'text-emerald-300' },
];

const currentSeason = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 10) return 'Kharif';
  if (m >= 11 || m <= 3) return 'Rabi';
  if (m >= 3 && m <= 6) return 'Zaid';
  return 'Perennial';
};

/* ── Trust stats ────────────────────────────────────────── */
const TRUST_STATS = [
  { icon: Users, value: 12000, suffix: '+', label: 'Farmers Empowered', color: 'text-emerald-400' },
  { icon: MapPin, value: 7000, suffix: '+', label: 'Mandis Tracked', color: 'text-amber-400' },
  { icon: IndianRupee, value: 28, suffix: ' States', label: 'Pan-India Coverage', color: 'text-blue-400' },
  { icon: Award, value: 99, suffix: '%', label: 'Satisfaction Rate', color: 'text-violet-400' },
];

/* ── Testimonials ───────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Ramesh Kumar', loc: 'Haryana', quote: 'Mandi prices directly on my phone — no more middlemen cheating us!', avatar: '👨‍🌾' },
  { name: 'Priya Devi', loc: 'Punjab', quote: 'Disease detection saved my entire wheat crop this season.', avatar: '👩‍🌾' },
  { name: 'Sukhbir Singh', loc: 'MP', quote: 'AI advisor told me the right time to sell. Made extra ₹18,000 this year.', avatar: '🧑‍🌾' },
];

export default function TrustSection() {
  const t = useTranslations('TrustSection');
  const season = currentSeason();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } }
  };

  return (
    <section className="bg-stone-50 relative overflow-hidden">

      {/* ── Season context strip ── */}
      <div className="bg-[#06241b] border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center gap-3">
          <span className="text-emerald-400 text-xs font-black uppercase tracking-widest shrink-0">Current Season:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {SEASONS.map(s => (
              <span
                key={s.name}
                className={`px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${s.color} ${s.border} ${s.text} transition-all ${s.name === season ? 'ring-2 ring-offset-1 ring-offset-[#06241b] ring-emerald-400 scale-105' : 'opacity-60'}`}
              >
                {s.emoji} {s.name} <span className="opacity-60 font-medium">{s.months}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Animated stats band ── */}
      <div className="bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {TRUST_STATS.map((s, i) => (
              <motion.div key={i} variants={itemVariants} className="text-center">
                <div className={`text-3xl md:text-4xl font-black ${s.color} mb-1`}>
                  <CountUp to={s.value} suffix={s.suffix} />
                </div>
                <div className="text-stone-500 text-sm font-semibold">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── CTA banner with field image ── */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="relative rounded-[3rem] overflow-hidden bg-[#06241b] shadow-2xl border border-emerald-900/50">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06241b] via-[#06241b]/90 to-[#06241b]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06241b]/80 to-transparent" />

          <div className="relative z-10 p-10 lg:p-20 flex flex-col lg:flex-row items-start justify-between gap-12">
            {/* Left */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 mb-6">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Trusted Across Bharat</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
                {t('heading1')} <span className="text-amber-400">{t('heading2')}</span>{t('heading3')}
              </h2>
              <p className="text-stone-300 font-medium text-lg mb-8">
                {t('description')}
              </p>
              <ul className="space-y-4 mb-8">
                {[t('list1'), t('list2'), t('list3')].map((item, i) => (
                  <li key={i} className="flex items-center text-emerald-100 font-medium">
                    <div className="p-1.5 rounded-full bg-emerald-500/20 mr-4 border border-emerald-500/30">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Trusted by strip */}
              <div className="flex flex-wrap gap-3">
                {['🏛️ Min. of Agriculture', '🏦 NABARD', '📊 NCDEX', '🌾 APMC'].map(label => (
                  <span key={label} className="px-3 py-1.5 rounded-xl bg-white/8 border border-white/12 text-stone-400 text-xs font-semibold">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — testimonials stack */}
            <div className="w-full max-w-sm space-y-4">
              {/* Stat card */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-emerald-800/50">
                  <div>
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">{t('stat1Label')}</p>
                    <p className="text-3xl font-black text-white">{t('stat1Value')}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-emerald-500 opacity-40" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">{t('stat2Label')}</p>
                    <p className="text-2xl font-black text-white">{t('stat2Value')}</p>
                  </div>
                  <MapPin className="w-10 h-10 text-emerald-500 opacity-40" />
                </div>
              </div>

              {/* Testimonials */}
              {TESTIMONIALS.map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.3 }}
                  className="bg-white/8 backdrop-blur-sm border border-white/10 p-4 rounded-2xl"
                >
                  <p className="text-stone-300 text-sm font-medium leading-relaxed mb-3">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{testimonial.avatar}</span>
                    <div>
                      <div className="text-white text-xs font-black">{testimonial.name}</div>
                      <div className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {testimonial.loc}
                      </div>
                    </div>
                    <div className="ml-auto flex">
                      {[...Array(5)].map((_, si) => (
                        <span key={si} className="text-amber-400 text-[10px]">★</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}