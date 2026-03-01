'use client';

import React from 'react';
import { ShieldCheck, Tractor, MapPin } from 'lucide-react';

export default function TrustSection() {
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
              Join <span className="text-amber-400">50,000+</span> farmers upgrading their agriculture.
            </h2>
            <p className="text-stone-300 font-medium text-lg mb-8">
              Whether you manage 2 acres or 2,000, KrishiMitra scales to provide the satellite imagery, soil sensors, and market analytics you need.
            </p>
            <ul className="space-y-4 mb-8">
              {['Real-time weather alerts via SMS', 'APMC Mandi price comparison', 'Subsidized equipment marketplace'].map((item, i) => (
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
                 <p className="text-amber-400 text-sm font-bold uppercase tracking-wider mb-1">Average Yield Inc.</p>
                 <p className="text-4xl font-black text-white">+24.5%</p>
               </div>
               <Tractor className="w-12 h-12 text-emerald-500 opacity-50" />
             </div>
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-amber-400 text-sm font-bold uppercase tracking-wider mb-1">Active Regions</p>
                 <p className="text-2xl font-black text-white">12 States</p>
               </div>
               <MapPin className="w-10 h-10 text-emerald-500 opacity-50" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}