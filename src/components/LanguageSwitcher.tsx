'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Languages, Loader2 } from 'lucide-react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    
    // Safely replace the language prefix in the URL (e.g., /en/dashboard -> /hi/dashboard)
    const newPath = pathname.replace(/^\/[a-zA-Z]{2}/, `/${nextLocale}`);
    
    // startTransition tells React to process this route change smoothly in the background
    startTransition(() => {
      router.push(newPath);
    });
  };

  // Extract the current language from the URL (defaults to 'en')
  const currentLocale = pathname.split('/')[1] || 'en';

  return (
    <div className={`flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-sm transition-all ${isPending ? 'opacity-70' : 'opacity-100 hover:bg-emerald-100'}`}>
      
      {/* Show a spinner while the new language is loading, otherwise show the globe icon */}
      {isPending ? (
        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
      ) : (
        <Languages className="w-4 h-4 text-emerald-600" />
      )}
      
      <select 
        value={currentLocale}
        onChange={changeLanguage} 
        disabled={isPending}
        className="bg-transparent text-sm font-bold text-emerald-900 outline-none cursor-pointer appearance-none pr-4 disabled:cursor-not-allowed"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी (Hindi)</option>
        <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
      </select>
      
    </div>
  );
}