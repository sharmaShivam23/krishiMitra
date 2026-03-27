'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Loader2, User, Phone, MapPin, 
  Lock, ArrowRight, ShieldCheck, 
  ChevronDown, Leaf, KeyRound, ArrowLeft , CheckCircle2
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { STATES_DISTRICTS } from '@/utils/indiaStates';

export default function RegisterPage() {
  const t = useTranslations('Register');
  const locale = useLocale();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    state: '',
    district: '',
    preferredLanguage: locale || 'hi',
    role: 'farmer',
  });
  
  const [otp, setOtp] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // console.log(formData.phone);
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });
      // console.log(res);
      

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setStep(2);
    } catch (err: unknown) {
      // console.log(err);
      
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      window.location.href = `/${locale}/login?registered=true`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariant: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:flex-none lg:w-[45%] relative z-10 bg-white">
        <div className="mx-auto w-full max-w-md relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              {t('title')}
            </h2>
            <p className="text-base text-gray-500 font-medium">
              {t('switchText')}{' '}
              <Link href={`/${locale}/login`} className="text-emerald-600 font-bold hover:underline">
                {t('switchLink')}
              </Link>
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 flex items-start">
                <ShieldCheck className="w-5 h-5 mr-3 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form key="step1" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0, x: -20 }} className="space-y-5" onSubmit={handleRequestOtp}>
                <motion.div variants={itemVariant}>
                  <label className="block text-sm font-bold text-black mb-1.5">{t('fullName')}</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-black group-focus-within:text-emerald-500" />
                    <input name="name" type="text" required value={formData.name} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-black outline-none" placeholder="Ram Singh" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariant}>
                  <label className="block text-sm font-bold text-black mb-1.5">{t('phone')}</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500" />
                    <span className="absolute left-11 top-3.5 text-gray-400 font-medium">+91</span>
                    <input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" required maxLength={10} value={formData.phone} onChange={handleChange} className="block w-full pl-20 pr-4 py-3.5 border border-gray-200 rounded-xl text-black focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="98765 43210" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariant} className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-black mb-1.5">{t('region')}</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-black group-focus-within:text-emerald-500" />
                      <select name="state" required value={formData.state} onChange={(e) => {
                        setFormData(prev => ({ ...prev, state: e.target.value, district: '' }));
                        if (error) setError('');
                      }} className="block w-full pl-11 pr-10 py-3.5 border border-gray-200 rounded-xl focus:ring-2 text-black focus:ring-emerald-500 outline-none appearance-none cursor-pointer">
                        <option value="" disabled>{t('regionPlaceholder')}</option>
                        {Object.keys(STATES_DISTRICTS).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-bold text-black mb-1.5">District</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-black group-focus-within:text-emerald-500" />
                      <select name="district" required disabled={!formData.state} value={formData.district} onChange={handleChange} className="block w-full pl-11 pr-10 py-3.5 border border-gray-200 rounded-xl focus:ring-2 text-black focus:ring-emerald-500 outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:bg-gray-100">
                        <option value="" disabled>District</option>
                        {formData.state && STATES_DISTRICTS[formData.state]?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariant} className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-black mb-1.5">Role</label>
                    <div className="relative group">
                      <select name="role" required value={formData.role} onChange={handleChange} className="block w-full pl-4 pr-10 py-3.5 border border-gray-200 rounded-xl focus:ring-2 text-black focus:ring-emerald-500 outline-none appearance-none cursor-pointer">
                        <option value="farmer">Farmer</option>
                        <option value="provider">Provider (Seller)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-bold text-black mb-1.5">Preferred Language</label>
                    <div className="relative group">
                      <select name="preferredLanguage" required value={formData.preferredLanguage} onChange={handleChange} className="block w-full pl-4 pr-10 py-3.5 border border-gray-200 rounded-xl focus:ring-2 text-black focus:ring-emerald-500 outline-none appearance-none cursor-pointer">
                        <option value="en">English (English)</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="mr">Marathi (मराठी)</option>
                        <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                        <option value="bn">Bengali (বাংলা)</option>
                        <option value="te">Telugu (తెలుగు)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariant}>
                  <label className="block text-sm font-bold text-black mb-1.5">{t('password')}</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-black group-focus-within:text-emerald-500" />
                    <input name="password" type="password" required value={formData.password} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 text-black rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder={t('passwordPlaceholder')} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariant} className="pt-2">
                  <button type="submit" disabled={loading || formData.phone.length !== 10} className="w-full flex justify-center items-center py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-70">
                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('loading')}</> : <>{t('getOtp')} <ArrowRight className="w-5 h-5 ml-2" /></>}
                  </button>
                </motion.div>
                
                <p className="text-center text-xs text-gray-500 mt-2">{t('terms')}</p>
              </motion.form>
            ) : (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6" onSubmit={handleVerifyAndRegister}>
                <div>
                  <button type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }} className="flex items-center text-sm font-bold text-emerald-600 mb-6 hover:text-emerald-700">
                    <ArrowLeft className="w-4 h-4 mr-1" /> {t('back')}
                  </button>
                  <label className="block text-sm font-bold text-black mb-1.5">{t('enterOtp')}</label>
                  <p className="text-sm text-gray-500 mb-4">{t('otpSentTo')} <span className="font-bold text-gray-900">+91 {formData.phone}</span></p>
                  
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-black group-focus-within:text-emerald-500" />
                    <input type="text" inputMode="numeric" pattern="[0-9]{6}" required maxLength={6} value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }} className="block w-full pl-11 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-black outline-none font-bold text-lg tracking-[0.5em]" placeholder="------" />
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={loading || otp.length !== 6} className="w-full flex justify-center items-center py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-70">
                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('loading')}</> : <>{t('verifyBtn')} <CheckCircle2 className="w-5 h-5 ml-2" /></>}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative bg-emerald-950 items-end justify-center">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586771107445-d3afeb0dece5?q=80&w=2069&auto=format&fit=crop')" }} />
        <div className="relative z-10 w-full max-w-2xl p-12 mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-3xl font-black text-white mb-6">{t('featureTitle')}</h3>
            <ul className="space-y-4">
              {[t('feature1'), t('feature2'), t('feature3')].map((text, i) => (
                <li key={i} className="flex items-center text-emerald-50 text-lg font-medium">
                  <Leaf className="w-5 h-5 text-emerald-400 mr-4" /> {text}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-white font-bold text-sm border-t border-white/10 pt-6">{t('trusted')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}