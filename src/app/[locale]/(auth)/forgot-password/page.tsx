'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { 
  Sprout, Loader2, Phone, Lock, ArrowRight, 
  ShieldCheck, ArrowLeft, KeySquare, HelpCircle, UserCheck
} from 'lucide-react';

function ForgotPasswordForm() {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Steps: 1 = Enter Phone, 2 = Enter OTP + New Password
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    newPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setSuccessMsg(`OTP sent to +91 ${formData.phone}`);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      setSuccessMsg('Password reset successful! Redirecting to login...');
      
      // Give them a moment to see the success message
      setTimeout(() => {
        window.location.href = `/${locale}/login`;
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
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

  const itemVariant: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5" 
    >
      <AnimatePresence mode="wait">
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }} 
            animate={{ opacity: 1, height: 'auto', y: 0 }} 
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="p-4 rounded-xl bg-emerald-50 text-sm border border-emerald-200 text-emerald-800 font-semibold flex items-center"
          >
            <img src="/favicon.ico" className='h-8 w-8 bg-cover mr-3' alt="" />
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
            <ShieldCheck className="w-5 h-5 mr-3 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={step === 1 ? handleSendOtp : handleResetPassword} className="space-y-5">
        {step === 1 && (
          <motion.div variants={itemVariant} key="step-1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1.5">Registered Phone Number</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <div className="absolute inset-y-0 left-11 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium pl-1">+91</span>
              </div>
              <input id="phone" name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" required value={formData.phone} onChange={handleChange}
                className="block w-full pl-20 pr-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900"
                placeholder="98765 43210"
                maxLength={10}
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div variants={itemVariant} key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <label htmlFor="otp" className="block text-sm font-bold text-gray-700 mb-1.5">6-Digit Verification Code</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeySquare className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input id="otp" name="otp" type="text" inputMode="numeric" pattern="[0-9]{6}" required value={formData.otp} onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900 tracking-[0.5em] text-center"
                  placeholder="------"
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 mb-1.5">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input id="newPassword" name="newPassword" type="password" required value={formData.newPassword} onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900"
                  placeholder="Enter a strong password"
                />
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariant} className="pt-4">
          <button type="submit" disabled={loading}
            className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/20 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] group overflow-hidden relative"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative flex items-center">
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {step === 1 ? 'Sending...' : 'Verifying...'}</>
              ) : (
                <>
                  {step === 1 ? 'Send Code' : 'Reset Password'}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  const locale = useLocale();

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
            <Link href={`/${locale}`} className="inline-flex items-center space-x-2.5 group">
              <div className="p-2.5 rounded-xl shadow-lg shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">
                  <img src="/favicon.ico" className='h-16 w-16 bg-cover' alt="KrishiMitra Logo" />
              </div>
              <span className="text-2xl font-black tracking-tight text-gray-900">
                Krishi<span className="text-emerald-600">Mitra</span>
              </span>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              Reset Password
            </h2>
            <p className="text-base text-gray-500 font-medium">
              Enter your registered phone number to receive a secure verification code.
            </p>
          </motion.div>

          {/* Form Boundary */}
          <ForgotPasswordForm />

          {/* Back to Login Button */}
          <div className="mt-8 flex justify-center">
            <Link href={`/${locale}/login`} className="text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors flex items-center group">
              <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" /> Back to Login
            </Link>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE: Professional Image & Brand Section */}
      <div className="hidden lg:flex flex-1 relative bg-emerald-950 items-center justify-center overflow-hidden">
        
        {/* Beautiful High-Res Farming Background */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-10000"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1595842845345-d851410d027f?q=80&w=2070&auto=format&fit=crop')" 
          }}
        />
        
        {/* Gradients for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/70 to-emerald-900/30"></div>
        <div className="absolute inset-0 bg-emerald-900/30 mix-blend-multiply"></div>
        
        {/* Floating Icons Background Elements */}
        <div className="absolute top-1/4 left-20 text-white/10 animate-pulse"><UserCheck size={100} /></div>
        <div className="absolute bottom-1/3 right-24 text-white/10" style={{animation: 'bounce 5s infinite'}}><Sprout size={80} /></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 w-full max-w-2xl p-12 lg:p-16"
        >
          {/* Glassmorphism Feature Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 lg:p-12 shadow-2xl text-center">
            
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 border border-white/30 backdrop-blur-sm shadow-inner">
              <HelpCircle className="w-8 h-8 text-emerald-300" />
            </div>

            <h3 className="text-3xl lg:text-5xl font-black text-white leading-tight mb-6 drop-shadow-lg">
              Secure Account Recovery
            </h3>
            
            <p className="text-emerald-50 text-lg font-medium mb-10 max-w-lg mx-auto leading-relaxed">
              We ensure your farm's data is heavily protected. KrishiMitra's secure OTP system verifies your identity to keep your digital agriculture hub safe.
            </p>

            <div className="inline-flex items-center space-x-2 bg-emerald-950/50 rounded-full px-5 py-2 border border-emerald-500/30 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-100 text-sm font-bold tracking-wide">Encrypted & Secure</span>
            </div>
            
          </div>
        </motion.div>
      </div>

    </div>
  );
}
