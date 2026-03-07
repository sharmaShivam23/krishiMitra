import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
 
// Can be imported from a shared config
const locales = ['en', 'hi', 'pa']; // English, Hindi, Punjabi
 
export default getRequestConfig(async ({requestLocale}) => {
  // 1. Await the requestLocale promise
  let locale = await requestLocale;

  // 2. Validate that the incoming `locale` parameter is valid
  // (We also check if locale is undefined just to be safe)
  if (!locale || !locales.includes(locale as any)) {
    notFound();
  }
 
  return {
    // 3. You must now explicitly return the locale alongside messages
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});