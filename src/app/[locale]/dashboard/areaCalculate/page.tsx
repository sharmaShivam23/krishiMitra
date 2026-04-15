"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const FieldCalculator = dynamic(() => import('@/components/FieldCalculator'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl overflow-hidden border border-emerald-900/30 flex items-center justify-center bg-[#071a0d]"
         style={{ height: 'clamp(500px,72vh,800px)' }}>
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-center text-4xl">🛰️</div>
          <span className="absolute -inset-2 rounded-2xl border border-emerald-500/20 animate-ping pointer-events-none" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">Satellite Map Load Ho Raha Hai</p>
          <p className="text-emerald-400/50 text-sm mt-1">Field Surveyor shuru ho raha hai…</p>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay:`${i*0.15}s` }} />)}
        </div>
      </div>
    </div>
  ),
});

export default function AreaCalculatePage() {
  return (
    <div className="space-y-5">

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-[#071a0d] via-[#0d2116] to-[#071510] p-5 md:p-7 shadow-xl">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-8 -right-8 h-48 w-48 rounded-full bg-emerald-400/8 blur-3xl" />
          <div className="absolute bottom-0 left-20 h-28 w-28 rounded-full bg-green-300/5 blur-2xl" />
        </div>

        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          {/* Title */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-3xl shadow-lg shadow-emerald-900/30">
              🌾
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">KrishiMitra</span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Field Surveyor</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Khet Naapne Ka Auzaar</h1>
              <p className="mt-1 text-sm text-emerald-400/50 leading-relaxed">
                Satellite map · GPS Walk · Location Search · 22 State Units
              </p>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            {[
              { icon:'🔍', val:'Search', label:'Location'  },
              { icon:'📍', val:'1-Tap',  label:'Locate Me' },
              { icon:'🔢', val:'Auto',   label:'Numbered'  },
              { icon:'🇮🇳', val:'22+',   label:'States'    },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-center">
                <span className="text-xl leading-none">{s.icon}</span>
                <span className="mt-1 text-sm font-black text-white">{s.val}</span>
                <span className="text-[9px] text-gray-600">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mode explanation cards */}
        <div className="relative mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-800/40 bg-emerald-900/15 p-3.5">
            <span className="text-xl flex-shrink-0 mt-0.5">🔍</span>
            <div>
              <p className="text-sm font-black text-emerald-200">Location Search</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Gaon ya taluka ka naam type karein — map seedha wahan chala jaayega.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-emerald-800/40 bg-emerald-900/15 p-3.5">
            <span className="text-xl flex-shrink-0 mt-0.5">🗺️</span>
            <div>
              <p className="text-sm font-black text-emerald-200">Map se Banao</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Satellite map par apne khet ke numbered corners click karein. Lines khud ban jaayengi.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-blue-800/40 bg-blue-900/15 p-3.5">
            <span className="text-xl flex-shrink-0 mt-0.5">📍</span>
            <div>
              <p className="text-sm font-black text-blue-200">GPS Walk Mode</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Khet ke kinare chalte jao — GPS automatically trail track karega.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Calculator ───────────────────────────────────────────────────── */}
      <FieldCalculator />

      {/* ── Info cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon:'🌍', title:'Geodesic Calculation', desc:'Turf.js uses spherical Earth model — same precision as government land records and revenue surveys.' },
          { icon:'🇮🇳', title:'Sabhi Rajyon ke Naap', desc:'UP Bigha, Punjab Kanal, TN Cent, Gujarat Vigha, WB Bigha, MP Bigha aur 20+ aur rajya supported.' },
          { icon:'📡', title:'GPS Walk Feature', desc:'Khet ke kinare chalte chalte phone GPS se area auto-calculate ho jaata hai. Bilkul sahi naap.' },
        ].map(card => (
          <div key={card.title} className="flex gap-3 rounded-xl border border-emerald-900/20 bg-[#071a0d] p-4">
            <span className="text-2xl flex-shrink-0 mt-0.5">{card.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{card.title}</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}