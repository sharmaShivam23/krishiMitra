'use client';

import { motion, Variants } from 'framer-motion';
import { Sprout, CloudSun, LineChart, Users, ChevronRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const features = [
    { icon: <LineChart className="w-6 h-6" />, title: 'Yield Prediction AI', desc: 'Machine learning models analyze soil and weather to predict optimal harvest times.' },
    { icon: <CloudSun className="w-6 h-6" />, title: 'Micro-Climate Data', desc: 'Hyper-local weather telemetry integrated directly with your crop timeline.' },
    { icon: <ShieldCheck className="w-6 h-6" />, title: 'Automated Disease Detection', desc: 'Upload computer vision scans of foliage for instant pathogen identification.' },
    { icon: <Users className="w-6 h-6" />, title: 'Verified Agronomist Network', desc: 'Direct access to a vetted community of farming experts and real-time market data.' },
  ];

  // Properly typed for Framer Motion to remove TypeScript errors
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 10 } }
  };

  return (
    <div className="min-h-screen mt-10 bg-agri-50 font-sans selection:bg-agri-400 selection:text-agri-900">
      
      {/* Glassmorphism Navbar */}
      <nav className="fixed w-full top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl">
               <img src="/favicon.ico" className='w-16 h-16 bg-cover' alt="logo" />
            </div>
            <span className="text-2xl font-black tracking-tight text-agri-900">
              Krishi<span className="text-agri-600">Mitra</span>
            </span>
          </div>
          <div className="flex space-x-4 items-center">
            <Link href="/login" className="text-sm font-semibold text-agri-800 hover:text-agri-600 transition px-4">Log in</Link>
            <Link href="/register" className="px-5 py-2.5 bg-agri-900 text-white text-sm font-bold rounded-xl hover:bg-agri-800 transition shadow-lg shadow-agri-900/20">
              Deploy Platform
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - High Tech Dark Mode */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-agri-900 rounded-b-[3rem] lg:rounded-b-[5rem] mx-2 lg:mx-6 mt-2 shadow-2xl">
        {/* Abstract glowing background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-agri-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-agri-400 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>

        <div className="relative max-w-7xl mx-auto px-6 flex flex-col items-center text-center z-10">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl">
            <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-8">
              <span className="flex h-2 w-2 rounded-full bg-agri-400 animate-ping"></span>
              <span className="text-xs font-bold text-agri-100 tracking-wider uppercase">v2.0 Architecture Live</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 text-white">
              The OS for <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-agri-400 to-emerald-300">
                Modern Agriculture.
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-agri-100/80 mb-10 leading-relaxed max-w-2xl mx-auto font-light">
              Enterprise-grade crop intelligence, real-time APMC mandi telemetry, and predictive modeling built for the next generation of Indian farmers.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register" className="flex items-center justify-center px-8 py-4 bg-agri-400 text-agri-900 rounded-2xl font-bold text-lg hover:bg-white transition-all shadow-[0_0_40px_-10px_rgba(52,211,153,0.5)] group">
                Initialize Dashboard
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>
  {/* <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div> */}
      {/* Feature Grid - Clean SaaS Look */}
      <div className="max-w-7xl mx-auto px-6 py-24 -mt-10 relative z-20">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feat, idx) => (
            <motion.div key={idx} variants={itemVariants} 
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-agri-600/5 hover:-translate-y-2 transition-all duration-300 group cursor-default"
            >
              <div className="w-12 h-12 bg-agri-50 rounded-2xl flex items-center justify-center text-agri-600 mb-6 group-hover:bg-agri-600 group-hover:text-white transition-colors">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold mb-3 text-agri-900">{feat.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}


