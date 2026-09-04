import 'server-only';

import { redirect } from 'next/navigation';
import { container } from '@infra/container';
import { readSessionCookie } from '@infra/auth/session-cookie';
import type { AuthenticatedAdmin } from '@core/application/identity/authenticate.use-case';
import { UnauthorizedError } from '@core/domain/shared/errors';

/**
 * Guardia del panel.
 *
 * Se llama en el layout de `/admin` y al inicio de cada acción de escritura.
 * Es deliberadamente redundante: proteger solo el layout dejaría las Server
 * Actions expuestas, porque el cliente puede invocarlas directamente sin
 * pasar por ninguna página.
 */
export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const result = await container().identity.authenticate.execute(await readSessionCookie());

  if (!result.ok) {
    redirect('/admin/login');
  }

  return result.value;
}

/**
 * Igual que `requireAdmin`, pero para Server Actions: en vez de redirigir
 * lanza, para que el `guard()` de la acción lo convierta en un error legible.
 */
export async function requireAdminForAction(): Promise<AuthenticatedAdmin> {
  const result = await container().identity.authenticate.execute(await readSessionCookie());

  if (!result.ok) {
    throw new UnauthorizedError('Tu sesión expiró. Vuelve a iniciar sesión.');
  }

  return result.value;
}
