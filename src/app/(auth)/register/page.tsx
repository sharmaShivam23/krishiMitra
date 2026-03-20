

'use client';

import { useState } from 'react';
import { motion, AnimatePresence , Variants } from 'framer-motion';
import { 
  Sprout, Loader2, User, Phone, MapPin, 
  Lock, ArrowRight, CheckCircle2, ShieldCheck, 
  ChevronDown, Leaf, Sun, Droplets
} from 'lucide-react';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    state: '',
  });

  const handleChange = (e : any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  
  const handleSubmit = async (e : any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      window.location.href = '/login?registered=true';
    } catch (err : any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariant : Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">
      
      {/* LEFT SIDE: Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:flex-none lg:w-[45%] xl:w-[40%] 2xl:w-[35%] relative z-10 bg-white">
        
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />

        <div className="mx-auto w-full max-w-md relative z-10">
          
          {/* Logo */}
          {/* <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="mb-2 lg:mb-12"
          >
            <a href="/" className="inline-flex mt-6 items-center space-x-2.5 group">
              <div className="p-2.5 rounded-xl shadow-lg shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">

                <img src="/favicon.ico" className='h-16 w-16 bg-cover' alt="" />
              </div>
              <span className="text-2xl font-black tracking-tight text-gray-900">
                Krishi<span className="text-emerald-600">Mitra</span>
              </span>
            </a>
          </motion.div> */}

          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-2"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Join the future of farming.
            </h2>
            <p className="text-base text-gray-500 font-medium">
              Already a member?{' '}
              <a href="/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors underline-offset-2 hover:underline">
                Sign in here
              </a>
            </p>
          </motion.div>

          {/* Form */}
          <motion.form 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-5" 
            onSubmit={handleSubmit}
          >
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }} 
                  animate={{ opacity: 1, height: 'auto', y: 0 }} 
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 font-semibold flex items-start"
                >
                  <ShieldCheck className="w-5 h-5 mr-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariant}>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900"
                  placeholder="e.g. Ram Singh"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariant}>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <div className="absolute inset-y-0 left-11 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium pl-1">+91</span>
                </div>
                <input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange}
                  className="block w-full pl-20 pr-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900"
                  placeholder="98765 43210"
                  maxLength={10}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariant}>
              <label htmlFor="state" className="block text-sm font-bold text-gray-700 mb-1.5">Farming Region</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <select id="state" name="state" required value={formData.state} onChange={handleChange}
                  className="block w-full pl-11 pr-10 py-3.5 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="text-gray-400">Select your state</option>
                  {['Andhra Pradesh', 'Gujarat', 'Haryana', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Uttar Pradesh', 'West Bengal'].map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariant}>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900"
                  placeholder="Create a strong password"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariant} className="pt-2">
              <button type="submit" disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/20 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] group overflow-hidden relative"
              >
                {/* Button hover effect */}
                <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                
                <span className="relative flex items-center">
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account...</>
                  ) : (
                    <>Create Account <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </button>
            </motion.div>
            
            <motion.p variants={itemVariant} className="text-center mb-2 text-sm text-gray-500 font-medium mt-2">
              By joining, you agree to our <a href="#" className="text-emerald-600 hover:text-emerald-700 hover:underline">Terms of Service</a> & <a href="#" className="text-emerald-600 hover:text-emerald-700 hover:underline">Privacy Policy</a>.
            </motion.p>
          </motion.form>
        </div>
      </div>

      {/* RIGHT SIDE: Professional Image & Brand Section */}
      <div className="hidden lg:flex flex-1 relative bg-emerald-950 items-end justify-center overflow-hidden">
        
        {/* Beautiful High-Res Farming Background from Unsplash */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-10000"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1586771107445-d3afeb0dece5?q=80&w=2069&auto=format&fit=crop')" 
          }}
        />
        
        {/* Gradients for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-transparent"></div>
        <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply"></div>
        
        {/* Floating Icons Background Elements */}
        <div className="absolute top-20 right-20 text-white/10 animate-pulse"><Leaf size={120} /></div>
        <div className="absolute bottom-40 left-20 text-white/10 animate-bounce" style={{animationDuration: '4s'}}><Sun size={80} /></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 w-full max-w-2xl p-12 lg:p-16 xl:p-20 mb-8"
        >
          {/* Glassmorphism Feature Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 lg:p-10 shadow-2xl">
            
            <h3 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-6">
              Empowering farmers with <span className="text-emerald-400">smart insights.</span>
            </h3>
            
            <ul className="space-y-5 mb-10">
              {[
                { text: 'Real-time Mandi market prices', icon: <Droplets className="w-5 h-5 text-emerald-400" /> },
                { text: 'AI-driven crop disease detection', icon: <Leaf className="w-5 h-5 text-emerald-400" /> },
                { text: 'Personalized weather & harvest alerts', icon: <Sun className="w-5 h-5 text-emerald-400" /> },
              ].map((item, i) => (
                <li key={i} className="flex items-center text-emerald-50 text-lg font-medium">
                  <div className="bg-white/10 p-2 rounded-lg mr-4 flex-shrink-0 border border-white/10">
                    {item.icon}
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>

            <div className="pt-8 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex -space-x-4 mr-5">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces" alt="Farmer" className="w-12 h-12 rounded-full border-2 border-emerald-900 object-cover" />
                  <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces" alt="Farmer" className="w-12 h-12 rounded-full border-2 border-emerald-900 object-cover" />
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces" alt="Farmer" className="w-12 h-12 rounded-full border-2 border-emerald-900 object-cover" />
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    {[1,2,3,4,5].map(star => (
                      <svg key={star} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </div>
                  <p className="text-white font-bold text-sm">Trusted by 50,000+ farmers</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}