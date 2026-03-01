'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Phone, 
  User as UserIcon, 
  Key, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSetup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    adminSecret: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (status.type) setStatus({ type: null, message: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const res = await fetch('/api/auth/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setStatus({ type: 'success', message: 'Master Admin account initialized successfully!' });
        // Redirect to login after a brief delay
        setTimeout(() => router.push('/admin/login'), 2000);
      } else {
        setStatus({ type: 'error', message: data.message || 'Verification failed' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error: Could not connect to system core.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Decorative Elements (Matching Login UI) */}
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
            <Key className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black tracking-tight flex items-center">
            Krishi<span className="text-emerald-400">Mitra</span> 
            <span className="ml-2 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest border border-amber-400/30">
              Setup
            </span>
          </h1>
          <p className="text-emerald-100/80 font-medium text-sm mt-2">Initialize System Core Privileges</p>
        </motion.div>

        {/* Setup Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] shadow-2xl shadow-emerald-900/20 p-8 border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Feedback Message */}
            <AnimatePresence mode="wait">
              {status.type && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`px-4 py-3 rounded-xl flex items-start text-sm font-bold border ${
                    status.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5" /> : <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />}
                  <span>{status.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Master Key Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Master Access Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <input 
                  type="password" 
                  name="adminSecret"
                  required
                  placeholder="Enter Secret Master Key"
                  value={formData.adminSecret}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full my-2" />

            {/* Name Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Administrator Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="name"
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Secure Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="tel" 
                  name="phone"
                  required
                  placeholder="10-digit mobile"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-gray-400"
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
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex justify-center items-center active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Configuring...</>
              ) : (
                <>Create Admin Account <ArrowRight className="w-5 h-5 ml-2" /></>
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
            Already have an account?{' '}
            <Link href="/admin/login" className="text-emerald-700 font-bold hover:underline">
              Go to Admin Login
            </Link>
          </p>
        </motion.div>

      </div>
    </div>
  );
}