// 'use client';

// import React from 'react';
// import { motion  , Variants} from 'framer-motion';
// import { 
//   Sprout, 
//   PhoneCall, 
//   Mail, 
//   Facebook, 
//   Twitter, 
//   Instagram, 
//   Youtube, 
//   ChevronRight,
//   Send,
//   MapPin
// } from 'lucide-react';
// import Logo from './Logo';

// export default function Footer() {
//   // Framer Motion variants for scroll-triggered staggered animations
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
//         delayChildren: 0.2,
//       }
//     }
//   };

//   const itemVariants : Variants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { 
//       opacity: 1, 
//       y: 0, 
//       transition: { type: 'spring', stiffness: 60, damping: 15 } 
//     }
//   };

//   return (
//     <footer className="bg-[#041a13] border-t border-emerald-900/40 pt-16 relative overflow-hidden z-20 font-sans">
      
//       {/* Abstract Agricultural Background Elements (Sunlight & Foliage vibe) */}
//       <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-700/10 rounded-full blur-[120px] pointer-events-none"></div>
//       <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

//       <div className="max-w-7xl mx-auto px-6 relative z-10">
        
//         {/* Top Section: SMS Alert Subscription (Farming specific) */}
//         <motion.div 
//           initial={{ opacity: 0, y: 30 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true, margin: "-50px" }}
//           transition={{ duration: 0.6 }}
//           className="bg-[#06241b] border border-emerald-900/60 rounded-3xl p-8 md:p-10 mb-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden"
//         >
//           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]"></div>
          
//           <div className="md:max-w-lg relative z-10">
//             <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
//               Get Daily Mandi Rates via <span className="text-amber-400">SMS.</span>
//             </h3>
//             <p className="text-emerald-100/70 font-medium">
//               Subscribe to your local district updates. Never miss the perfect price window for your harvest again.
//             </p>
//           </div>
          
//           <div className="w-full md:w-auto flex-1 max-w-md relative z-10">
//             <div className="relative group">
//               <input 
//                 type="tel" 
//                 placeholder="Enter your 10-digit mobile number" 
//                 className="w-full bg-[#03150f] border border-emerald-900/50 rounded-2xl py-4 pl-6 pr-32 text-emerald-50 placeholder:text-emerald-900/60 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
//               />
//               <button className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 font-bold flex items-center transition-colors shadow-lg shadow-emerald-900/20 active:scale-95">
//                 <span>Alert Me</span>
//                 <Send className="w-4 h-4 ml-2" />
//               </button>
//             </div>
//           </div>
//         </motion.div>

//         {/* Main Footer Links Grid */}
//         <motion.div 
//           variants={containerVariants}
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true, margin: "-50px" }}
//           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16"
//         >
          
//           {/* Column 1: Brand & Helpline (Spans 4 columns on large screens) */}
//           <motion.div variants={itemVariants} className="lg:col-span-4">
//             <div className="flex items-center space-x-3 mb-6">
//               <div className="p-2.5  rounded-xl shadow-lg shadow-emerald-900/20">
//                  {/* <Sprout className="w-6 h-6 text-amber-50" /> */}
//                  <Logo/>
//               </div>
//               <span className="text-3xl font-black tracking-tight text-white">
//                 Krishi<span className="text-emerald-500">Mitra</span>
//               </span>
//             </div>
//             <p className="text-stone-400 font-medium leading-relaxed mb-8 pr-4">
//               Empowering Indian agriculture with AI-driven crop intelligence, real-time market data, and precision farming tools.
//             </p>
            
//             {/* Kisan Helpline Badge */}
//             <div className="bg-[#06241b]/80 border border-emerald-800/30 rounded-2xl p-4 inline-flex items-center space-x-4 mb-8 shadow-inner hover:border-emerald-600/50 transition-colors cursor-pointer group">
//               <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
//                 <PhoneCall className="w-5 h-5" />
//               </div>
//               <div>
//                 <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">24/7 Kisan Helpline</p>
//                 <p className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">1800-180-1551</p>
//               </div>
//             </div>

//             {/* Social Links */}
//             <div className="flex space-x-3">
//               {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
//                 <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-400 transition-all shadow-sm hover:-translate-y-1">
//                   <Icon className="w-4 h-4" />
//                 </a>
//               ))}
//             </div>
//           </motion.div>

//           {/* Column 2: Platform Links */}
//           <motion.div variants={itemVariants} className="lg:col-span-2 lg:col-start-6">
//             <h4 className="text-white font-bold mb-6 tracking-wide text-lg">Platform</h4>
//             <ul className="space-y-3.5">
//               {['AI Crop Intelligence', 'Live Mandi Rates', 'Disease Vision AI', '7-Day Weather', 'Govt Schemes Match'].map((link, i) => (
//                 <li key={i}>
//                   <a href="#" className="text-stone-400 hover:text-amber-400 font-medium transition-colors flex items-center group">
//                     <ChevronRight className="w-3.5 h-3.5 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 text-amber-400 transition-all duration-300" />
//                     <span>{link}</span>
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </motion.div>

//           {/* Column 3: Resources Links */}
//           <motion.div variants={itemVariants} className="lg:col-span-2">
//             <h4 className="text-white font-bold mb-6 tracking-wide text-lg">Resources</h4>
//             <ul className="space-y-3.5">
//               {['Farmer Community', 'Agronomy Guides', 'Market Reports', 'Success Stories', 'Kisan Help Center'].map((link, i) => (
//                 <li key={i}>
//                   <a href="#" className="text-stone-400 hover:text-emerald-400 font-medium transition-colors flex items-center group">
//                     <ChevronRight className="w-3.5 h-3.5 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 text-emerald-400 transition-all duration-300" />
//                     <span>{link}</span>
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </motion.div>

//           {/* Column 4: Contact & Locations */}
//           <motion.div variants={itemVariants} className="lg:col-span-3">
//             <h4 className="text-white font-bold mb-6 tracking-wide text-lg">Connect</h4>
//             <ul className="space-y-4">
//               <li>
//                 <a href="mailto:support@krishimitra.in" className="flex items-start group">
//                   <Mail className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 group-hover:text-amber-400 transition-colors" />
//                   <div>
//                     <p className="text-white font-bold mb-0.5">Email Support</p>
//                     <p className="text-stone-400 text-sm font-medium group-hover:text-stone-300 transition-colors">support@krishimitra.in</p>
//                   </div>
//                 </a>
//               </li>
//               <li>
//                 <div className="flex items-start">
//                   <MapPin className="w-5 h-5 text-emerald-500 mr-3 mt-0.5" />
//                   <div>
//                     <p className="text-white font-bold mb-0.5">Headquarters</p>
//                     <p className="text-stone-400 text-sm font-medium leading-relaxed">
//                       AgriTech Hub, Sector 4<br />
//                       New Delhi, India 110001
//                     </p>
//                   </div>
//                 </div>
//               </li>
//             </ul>
//           </motion.div>

//         </motion.div>

//         {/* Bottom Copyright Bar */}
//         <motion.div 
//           initial={{ opacity: 0 }}
//           whileInView={{ opacity: 1 }}
//           viewport={{ once: true }}
//           transition={{ delay: 0.8, duration: 0.5 }}
//           className="py-6 border-t border-emerald-900/40 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left"
//         >
//           <p className="text-stone-500 text-sm font-medium">
//             &copy; {new Date().getFullYear()} KrishiMitra Technologies. All rights reserved.
//           </p>
//           <div className="flex items-center space-x-6">
//             <a href="#" className="text-stone-500 text-sm font-medium hover:text-emerald-400 transition-colors">Privacy Policy</a>
//             <a href="#" className="text-stone-500 text-sm font-medium hover:text-emerald-400 transition-colors">Terms of Service</a>
//             <div className="h-4 w-px bg-stone-700 hidden md:block"></div>
//             <span className="text-amber-500/90 text-sm font-bold tracking-wide">Made for Bharat 🇮🇳</span>
//           </div>
//         </motion.div>
//       </div>
//     </footer>
//   );
// }


'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  Sprout, 
  PhoneCall, 
  Mail, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  ChevronRight,
  Send,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  // --- SMS Subscription State ---
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | '', message: string }>({ type: '', message: '' });

  // --- Handlers ---
  const handleSubscribe = async () => {
    if (!phone || phone.length !== 10 || isNaN(Number(phone))) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit number.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/cron/send-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }) 
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Subscription failed.');
      }

      setStatus({ type: 'success', message: data.message });
      setPhone(''); // Clear input on success
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // --- Framer Motion Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 60, damping: 15 } 
    }
  };

  return (
    <footer className="bg-[#041a13] border-t border-emerald-900/40 pt-16 relative overflow-hidden z-20 font-sans">
      
      {/* Abstract Agricultural Background Elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-700/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Top Section: SMS Alert Subscription */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="bg-[#06241b] border border-emerald-900/60 rounded-3xl p-8 md:p-10 mb-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]"></div>
          
          <div className="md:max-w-lg relative z-10">
            <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
              Get Daily Mandi Rates via <span className="text-amber-400">SMS.</span>
            </h3>
            <p className="text-emerald-100/70 font-medium">
              Subscribe to your local district updates. Never miss the perfect price window for your harvest again.
            </p>
          </div>
          
          <div className="w-full md:w-auto flex-1 max-w-md relative z-10">
            
            {/* Status Messages */}
            {status.message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className={`mb-3 text-sm font-bold flex items-center ${status.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <AlertCircle className="w-4 h-4 mr-1.5" />}
                {status.message}
              </motion.div>
            )}

            <div className="relative group flex items-center">
              <span className="absolute left-4 text-emerald-900/60 font-bold">+91</span>
              <input 
                type="tel" 
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  // Ensure only numbers are typed
                  const val = e.target.value.replace(/\D/g, '');
                  setPhone(val);
                  if (status.message) setStatus({ type: '', message: '' }); // Clear error while typing
                }}
                disabled={loading || status.type === 'success'}
                placeholder="Enter 10-digit mobile number" 
                className="w-full bg-[#03150f] border border-emerald-900/50 rounded-2xl py-4 pl-12 pr-32 text-emerald-50 placeholder:text-emerald-900/60 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium disabled:opacity-60"
              />
              <button 
                onClick={handleSubscribe}
                disabled={loading || status.type === 'success' || phone.length !== 10}
                className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 font-bold flex items-center transition-colors shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : status.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <>
                    <span>Alert Me</span>
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-emerald-900/60 mt-2 font-medium text-right">Standard SMS rates may apply. Opt-out anytime.</p>
          </div>
        </motion.div>

        {/* Main Footer Links Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16"
        >
          
          {/* Column 1: Brand & Helpline */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 rounded-xl shadow-lg shadow-emerald-900/20">
                 <Logo/>
              </div>
              <span className="text-3xl font-black tracking-tight text-white">
                Krishi<span className="text-emerald-500">Mitra</span>
              </span>
            </div>
            <p className="text-stone-400 font-medium leading-relaxed mb-8 pr-4">
              Empowering Indian agriculture with AI-driven crop intelligence, real-time market data, and precision farming tools.
            </p>
            
            {/* Kisan Helpline Badge */}
            <div className="bg-[#06241b]/80 border border-emerald-800/30 rounded-2xl p-4 inline-flex items-center space-x-4 mb-8 shadow-inner hover:border-emerald-600/50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">24/7 Kisan Helpline</p>
                <p className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">1800-180-1551</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-400 transition-all shadow-sm hover:-translate-y-1">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Column 2: Platform Links */}
          <motion.div variants={itemVariants} className="lg:col-span-2 lg:col-start-6">
            <h4 className="text-white font-bold mb-6 tracking-wide text-lg">Platform</h4>
            <ul className="space-y-3.5">
              {['AI Crop Intelligence', 'Live Mandi Rates', 'Disease Vision AI', '7-Day Weather', 'Govt Schemes Match'].map((link, i) => (
                <li key={i}>
                  <a href="#" className="text-stone-400 hover:text-amber-400 font-medium transition-colors flex items-center group">
                    <ChevronRight className="w-3.5 h-3.5 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 text-amber-400 transition-all duration-300" />
                    <span>{link}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 3: Resources Links */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <h4 className="text-white font-bold mb-6 tracking-wide text-lg">Resources</h4>
            <ul className="space-y-3.5">
              {['Farmer Community', 'Agronomy Guides', 'Market Reports', 'Success Stories', 'Kisan Help Center'].map((link, i) => (
                <li key={i}>
                  <a href="#" className="text-stone-400 hover:text-emerald-400 font-medium transition-colors flex items-center group">
                    <ChevronRight className="w-3.5 h-3.5 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 text-emerald-400 transition-all duration-300" />
                    <span>{link}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 4: Contact & Locations */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <h4 className="text-white font-bold mb-6 tracking-wide text-lg">Connect</h4>
            <ul className="space-y-4">
              <li>
                <a href="mailto:support@krishimitra.in" className="flex items-start group">
                  <Mail className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 group-hover:text-amber-400 transition-colors" />
                  <div>
                    <p className="text-white font-bold mb-0.5">Email Support</p>
                    <p className="text-stone-400 text-sm font-medium group-hover:text-stone-300 transition-colors">support@krishimitra.in</p>
                  </div>
                </a>
              </li>
              <li>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-emerald-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-white font-bold mb-0.5">Headquarters</p>
                    <p className="text-stone-400 text-sm font-medium leading-relaxed">
                      AgriTech Hub, Sector 4<br />
                      New Delhi, India 110001
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </motion.div>

        </motion.div>

        {/* Bottom Copyright Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="py-6 border-t border-emerald-900/40 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left"
        >
          <p className="text-stone-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} KrishiMitra Technologies. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-stone-500 text-sm font-medium hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-stone-500 text-sm font-medium hover:text-emerald-400 transition-colors">Terms of Service</a>
            <div className="h-4 w-px bg-stone-700 hidden md:block"></div>
            <span className="text-amber-500/90 text-sm font-bold tracking-wide">Made for Bharat 🇮🇳</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}