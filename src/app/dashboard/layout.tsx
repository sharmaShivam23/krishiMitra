'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, LayoutDashboard, Leaf, CloudSun, 
  Activity, MessageSquare, FileText, LogOut, Loader2
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Navigation Links Data
  const navLinks = [
    { name: 'Overview', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Crop Intel', href: '/dashboard/crop-intelligence', icon: <Leaf className="w-5 h-5" /> },
    { name: 'Mandi Prices', href: '/dashboard/mandi-prices', icon: <Activity className="w-5 h-5" /> }, // Updated href to match your folder
    { name: 'Disease AI', href: '/dashboard/disease-detection', icon: <Activity className="w-5 h-5" /> }, 
    { name: 'Weather', href: '/dashboard/weather', icon: <CloudSun className="w-5 h-5" /> },
    { name: 'Community', href: '/dashboard/community', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Schemes', href: '/dashboard/schemes', icon: <FileText className="w-5 h-5" /> },
  ];

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
        <div className="p-6 flex items-center space-x-3 border-b border-white/10">
          <div className="p-2 rounded-xl shadow-inner shadow-white/20">
            {/* <Sprout className="w-7 h-7 text-white" /> */}
            <img src="/logo.png" alt="KrishiMitra Logo" className="w-7 h-7" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Krishi<span className="text-agri-400">Mitra</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href}
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
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 📱 MOBILE BOTTOM NAV (Scrollable) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 pb-safe">
        {/* Added overflow-x-auto, whitespace-nowrap, and custom-scrollbar hiding classes */}
        <div className="flex items-center gap-4 px-2 py-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href} 
                className="flex flex-col items-center space-y-1 p-2 min-w-[72px] snap-center"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-agri-100 text-agri-600' : 'text-gray-400 hover:text-agri-600'
                }`}>
                  {link.icon}
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${isActive ? 'text-agri-600' : 'text-gray-400'}`}>
                  {link.name.split(' ')[0]} {/* Shorten name for mobile */}
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
            {/* <Sprout className="w-6 h-6 text-agri-600" />
             */}
             <img src="/favicon.ico" className='h-16 w-16 bg-cover' alt="" />
            <span className="text-xl font-black text-agri-900 tracking-tight">KrishiMitra</span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-gray-50 rounded-full">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Page Content with Framer Motion Transitions */}
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
      
      {/* Hide Scrollbar Global Style Injection just for this component */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
    </div>
  );
}