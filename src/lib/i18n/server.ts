import 'server-only';

import { cookies } from 'next/headers';
import { getDictionary, type Dictionary } from './index';
import { LOCALE_COOKIE, parseLocale, type Locale } from './locale';

/**
 * Idioma elegido por el visitante.
 *
 * Leer la cookie convierte la página en dinámica, cosa que aquí conviene: el
 * catálogo depende del inventario del momento, así que igual no queríamos
 * servir una copia congelada.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return parseLocale(store.get(LOCALE_COOKIE)?.value);
}

/** Atajo para componentes de servidor que solo necesitan los textos. */
export async function getTranslations(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
