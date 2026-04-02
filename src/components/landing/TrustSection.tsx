'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ShieldCheck, MapPin, Sprout, TrendingUp } from 'lucide-react';


/* ── Testimonials ───────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Ramesh Kumar', loc: 'Haryana', quote: 'Mandi prices directly on my phone — no more middlemen cheating us!', avatar: '👨‍🌾' },
  { name: 'Priya Devi', loc: 'Punjab', quote: 'Disease detection saved my entire wheat crop this season.', avatar: '👩‍🌾' },
  { name: 'Sukhbir Singh', loc: 'MP', quote: 'AI advisor told me the right time to sell. Made extra ₹18,000 this year.', avatar: '🧑‍🌾' },
];

export default function TrustSection() {
  const t = useTranslations('TrustSection');

  return (
    <section className="bg-stone-50 relative overflow-hidden">

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