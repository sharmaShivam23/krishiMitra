'use client';

import React from 'react';
import { ShieldCheck, MapPin, IndianRupee } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TrustSection() {
  // 1. Initialize translation hook
  const t = useTranslations('TrustSection');

  return (
    <div className="max-w-7xl mx-auto px-6 pb-32">
      <div className="relative rounded-[3rem] overflow-hidden bg-[#06241b] shadow-2xl border border-emerald-900/50">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#06241b] via-[#06241b]/90 to-transparent"></div>

        <div className="relative z-10 p-12 lg:p-24 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
              {/* 🛠️ FIX: Split the heading to keep the amber styling on the middle word */}
              {t('heading1')} <span className="text-amber-400">{t('heading2')}</span>{t('heading3')}
            </h2>
            <p className="text-stone-300 font-medium text-lg mb-8">
              {/* 🛠️ FIX: Dynamic description */}
              {t('description')}
            </p>
            <ul className="space-y-4 mb-8">
              {/* 🛠️ FIX: Mapped the array directly to the translation keys */}
              {[
                t('list1'), 
                t('list2'), 
                t('list3')
              ].map((item, i) => (
                 <li key={i} className="flex items-center text-emerald-100 font-medium">
                   <div className="p-1.5 rounded-full bg-emerald-500/20 mr-4 border border-emerald-500/30">
                     <ShieldCheck className="w-4 h-4 text-emerald-400" />
                   </div>
                   {item}
                 </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
             
             <div className="flex items-center justify-between mb-8 pb-8 border-b border-emerald-800/50">
               <div>
                 {/* 🛠️ FIX: Dynamic Stat 1 */}
                 <p className="text-amber-400 text-sm font-bold uppercase tracking-wider mb-1">{t('stat1Label')}</p>
                 <p className="text-3xl font-black text-white">{t('stat1Value')}</p>
               </div>
               <IndianRupee className="w-12 h-12 text-emerald-500 opacity-50" />
             </div>
             
             <div className="flex items-center justify-between">
               <div>
                 {/* 🛠️ FIX: Dynamic Stat 2 */}
                 <p className="text-amber-400 text-sm font-bold uppercase tracking-wider mb-1">{t('stat2Label')}</p>
                 <p className="text-2xl font-black text-white">{t('stat2Value')}</p>
               </div>
               <MapPin className="w-10 h-10 text-emerald-500 opacity-50" />
             </div>
             
          </div>
        </div>
      </div>
    </div>
  );
}