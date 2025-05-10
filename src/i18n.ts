
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'zh'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  const isValidLocale = locales.includes(locale as any);
  if (!isValidLocale) {
    console.error(`[i18n.ts] Invalid locale in getRequestConfig: "${locale}". Expected one of: ${locales.join(', ')}. Calling notFound().`);
    notFound();
  }

  let messages;
  try {
    // The path is relative to the `src` directory because i18n.ts is in src/
    // and messages are in src/messages/
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`[i18n.ts] Failed to load messages for locale "${locale}":`, error);
    // Fallback to default locale's messages or handle as appropriate
    // For now, if specific locale file is missing, it's a critical error.
    // You might want to fallback to English messages here instead of calling notFound()
    // if a translation file is missing but the locale is otherwise valid.
    // e.g. messages = (await import(`./messages/${defaultLocale}.json`)).default;
    // For this fix, sticking to notFound if specific locale messages fail.
    notFound();
  }
  
  if (!messages) {
    // This check is important because if messages is undefined, NextIntlClientProvider will error.
    console.error(`[i18n.ts] Messages for locale "${locale}" resolved to undefined. This indicates an issue in the JSON file or import. Calling notFound().`);
    notFound();
  }

  return {
    messages
  };
});

