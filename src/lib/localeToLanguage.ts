/**
 * Maps Next-intl locale codes to the full language names used
 * in Gemini AI prompts.  Add new locales here as the app grows.
 */
export const LOCALE_TO_AI_LANGUAGE: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  mr: 'Marathi',
  bn: 'Bengali',
  te: 'Telugu',
  ta: 'Tamil',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  or: 'Odia',
  ur: 'Urdu',
};

/**
 * Returns the AI-friendly language name for a given locale code.
 * Falls back to 'English' for any unknown code.
 */
export function getAiLanguage(localeCode: string | null | undefined): string {
  if (!localeCode) return 'English';
  return LOCALE_TO_AI_LANGUAGE[localeCode] ?? 'English';
}
