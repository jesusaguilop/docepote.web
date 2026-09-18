/**
 * DTO de temporada.
 *
 * Lo importante de esta frontera es lo que NO cruza: los bytes de la
 * mascota se quedan en el servidor. Mandarlos al navegador metería medio
 * megabyte de base64 dentro del HTML de cada página; en su lugar viaja una
 * URL que sirve la imagen con caché propia.
 */

import type { Season } from '@core/domain/branding/season';
import type { PaletteProps } from '@core/domain/branding/palette';

export interface SeasonDTO {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly colors: PaletteProps;
  /** `null` = el hero usa la mascota de siempre. */
  readonly mascotUrl: string | null;
  readonly mascotAlt: string | null;
  readonly updatedAt: string;
}

export function toSeasonDTO(season: Season): SeasonDTO {
  // La marca de tiempo en la URL es lo que hace que al cambiar la imagen se
  // vea el cambio: sin ella, la respuesta cacheada un año seguiría mostrando
  // el gato viejo.
  const version = season.updatedAt.getTime();

  return {
    id: season.id,
    name: season.name,
    active: season.active,
    colors: season.palette.toObject(),
    mascotUrl: season.mascot ? `/api/marca/mascota/${season.id}?v=${version}` : null,
    mascotAlt: season.mascot?.alt ?? null,
    updatedAt: season.updatedAt.toISOString(),
  };
}
