'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence  , Variants} from 'framer-motion';
import {
  Sprout, Loader2, Phone, Lock, ArrowRight,
  ShieldCheck, CheckCircle2, Leaf, Sun, Droplets,
  Tractor, Eye, EyeOff
} from 'lucide-react';

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setSuccessMsg('Account created successfully! Please sign in.');
      }
    }
  }, []);

  const handleChange = (e :any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e :any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Redirect using standard web API
      window.location.href = '/dashboard';
      
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
    <motion.form 
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5" 
      onSubmit={handleSubmit}
    >
      <AnimatePresence mode="wait">
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }} 
            animate={{ opacity: 1, height: 'auto', y: 0 }} 
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="p-4 rounded-xl bg-emerald-50  text-sm border border-emerald-200 font-semibold flex items-center"
          >
            {/* <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500 flex-shrink-0" /> */}
          <img src="/favicon.ico" className='h-16 w-16 bg-cover' alt="" />
            <span>{successMsg}</span>
          </motion.div>
        )}

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
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="password" className="block text-sm font-bold text-gray-700">Password</label>
          <a href="#" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
            Forgot password?
          </a>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange}
            className="block w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      <motion.div variants={itemVariant} className="pt-4">
        <button type="submit" disabled={loading}
          className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/20 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] group overflow-hidden relative"
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <span className="relative flex items-center">
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Authenticating...</>
            ) : (
              <>Sign In <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
            )}
          </span>
        </button>
      </motion.div>
    </motion.form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">
      
      {/* LEFT SIDE: Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:flex-none lg:w-[45%] xl:w-[40%] 2xl:w-[35%] relative z-10 bg-white">
        
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />

        <div className="mx-auto w-full max-w-md relative z-10">
          
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="mb-8 lg:mb-12"
          >
            <a href="/" className="inline-flex items-center space-x-2.5 group">
              <div className="p-2.5 rounded-xl shadow-lg shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">
                {/* <Sprout className="w-6 h-6 text-white" />
                 */}
                  <img src="/favicon.ico" className='h-16 w-16 bg-cover' alt="" />
              </div>
              <span className="text-2xl font-black tracking-tight text-gray-900">
                Krishi<span className="text-emerald-600">Mitra</span>
              </span>
            </a>
          </motion.div>

          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              Welcome back.
            </h2>
            <p className="text-base text-gray-500 font-medium">
              New to KrishiMitra?{' '}
              <a href="/register" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors underline-offset-2 hover:underline">
                Create an account
              </a>
            </p>
          </motion.div>

          {/* Form Boundary */}
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>}>
            <LoginForm />
          </Suspense>

        </div>
      </div>

      {/* RIGHT SIDE: Professional Image & Brand Section */}
      <div className="hidden lg:flex flex-1 relative bg-emerald-950 items-center justify-center overflow-hidden">
        
        {/* Beautiful High-Res Farming Background (Different from Register) */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-10000"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1592982537447-6f2a6a0c5c10?q=80&w=2070&auto=format&fit=crop')" 
          }}
        />
        
        {/* Gradients for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/70 to-emerald-900/30"></div>
        <div className="absolute inset-0 bg-emerald-900/30 mix-blend-multiply"></div>
        
        {/* Floating Icons Background Elements */}
        <div className="absolute top-1/4 left-20 text-white/10 animate-pulse"><Tractor size={100} /></div>
        <div className="absolute bottom-1/3 right-24 text-white/10 animate-bounce" style={{animationDuration: '5s'}}><Sprout size={80} /></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 w-full max-w-2xl p-12 lg:p-16"
        >
          {/* Glassmorphism Feature Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 lg:p-12 shadow-2xl text-center">
            
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 border border-white/30 backdrop-blur-sm">
              <Leaf className="w-8 h-8 text-emerald-300" />
            </div>

            <h3 className="text-3xl lg:text-5xl font-black text-white leading-tight mb-6">
              Grow smarter, <br/><span className="text-emerald-400">harvest better.</span>
            </h3>
            
            <p className="text-emerald-50 text-lg font-medium mb-10 max-w-lg mx-auto leading-relaxed">
              Access your personalized dashboard to track weather, monitor crop health, and get real-time market insights all in one place.
            </p>

            <div className="inline-flex items-center space-x-2 bg-emerald-950/50 rounded-full px-5 py-2 border border-emerald-500/30 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-100 text-sm font-bold tracking-wide">SYSTEM ONLINE & SECURE</span>
            </div>
            
          </div>
        </motion.div>
      </div>

    </div>
  );
}