import 'server-only';

import { redirect } from 'next/navigation';
import { container } from '@infra/container';
import { readSessionCookie } from '@infra/auth/session-cookie';
import type { AuthenticatedAdmin } from '@core/application/identity/authenticate.use-case';

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
 * Igual que `requireAdmin`, pero para Server Actions.
 *
 * Antes lanzaba un error y el panel mostraba "Tu sesión expiró" en un aviso
 * que se iba solo, sin llevar a ningún lado: se seguía apretando botones que
 * fallaban. Ahora manda directo al login, que explica qué pasó. `guard()`
 * deja pasar la redirección en vez de tragársela.
 */
export async function requireAdminForAction(): Promise<AuthenticatedAdmin> {
  const result = await container().identity.authenticate.execute(await readSessionCookie());

  if (!result.ok) {
    redirect('/admin/login?expirada=1');
  }

  return result.value;
}
