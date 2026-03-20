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
        <option value="mr">मराठी (Marathi)</option>
        <option value="bn">বাংলা (Bengali)</option>
        <option value="te">తెలుగు (Telugu)</option>
        <option value="ta">தமிழ் (Tamil)</option>
        <option value="as">অসমীয়া (Assamese)</option>
        <option value="gu">ગુજરાતી (Gujarati)</option>
        <option value="kn">ಕನ್ನಡ (Kannada)</option>
        <option value="ml">മലയാളം (Malayalam)</option>
        <option value="or">ଓଡ଼ିଆ (Odia)</option>
        <option value="ur">اردو (Urdu)</option>
        <option value="sa">संस्कृत (Sanskrit)</option>
        <option value="sd">सिन्धी (Sindhi)</option>
        <option value="ne">नेपाली (Nepali)</option>
        <option value="mai">मैथिली (Maithili)</option>
        <option value="doi">डोगरी (Dogri)</option>
        <option value="gom">कोंकणी (Konkani)</option>
        <option value="sat">ᱥᱟᱱᱛᱟᱲᱤ (Santali)</option>
        <option value="ks">کٲشُر (Kashmiri)</option>
        <option value="mni">মৈতৈলোন্ (Manipuri)</option>
      </select>
      
    </div>
  );
}