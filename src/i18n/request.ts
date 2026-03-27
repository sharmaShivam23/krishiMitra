import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {DEFAULT_LOCALE, SUPPORTED_LOCALES} from './locales';

type Messages = Record<string, unknown>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const deepMerge = (base: Messages, override: Messages): Messages => {
  const result: Messages = {...base};

  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];

    if (isObject(baseValue) && isObject(value)) {
      result[key] = deepMerge(baseValue, value);
      continue;
    }

    result[key] = value;
  }

  return result;
};
 
export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale || !SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) {
    notFound();
  }

  const baseMessages = (await import(`../../messages/${DEFAULT_LOCALE}.json`)).default as Messages;
  const localeMessages = locale === DEFAULT_LOCALE
    ? baseMessages
    : (await import(`../../messages/${locale}.json`)).default as Messages;
 
  return {
    locale,
    messages: deepMerge(baseMessages, localeMessages)
  };
});