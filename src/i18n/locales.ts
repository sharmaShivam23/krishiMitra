export const SUPPORTED_LOCALES = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

export const LOCALE_OPTIONS: Array<{ code: AppLocale; label: string; short: string }> = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिंदी (Hindi)', short: 'HI' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', short: 'PA' },
  { code: 'mr', label: 'मराठी (Marathi)', short: 'MR' },
  { code: 'bn', label: 'বাংলা (Bengali)', short: 'BN' },
  { code: 'te', label: 'తెలుగు (Telugu)', short: 'TE' },
  { code: 'ta', label: 'தமிழ் (Tamil)', short: 'TA' }
];