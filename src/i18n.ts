
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'zh'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  try {
    // Using path alias for potentially more robust resolution
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return {
      messages
    };
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale} (tried with alias @/messages/${locale}.json):`, error);
    // If messages are critical for the page, trigger a notFound or handle appropriately.
    // For example, if English messages are always available, you could try to fall back:
    // if (locale !== defaultLocale) {
    //   try {
    //     console.warn(`Falling back to default locale '${defaultLocale}' for messages.`);
    //     const fallbackMessages = (await import(`@/messages/${defaultLocale}.json`)).default;
    //     return { messages: fallbackMessages };
    //   } catch (fallbackError) {
    //     console.error(`Failed to load fallback messages for default locale ${defaultLocale}:`, fallbackError);
    //     notFound();
    //   }
    // }
    notFound();
  }
});

