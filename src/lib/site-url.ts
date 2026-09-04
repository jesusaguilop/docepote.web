/**
 * Resuelve el dominio público del sitio.
 *
 * Orden de preferencia:
 *   1. `SITE_URL` — lo que se configure a mano manda siempre.
 *   2. `NEXT_PUBLIC_SITE_URL` — el nombre antiguo, por compatibilidad.
 *   3. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel la inyecta sola con el
 *      dominio de producción (sin protocolo). Así el despliegue funciona
 *      aunque nadie configure nada, que es justo donde se cuelan los enlaces
 *      a localhost.
 *   4. localhost, para desarrollo.
 *
 * No se usa `VERCEL_URL` a propósito: esa cambia en cada despliegue, y esta
 * URL termina dentro del mensaje de WhatsApp de cada pedido — tiene que ser
 * estable o el cliente se queda con un enlace que muere al siguiente deploy.
 */
export function resolveSiteUrl(): string {
  const explicit = firstPresent(process.env.SITE_URL, process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return stripTrailingSlashes(explicit);

  const vercel = firstPresent(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) {
    return `https://${stripTrailingSlashes(vercel.replace(/^https?:\/\//, ''))}`;
  }

  return 'http://localhost:3000';
}

/**
 * Primer valor con contenido real.
 *
 * En blanco cuenta como ausente: en un panel como el de Vercel es trivial
 * crear una variable y dejarla vacía, y `''` no debe ganarle al respaldo.
 */
export function firstPresent(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** Una barra final rompe las URLs al concatenar rutas. */
function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}
