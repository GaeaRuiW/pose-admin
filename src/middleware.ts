import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // Change to 'always' if you always want the locale in the URL
});

export const config = {
  // Match all pathnames except for
  // - …if they start with `/api`, `/_next` or `/_vercel`
  // - …the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
