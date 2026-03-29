'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Languages, Loader2, ChevronDown } from 'lucide-react';
import {DEFAULT_LOCALE, LOCALE_OPTIONS, SUPPORTED_LOCALES} from '@/i18n/locales';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const supportedLocaleSet = new Set<string>(SUPPORTED_LOCALES);

  const pathSegments = pathname.split('/').filter(Boolean);
  const hasLocalePrefix = supportedLocaleSet.has(pathSegments[0]);
  const currentLocale = hasLocalePrefix ? pathSegments[0] : DEFAULT_LOCALE;

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;

    const remainingPath = hasLocalePrefix ? pathSegments.slice(1) : pathSegments;
    const newPath = `/${[nextLocale, ...remainingPath].join('/')}`;

    // startTransition tells React to process this route change smoothly in the background
    startTransition(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredLocale', nextLocale);
        document.cookie = `preferredLocale=${nextLocale}; path=/; max-age=31536000`;
      }
      router.push(newPath);
    });
  };

  const containerClass = compact
    ? `relative flex items-center gap-1.5 bg-white border border-agri-200/80 px-2.5 py-1.5 rounded-full shadow-[0_6px_18px_-12px_rgba(2,44,34,0.45)] transition-all ${isPending ? 'opacity-70' : 'opacity-100 hover:border-agri-300 hover:bg-agri-50'}`
    : `relative flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-sm transition-all ${isPending ? 'opacity-70' : 'opacity-100 hover:bg-emerald-100'}`;

  const iconClass = compact
    ? 'w-3.5 h-3.5 text-agri-600'
    : 'w-4 h-4 text-emerald-600';

  const selectClass = compact
    ? 'bg-transparent text-[12px] font-black tracking-wide text-agri-900 outline-none cursor-pointer appearance-none pr-4 pl-0.5 disabled:cursor-not-allowed uppercase min-w-10'
    : 'bg-transparent text-sm font-bold text-emerald-900 outline-none cursor-pointer appearance-none pr-4 disabled:cursor-not-allowed';

  const currentOption = LOCALE_OPTIONS.find((option) => option.code === currentLocale);

  if (compact) {
    return (
      <div className="relative flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-agri-200/80 bg-white shadow-[0_6px_18px_-12px_rgba(2,44,34,0.45)] text-agri-900">
        <div className="w-5 h-5 rounded-full bg-agri-100 flex items-center justify-center">
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 text-agri-600 animate-spin" />
          ) : (
            <Languages className="w-3.5 h-3.5 text-agri-600" />
          )}
        </div>

        <span className="text-[12px] font-black tracking-wide uppercase pr-0.5">
          {currentOption?.short || 'EN'}
        </span>

        <ChevronDown className="w-3 h-3 text-agri-500" />

        <select
          value={currentLocale}
          onChange={changeLanguage}
          disabled={isPending}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Select language"
        >
          {LOCALE_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      
      {/* Show a spinner while the new language is loading, otherwise show the globe icon */}
      <div className={compact ? 'w-5 h-5 rounded-full bg-agri-100 flex items-center justify-center' : ''}>
        {isPending ? (
          <Loader2 className={`${iconClass} animate-spin`} />
        ) : (
          <Languages className={iconClass} />
        )}
      </div>
      
      <select 
        value={currentLocale}
        onChange={changeLanguage} 
        disabled={isPending}
        className={selectClass}
        aria-label="Select language"
      >
        {LOCALE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {compact ? option.short : option.label}
          </option>
        ))}
      </select>

      {compact && (
        <ChevronDown className="w-3 h-3 text-agri-500 pointer-events-none" />
      )}
      
    </div>
  );
}