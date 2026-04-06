'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Loader2, Store, Menu, X, Phone, CheckCircle2, AlertCircle, BellRing, ArrowLeft } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { getNavLinks } from '@/app/Data/NavLinks'; 
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAutoLocation } from '@/hooks/useAutoLocation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Dashboard');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [callMsg, setCallMsg] = useState('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [subState, setSubState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subMsg, setSubMsg] = useState('');

  useAutoLocation();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setUserRole(data.user.role);
          if (data.user.phone) {
            setUserPhone(data.user.phone);
          }
        }
      })
      .catch(err => console.error("Failed to fetch user role", err));
  }, []);

  const navLinks = [
    ...getNavLinks(t),
    ...(userRole === 'provider'
      ? [{
      id: 'provider-panel',
      // ✅ FIX: Added translation support here!
      name: t('nav.providerPanel') || 'Provider Panel', 
      href: '/dashboard/provider-panel',
      icon: <Store className="w-5 h-5" />
    }]
      : [])
  ];

  const mobilePrimaryIds = new Set(['overview', 'mandi', 'disease', 'soil']);
  const mobilePrimaryLinks = navLinks.filter((link) => mobilePrimaryIds.has(link.id));
  const mobileSecondaryLinks = navLinks.filter((link) => !mobilePrimaryIds.has(link.id));
  const isSchemesPage = pathname?.toLowerCase().includes('/dashboard/schemes');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push(`/${locale}/login`);
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
      setIsLoggingOut(false);
    }
  };

  const requestLogout = () => {
    if (isLoggingOut) return;
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await handleLogout();
  };

  const handleRequestCall = async () => {
    if (callState === 'loading') return;
    setCallState('loading');
    setCallMsg('');
    try {
      const res = await fetch('/api/request-call', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to request call');
      setCallState('success');
      setCallMsg(data.message || 'Call initiated!');
    } catch (err: any) {
      setCallState('error');
      setCallMsg(err.message || 'Something went wrong');
    } finally {
      setTimeout(() => { setCallState('idle'); setCallMsg(''); }, 4000);
    }
  };

  const handleSubscribe = async () => {
    if (!userPhone) {
      setSubState('error');
      setSubMsg('Phone number not found.');
      setTimeout(() => { setSubState('idle'); setSubMsg(''); }, 4000);
      return;
    }
    setSubState('loading');
    setSubMsg('');
    try {
      const res = await fetch('/api/cron/send-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userPhone, action: 'subscribe' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Subscription failed');
      setSubState('success');
      setSubMsg(data.message || 'Subscribed successfully!');
    } catch (err: any) {
      setSubState('error');
      setSubMsg(err.message || 'Error occurred');
    } finally {
      setTimeout(() => { setSubState('idle'); setSubMsg(''); }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#f5fbf7] to-[#edf6f1] flex font-sans selection:bg-agri-400 selection:text-agri-900">
      
      {/* 💻 DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-agri-900 text-agri-100 fixed h-full z-40 shadow-2xl shadow-agri-900/50">
        <div className="p-6 flex flex-col items-center space-x-3 border-b border-white/10">
          <div className="p-2 rounded-xl shadow-inner shadow-white/20">
            <img src="/logo.png" alt="Logo" className="w-7 h-7" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Krishi<span className="text-agri-400">Mitra</span>
          </span>
          <LanguageSwitcher/>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => {
            // Localize the href
            const localizedHref = `/${locale}${link.href}`;
            const isActive = pathname === localizedHref;
            
            return (
              <Link key={link.id} href={localizedHref}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ${
                  isActive 
                    ? 'bg-agri-800 text-white shadow-lg shadow-black/20 border-l-4 border-agri-400' 
                    : 'text-agri-100/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`${isActive ? 'text-agri-400' : 'group-hover:text-agri-400 transition-colors'}`}>
                  {link.icon}
                </div>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">

          {/* ── Request a Call CTA ── */}
          <button
            onClick={handleRequestCall}
            disabled={callState === 'loading'}
            className={`group flex items-center w-full space-x-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 relative overflow-hidden ${
              callState === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : callState === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-400/40 shadow-[0_0_16px_rgba(16,185,129,0.15)] hover:shadow-[0_0_24px_rgba(16,185,129,0.3)]'
            } disabled:opacity-70`}
          >
            {/* Animated glow ring */}
            {callState === 'idle' && (
              <span className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,.12),transparent)' }} />
            )}
            <div className={`relative ${
              callState === 'loading' ? 'animate-spin' : callState === 'success' ? '' : 'group-hover:scale-110 transition-transform'
            }`}>
              {callState === 'loading' ? <Loader2 className="w-5 h-5" /> :
               callState === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
               callState === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <Phone className="w-5 h-5" />}
            </div>
            <div className="flex-1 text-left">
              <span className="block text-sm">
                {callState === 'loading' ? 'Calling...' :
                 callState === 'success' ? 'Call Initiated! ✓' :
                 callState === 'error' ? 'Failed — Retry?' :
                 'Request a Call'}
              </span>
              {callMsg && <span className="block text-[11px] font-medium opacity-80 mt-0.5 leading-tight">{callMsg}</span>}
              {callState === 'idle' && <span className="block text-[11px] font-medium opacity-60 mt-0.5">We call you back instantly</span>}
            </div>
          </button>

          <button
            onClick={handleSubscribe}
            disabled={subState === 'loading'}
            className={`group flex items-center w-full space-x-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 relative overflow-hidden flex-shrink-0 ${
              subState === 'success'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : subState === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.15)] hover:shadow-[0_0_24px_rgba(245,158,11,0.3)]'
            } disabled:opacity-70`}
          >
            {subState === 'idle' && (
              <span className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,.12),transparent)' }} />
            )}
            <div className={`relative flex-shrink-0 ${
              subState === 'loading' ? 'animate-spin' : subState === 'success' ? '' : 'group-hover:scale-110 transition-transform'
            }`}>
              {subState === 'loading' ? <Loader2 className="w-5 h-5" /> :
               subState === 'success' ? <CheckCircle2 className="w-5 h-5 text-amber-400" /> :
               subState === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <BellRing className="w-5 h-5" />}
            </div>
            <div className="flex-1 text-left line-clamp-2">
              <span className="block text-sm leading-tight">
                {subState === 'loading' ? 'Subscribing...' :
                 subState === 'success' ? 'Subscribed! ✓' :
                 subState === 'error' ? 'Failed' :
                 'Subscribe to Alerts'}
              </span>
              {subMsg && <span className="block text-[11px] font-medium opacity-80 mt-0.5 leading-tight">{subMsg}</span>}
              {subState === 'idle' && !subMsg && <span className="block text-[11px] font-medium opacity-60 mt-0.5">Get Mandi prices daily</span>}
            </div>
          </button>

          <button 
            onClick={requestLogout}
            disabled={isLoggingOut}
            className="flex items-center w-full space-x-3 px-4 py-3.5 rounded-xl font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
          >
            {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <LogOut className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm">{isLoggingOut ? t('actions.loggingOut') : t('actions.signOut')}</span>
          </button>
        </div>
      </aside>

      {/* 📱 MOBILE BOTTOM NAV */}
      <nav className={`md:hidden fixed bottom-0 w-full backdrop-blur-xl border-t z-50 pb-safe shadow-[0_-10px_30px_rgba(7,40,26,0.08)] ${
        isSchemesPage
          ? 'bg-emerald-950/85 border-emerald-900/70'
          : 'bg-white/90 border-gray-200'
      }`}>
        <div className={`mx-2 mb-2 mt-1 grid grid-cols-5 gap-1 rounded-2xl border px-1.5 py-1.5 ${
          isSchemesPage
            ? 'border-emerald-900/60 bg-emerald-950/70'
            : 'border-agri-100/70 bg-white/95'
        }`}>
          {mobilePrimaryLinks.map((link) => {
            const localizedHref = `/${locale}${link.href}`;
            const isActive = pathname === localizedHref;
            return (
              <Link 
                key={link.id} 
                href={localizedHref} 
                onClick={() => setShowMobileMore(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 min-h-16 transition-colors"
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  isSchemesPage
                    ? (isActive ? 'bg-emerald-400/20 text-emerald-200' : 'text-emerald-200/60')
                    : (isActive ? 'bg-agri-100 text-agri-600' : 'text-gray-400 hover:text-agri-600')
                }`}>
                  {link.icon}
                </div>
                <span className={`text-[11px] leading-none font-bold whitespace-nowrap tracking-tight ${
                  isSchemesPage
                    ? (isActive ? 'text-emerald-100' : 'text-emerald-200/60')
                    : (isActive ? 'text-agri-600' : 'text-gray-400')
                }`}>
                  {link.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setShowMobileMore((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 min-h-16 transition-colors ${
              isSchemesPage
                ? (showMobileMore ? 'text-emerald-100' : 'text-emerald-200/60')
                : (showMobileMore ? 'text-agri-600' : 'text-gray-400')
            }`}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              isSchemesPage
                ? (showMobileMore ? 'bg-emerald-400/20' : '')
                : (showMobileMore ? 'bg-agri-100' : '')
            }`}>
              {showMobileMore ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </div>
            <span className={`text-[11px] leading-none font-bold whitespace-nowrap tracking-tight ${
              isSchemesPage
                ? (showMobileMore ? 'text-emerald-100' : 'text-emerald-200/60')
                : (showMobileMore ? 'text-agri-600' : 'text-gray-400')
            }`}>
              More
            </span>
          </button>
        </div>

        <AnimatePresence>
          {showMobileMore && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18 }}
              className={`mx-2 mb-2 rounded-2xl border p-3 shadow-xl ${
                isSchemesPage
                  ? 'border-emerald-900/60 bg-emerald-950/90 text-emerald-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="grid grid-cols-3 gap-2">
                {mobileSecondaryLinks.map((link) => {
                  const localizedHref = `/${locale}${link.href}`;
                  const isActive = pathname === localizedHref;

                  return (
                    <Link
                      key={link.id}
                      href={localizedHref}
                      onClick={() => setShowMobileMore(false)}
                      className={`rounded-xl border px-2 py-3 flex flex-col items-center text-center gap-1 ${
                        isSchemesPage
                          ? (isActive
                            ? 'border-emerald-700/60 bg-emerald-900/50 text-emerald-100'
                            : 'border-emerald-900/60 text-emerald-100/80 hover:border-emerald-700/60')
                          : (isActive
                            ? 'border-agri-200 bg-agri-50 text-agri-700'
                            : 'border-gray-200 text-gray-600 hover:border-agri-200 hover:text-agri-700')
                      }`}
                    >
                      <div>{link.icon}</div>
                      <span className="text-[11px] font-semibold leading-tight">{link.name}</span>
                    </Link>
                  );
                })}

                <button
                  type="button"
                  onClick={() => { setShowMobileMore(false); handleRequestCall(); }}
                  disabled={callState === 'loading'}
                  className={`rounded-xl border px-2 py-3 flex flex-col items-center text-center gap-1 transition ${
                    callState === 'success'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : callState === 'error'
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  } disabled:opacity-60`}
                >
                  <div>
                    {callState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                     callState === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                     <Phone className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] font-semibold leading-tight">
                    {callState === 'loading' ? 'Calling...' : callState === 'success' ? 'Called! ✓' : 'Call Me'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowMobileMore(false); handleSubscribe(); }}
                  disabled={subState === 'loading'}
                  className={`rounded-xl border px-2 py-3 flex flex-col items-center justify-center text-center gap-1 transition ${
                    subState === 'success'
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : subState === 'error'
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  } disabled:opacity-60`}
                >
                  <div>
                    {subState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                     subState === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                     <BellRing className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] font-semibold leading-tight">
                    {subState === 'loading' ? 'wait...' : subState === 'success' ? 'Subbed! ✓' : 'Subscribe'}
                  </span>
                </button>

                <Link
                  href={`/${locale}`}
                  onClick={() => setShowMobileMore(false)}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-2 py-3 flex flex-col items-center justify-center text-center gap-1 text-blue-600 hover:bg-blue-100 transition"
                >
                  <div>
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-semibold leading-tight">
                    Landing
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMore(false);
                    requestLogout();
                  }}
                  className="rounded-xl border border-red-200 bg-red-50 px-2 py-3 flex flex-col items-center justify-center text-center gap-1 text-red-600 hover:bg-red-100 transition"
                >
                  <div>
                    <LogOut className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-semibold leading-tight">
                    {isLoggingOut ? t('actions.loggingOut') : t('actions.signOut')}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 📦 MAIN CONTENT AREA */}
      <main className={`flex-1 md:ml-72 w-full ${isSchemesPage ? 'pb-24 md:pb-0 bg-[#021c17] min-h-[100dvh]' : 'pb-36 md:pb-0'} overflow-x-hidden relative`}>
        {!isSchemesPage && (
          <header className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-3.5 py-3 bg-white/95 backdrop-blur-md border-b border-agri-100 z-50 shadow-[0_6px_24px_rgba(2,44,34,0.08)]">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="h-10 w-10 rounded-full border border-agri-200 bg-white p-0.5 shadow-sm shrink-0">
                <img src="/favicon.ico" className='h-full w-full rounded-full object-contain' alt="Logo" />
              </div>
              <span className="text-[1.65rem] leading-none font-black text-agri-900 tracking-[-0.02em] truncate">KrishiMitra</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <LanguageSwitcher compact />
            </div>
          </header>
        )}

        {!isSchemesPage && (
          <div className="md:hidden h-16" aria-hidden="true" />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`${isSchemesPage ? 'p-0 md:p-10 max-w-none md:max-w-7xl' : 'p-4 sm:p-5 md:p-10 max-w-7xl'} mx-auto`}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
            >
              <h3 className="text-lg font-black text-gray-900">Confirm Sign Out</h3>
              <p className="mt-2 text-sm font-medium text-gray-600">
                Are you sure you want to quit and sign out?
              </p>

              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-xl border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-black text-red-600 hover:bg-red-100 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  <span>{isLoggingOut ? t('actions.loggingOut') : t('actions.signOut')}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}