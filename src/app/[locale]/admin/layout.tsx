'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageSquare, Tractor, ShieldCheck, 
  Landmark, Briefcase, LayoutDashboard, LogOut, Loader2
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Overview', icon: <LayoutDashboard className="w-5 h-5" />, path: '/admin/dashboard' },
  { name: 'Manage Users', icon: <Users className="w-5 h-5" />, path: '/admin/users' },
  { name: 'Community Forum', icon: <MessageSquare className="w-5 h-5" />, path: '/admin/forum' },
  { name: 'Rental Listings', icon: <Tractor className="w-5 h-5" />, path: '/admin/rental' },
  { name: 'Collective Selling', icon: <Briefcase className="w-5 h-5" />, path: '/admin/pools' },
  { name: 'AI Disease Analytics', icon: <ShieldCheck className="w-5 h-5" />, path: '/admin/analytics' },
  { name: 'Gov. Schemes', icon: <Landmark className="w-5 h-5" />, path: '/admin/Schemes' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  
  const isLoginPage = pathname.endsWith('/admin/login');

  // 🌟 NEW: If it's the login page, render ONLY the children (the login form) with no sidebar
  if (isLoginPage) {
    return <main className="min-h-screen bg-[#f4f7f5] font-sans">{children}</main>;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
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
          <div className="p-2 rounded-xl shadow-inner shadow-white/20 mb-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Krishi<span className="text-agri-400">Admin</span>
          </span>
          <p className="text-[10px] text-agri-400/80 mt-1 font-bold tracking-widest uppercase">Command Center</p>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((link) => {
            // Because of next-intl, your pathname might have /en/ in front. 
            // .endsWith() ensures the active state works perfectly!
            const isActive = pathname.endsWith(link.path);
            
            return (
              <Link key={link.name} href={link.path}
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
            className="flex items-center justify-center w-full space-x-3 px-4 py-3.5 rounded-xl font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
          >
            {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            <span>{isLoggingOut ? 'Logging out...' : 'Secure Logout'}</span>
          </button>
        </div>
      </aside>

      {/* 📱 MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 pb-safe">
        <div className="flex items-center gap-4 px-2 py-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {MENU_ITEMS.map((link) => {
            const isActive = pathname.endsWith(link.path);
            return (
              <Link 
                key={link.name} 
                href={link.path} 
                className="flex flex-col items-center space-y-1 p-2 min-w-[76px] snap-center"
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
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-5 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" className='h-8 w-8' alt="Logo" />
            <span className="text-xl font-black text-agri-900 tracking-tight">Krishi<span className="text-agri-400">Admin</span></span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-gray-50 rounded-full">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Animated Page Transitions */}
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