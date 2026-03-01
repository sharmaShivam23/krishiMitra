'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { features } from '@/app/Data/Tools';

export default function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } }
  };


  return (
    <div className="max-w-7xl mx-auto px-6 py-24 relative z-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-stone-900 mb-6">Tools for maximum yield.</h2>
        <p className="text-stone-600 font-medium max-w-2xl mx-auto text-lg">Stop guessing. Start harvesting with data-backed confidence using our entire suite of advanced agronomic intelligence tools tailored for Indian agriculture.</p>
      </div>

      <motion.div 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[300px]"
      >
        {features.map((feat, idx) => (
          <motion.div key={idx} variants={itemVariants} 
            className={`relative overflow-hidden rounded-3xl group cursor-pointer shadow-lg shadow-stone-200/50 hover:shadow-2xl transition-all duration-500 ${feat.span}`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" 
              // style={{ backgroundImage: `url('${feat.img}')` }} 
              // style = {{ backgroundImage : feat.img}}
              // style={{ backgroundImage: `url(${feat.img})` }}
              style={{ backgroundImage: `url(${feat.img.src})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06241b] via-[#06241b]/60 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-80" />
            
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-amber-300 mb-4 transform group-hover:-translate-y-2 transition-transform duration-300 shadow-xl">
                {feat.icon}
              </div>
              <h3 className="text-2xl font-black mb-2 text-white drop-shadow-md transform group-hover:-translate-y-1 transition-transform duration-300 delay-75">{feat.title}</h3>
              <p className="text-sm text-stone-200 font-medium leading-relaxed drop-shadow-sm transform group-hover:-translate-y-1 transition-transform duration-300 delay-100 line-clamp-2 md:line-clamp-3">{feat.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}