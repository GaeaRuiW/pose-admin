import { redirect } from 'next/navigation';

export default function HomePage({params}: {params: {locale: string}}) {
  // Redirect to the localized login page.
  // The middleware should handle prefixing if `localePrefix` is 'always'.
  // If 'as-needed', it might go to /login if default locale, or /<locale>/login.
  // To be safe, explicitly use the locale from params.
  redirect(`/${params.locale}/login`);
  return null;
}
