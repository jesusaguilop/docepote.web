import 'server-only';

import { cache } from 'react';
import { container } from '@infra/container';
import type { SeasonDTO } from '@core/application/dto/season.dto';

/**
 * La temporada que viste la tienda, para quien la necesite durante el
 * renderizado.
 *
 * Dos decisiones que cargan todo el peso:
 *
 * 1. `cache()` la resuelve una sola vez por petición. La consultan el layout
 *    (para inyectar los colores), el viewport (para el color de la barra del
 *    navegador) y el hero (para la mascota); sin esto serían tres viajes a la
 *    base para pintar una portada.
 *
 * 2. Nunca lanza. Esto corre en el layout raíz, así que un fallo aquí no
 *    rompería una sección: dejaría la tienda entera en blanco. Si la base no
 *    responde, se devuelve `null` y la tienda se pinta con la paleta de
 *    fábrica de globals.css — de rosado a kraft, pero abierta y vendiendo.
 */
export const activeSeason = cache(async (): Promise<SeasonDTO | null> => {
  try {
    const result = await container().branding.active.execute();
    return result.ok ? result.value : null;
  } catch (error) {
    console.error('[temporada] no se pudo leer la temporada activa:', error);
    return null;
  }
});
