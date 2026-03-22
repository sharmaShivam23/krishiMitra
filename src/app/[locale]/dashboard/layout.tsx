'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Loader2, Store } from 'lucide-react';
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

  useAutoLocation();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setUserRole(data.user.role);
        }
      })
      .catch(err => console.error("Failed to fetch user role", err));
  }, []);

  let navLinks = getNavLinks(t);
  
  if (userRole === 'provider') {
    navLinks.push({
      id: 'provider-panel',
      // ✅ FIX: Added translation support here!
      name: t('nav.providerPanel') || 'Provider Panel', 
      href: '/dashboard/provider-panel',
      icon: <Store className="w-5 h-5" />
    });
  }

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

  return (
    <div className="min-h-screen bg-agri-50 flex font-sans selection:bg-agri-400 selection:text-agri-900">
      
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

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center w-full space-x-3 px-4 py-3.5 rounded-xl font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
          >
            {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            <span>{isLoggingOut ? t('actions.loggingOut') : t('actions.signOut')}</span>
          </button>
        </div>
      </aside>

      {/* 📱 MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 pb-safe">
        <div className="flex items-center gap-4 px-2 py-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {navLinks.map((link) => {
            const localizedHref = `/${locale}${link.href}`;
            const isActive = pathname === localizedHref;
            return (
              <Link 
                key={link.id} 
                href={localizedHref} 
                className="flex flex-col items-center space-y-1 p-2 min-w-[72px] snap-center"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-agri-100 text-agri-600' : 'text-gray-400 hover:text-agri-600'
                }`}>
                  {link.icon}
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${isActive ? 'text-agri-600' : 'text-gray-400'}`}>
                  {link.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 📦 MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-72 w-full pb-24 md:pb-0 overflow-hidden relative">
        <header className="md:hidden flex items-center justify-between p-5 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-2">
            <img src="/favicon.ico" className='h-12 w-12' alt="Logo" />
            <span className="text-xl font-black text-agri-900 tracking-tight">KrishiMitra</span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-gray-50 rounded-full">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="p-6 md:p-10 max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}