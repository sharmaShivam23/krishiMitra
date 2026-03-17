'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion , AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Phone, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Sprout
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
   
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Successful login - redirect to admin dashboard
      router.push('/admin/dashboard'); // Or wherever your admin layout starts
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-emerald-900 rounded-b-[4rem] md:rounded-b-[8rem] z-0"></div>
      <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-600 rounded-full filter blur-[100px] opacity-30 pointer-events-none"></div>
      <div className="absolute top-20 right-20 w-80 h-80 bg-teal-500 rounded-full filter blur-[120px] opacity-20 pointer-events-none"></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Logo/Branding */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center mb-8 text-white"
        >
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl mb-4">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black tracking-tight flex items-center">
            Krishi<span className="text-emerald-400">Mitra</span> 
            <span className="ml-2 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-widest border border-emerald-400/30">
              Admin
            </span>
          </h1>
          <p className="text-emerald-100/80 font-medium text-sm mt-2">Secure Command Center Access</p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] shadow-2xl shadow-emerald-900/20 p-8 border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start text-sm font-bold"
                >
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Registered Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="tel" 
                  name="phone"
                  required
                  placeholder="Enter 10-digit number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Secure Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex justify-center items-center active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Authenticating...</>
              ) : (
                <>Authorize Access <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </button>
          </form>

        </motion.div>

        {/* Footer Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-500 font-medium text-sm">
            Not an administrator?{' '}
            <Link href="/login" className="text-emerald-700 font-bold hover:underline">
              Return to Farmer Login
            </Link>
          </p>
        </motion.div>

      </div>
    </div>
  );
}