import 'server-only';

import { cookies } from 'next/headers';

/**
 * Cookie de sesión del panel.
 *
 * Guarda un identificador opaco, nunca datos del usuario: quien tenga la
 * cookie no puede leer nada de ella, y el servidor resuelve a quién pertenece
 * consultando la tabla de sesiones.
 *
 *  - `httpOnly`: JavaScript no puede leerla, así que un XSS no se lleva la sesión.
 *  - `sameSite: lax`: corta los CSRF sin romper la navegación normal.
 *  - `secure` en producción: solo viaja por HTTPS (en local se desactiva
 *    porque `localhost` es HTTP y si no, el navegador la descarta).
 */

const COOKIE_NAME = 'docepote_session';

export async function setSessionCookie(sessionId: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function readSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
