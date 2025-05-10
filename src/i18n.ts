
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'zh'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  try {
    // Using path alias to ensure consistent resolution
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return {
      messages
    };
  } catch (error) {
    // If messages fail to load, treat as not found
    console.error(`Failed to load messages for locale ${locale} (tried with path alias @/messages/):`, error);
    notFound();
  }
});

