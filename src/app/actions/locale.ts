'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, parseLocale } from '@/lib/i18n/locale';

/**
 * Cambia el idioma de la tienda.
 *
 * La preferencia va en cookie y no en la URL: así el visitante conserva su
 * idioma al navegar y al volver otro día, sin duplicar rutas. Si algún día se
 * quiere `/pt/...` para posicionamiento, los textos ya están en diccionarios
 * y la migración es cambiar de dónde sale el `locale`.
 */
export async function setLocale(value: string): Promise<void> {
  const store = await cookies();

  store.set(LOCALE_COOKIE, parseLocale(value), {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  });

  // Todo lo que se renderizó en el idioma anterior queda obsoleto.
  revalidatePath('/', 'layout');
}
