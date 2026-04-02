'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Loader2, User, Phone, MapPin,
  Lock, ArrowRight, ShieldCheck,
  ChevronDown, Leaf, KeyRound, ArrowLeft, CheckCircle2,
  Store, FileText, Image as ImageIcon, X, BadgeCheck, Eye, EyeOff
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { STATES_DISTRICTS } from '@/utils/indiaStates';
import StateDistrictSelector from '@/components/StateDistrictSelector';

export default function RegisterPage() {
  const t = useTranslations('Register');
  const locale = useLocale();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Modal State
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    state: '',
    district: '',
    preferredLanguage: locale || 'hi',
    role: 'farmer',
    shopName: '',
    licenseNumber: '',
    gstNumber: '',
    licenseImage: ''
  });
  
  const [otp, setOtp] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (modalError) setModalError('');
  };

  // Special handler for Role to trigger Modal
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value;
    setFormData({ ...formData, role: selectedRole });
    if (error) setError('');
    
    if (selectedRole === 'provider') {
      setIsProviderModalOpen(true);
    }
  };

  const handleSaveProviderDetails = () => {
    if (!formData.shopName || !formData.licenseNumber || !formData.licenseImage) {
      setModalError('Please fill all required verification fields.');
      return;
    }
    setModalError('');
    setIsProviderModalOpen(false);
  };

  const handleCancelProvider = () => {
    // Revert to farmer if they cancel without providing details
    setFormData({ ...formData, role: 'farmer' });
    setIsProviderModalOpen(false);
    setModalError('');
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.role === 'provider' && (!formData.shopName || !formData.licenseNumber)) {
      setError('Provider verification details are incomplete.');
      setIsProviderModalOpen(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setStep(2);
    } catch (err: any) {
      setError(err.message);
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
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">
      
      {/* 🔴 PROVIDER VERIFICATION MODAL 🔴 */}
      <AnimatePresence>
        {isProviderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={handleCancelProvider}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <BadgeCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">Provider Verification</h3>
                    <p className="text-xs text-gray-500 font-medium">Authorized Sellers Only</p>
                  </div>
                </div>
                <button onClick={handleCancelProvider} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {modalError && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2 flex-shrink-0" /> {modalError}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Shop Name <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <Store className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input name="shopName" type="text" value={formData.shopName} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-black bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="E.g. Krishi Kendra" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Govt. License Number <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input name="licenseNumber" type="text" value={formData.licenseNumber} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-black bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Pesticide/Fertilizer License No." />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">License Document URL <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <ImageIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input name="licenseImage" type="url" value={formData.licenseImage} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-black bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Link to document image" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">GST Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input name="gstNumber" type="text" value={formData.gstNumber} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-black bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="22AAAAA0000A1Z5" />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button onClick={handleCancelProvider} className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all">Cancel</button>
                <button onClick={handleSaveProviderDetails} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all">Save Details</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* 🔴 END MODAL 🔴 */}


      {/* LEFT SIDE: FORM */}
      <div className="flex-1 flex flex-col px-6 sm:px-12 lg:flex-none lg:w-[50%] xl:w-[45%] relative z-10 bg-white overflow-y-auto hide-scrollbar border-r border-gray-100 shadow-xl py-12">
        <div className="mx-auto w-full max-w-md relative z-10 my-auto">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
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
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 text-black rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 flex items-start shadow-sm">
                <ShieldCheck className="w-5 h-5 mr-3 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form key="step1" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0, x: -20 }} className="space-y-6" onSubmit={handleRequestOtp}>
                
                {/* Name */}
                <motion.div variants={itemVariant}>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">{t('fullName')}</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input name="name" type="text" required value={formData.name} onChange={handleChange} className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black outline-none transition-all shadow-sm" placeholder="Ram Singh" />
                  </div>
                </motion.div>

                {/* Phone */}
                <motion.div variants={itemVariant}>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">{t('phone')}</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <span className="absolute left-11 top-3.5 text-gray-500 font-bold">+91</span>
                    <input name="phone" type="tel" required maxLength={10} value={formData.phone} onChange={handleChange} className="block w-full pl-20 pr-4 py-3.5 border border-gray-200 rounded-xl text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm font-medium tracking-wide" placeholder="98765 43210" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariant}>
                  <StateDistrictSelector
                    state={formData.state}
                    district={formData.district}
                    onStateChange={v => { setFormData(prev => ({ ...prev, state: v, district: '' })); if (error) setError(''); }}
                    onDistrictChange={v => { setFormData(prev => ({ ...prev, district: v })); if (error) setError(''); }}
                    required
                    stateLabel={t('region')}
                    districtLabel="District"
                  />
                </motion.div>

                {/* 🔴 ALIGNMENT FIX: Grid Layout for Role and Language */}
                <motion.div variants={itemVariant} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Role</label>
                    <div className="relative group">
                      <select name="role" required value={formData.role} onChange={handleRoleChange} className="block w-full pl-4 pr-10 py-3.5 border border-gray-200 rounded-xl focus:ring-2 text-black focus:ring-emerald-500 outline-none appearance-none cursor-pointer shadow-sm bg-white font-bold">
                        <option value="farmer">Farmer</option>
                        <option value="provider">Provider (Seller)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">App Language</label>
                    <div className="relative group">
                      <select name="preferredLanguage" required value={formData.preferredLanguage} onChange={handleChange} className="block w-full pl-4 pr-10 py-3.5 border border-gray-200 rounded-xl focus:ring-2 text-black focus:ring-emerald-500 outline-none appearance-none cursor-pointer shadow-sm bg-white font-medium">
                        <option value="en">English</option>
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

                {/* Password */}
                <motion.div variants={itemVariant}>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">{t('password')}</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} className="block w-full pl-11 pr-12 py-3.5 border border-gray-200 text-black rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm font-medium" placeholder={t('passwordPlaceholder')} />
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

                {/* Submit Button */}
                <motion.div variants={itemVariant} className="pt-2">
                  <button type="submit" disabled={loading || formData.phone.length !== 10} className="w-full flex justify-center items-center py-4 rounded-xl bg-emerald-600 text-white font-extrabold text-lg hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 transition-all disabled:opacity-70 disabled:hover:shadow-none">
                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('loading')}</> : <>{t('getOtp')} <ArrowRight className="w-5 h-5 ml-2" /></>}
                  </button>
                </motion.div>
                
                <p className="text-center text-xs text-gray-400 mt-2 font-medium">{t('terms')}</p>
              </motion.form>
            ) : (
              // OTP STEP
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6" onSubmit={handleVerifyAndRegister}>
                <div>
                  <button type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }} className="flex items-center text-sm font-bold text-emerald-600 mb-6 hover:text-emerald-700 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> {t('back')}
                  </button>
                  <label className="block text-sm font-extrabold text-gray-900 mb-1.5 text-xl">{t('enterOtp')}</label>
                  <p className="text-sm text-gray-500 mb-6 font-medium">{t('otpSentTo')} <span className="font-bold text-emerald-600">+91 {formData.phone}</span></p>
                  
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-4 h-6 w-6 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input type="text" required maxLength={6} value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }} className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 text-gray-900 outline-none font-black text-2xl tracking-[0.5em] text-center shadow-inner bg-gray-50 focus:bg-white transition-all" placeholder="------" />
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={loading || otp.length !== 6} className="w-full flex justify-center items-center py-4 rounded-xl bg-emerald-600 text-white font-extrabold text-lg hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 transition-all disabled:opacity-70 disabled:hover:shadow-none">
                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('loading')}</> : <>{t('verifyBtn')} <CheckCircle2 className="w-5 h-5 ml-2" /></>}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
          
          {/* Back to Home Button */}
          <div className="mt-8 flex justify-center">
            <Link href={`/${locale}`} className="text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors flex items-center group">
              <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" /> Back to Landing Page
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: IMAGE BANNER */}
      <div className="hidden lg:flex flex-1 relative bg-emerald-950 items-end justify-center">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586771107445-d3afeb0dece5?q=80&w=2069&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/40 to-transparent"></div>
        <div className="relative z-10 w-full max-w-2xl p-12 mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-3xl font-black text-white mb-6 leading-tight">{t('featureTitle')}</h3>
            <ul className="space-y-4">
              {[t('feature1'), t('feature2'), t('feature3')].map((text, i) => (
                <li key={i} className="flex items-center text-emerald-50 text-lg font-medium">
                  <Leaf className="w-5 h-5 text-emerald-400 mr-4 flex-shrink-0" /> {text}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-emerald-200 font-bold text-sm border-t border-white/10 pt-6 tracking-wide uppercase">{t('trusted')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}