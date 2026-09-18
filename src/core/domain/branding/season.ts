/**
 * Season — cómo va vestida la tienda.
 *
 * Una temporada es una paleta con nombre y, si se quiere, una mascota
 * distinta para el hero. Existe para que "pongamos la web de rosado por Amor
 * y Amistad" deje de ser un despliegue y pase a ser un clic.
 *
 * La regla de "solo una activa" no la impone esta clase: una entidad no
 * puede saber qué están haciendo las otras filas de la tabla. La sostiene
 * `ActivateSeasonUseCase`, que es quien ve el conjunto entero.
 */

import { ValidationError } from '../shared/errors';
import { Palette, type PaletteProps } from './palette';

/** Lo que el navegador acepta y la marca necesita. */
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type MascotMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Tope de la imagen de la mascota.
 *
 * Son 900 KB y no 2 MB por dos razones: viaja en el cuerpo de una Server
 * Action (limitada a 2 MB en next.config) y se sirve en el hero, que es lo
 * primero que carga la clienta —muchas veces con datos móviles y de pie en
 * la calle. Una mascota de 4 MB no es una mascota, es un problema.
 */
export const MAX_MASCOT_BYTES = 900 * 1024;

export interface Mascot {
  readonly image: Uint8Array;
  readonly mimeType: MascotMimeType;
  /** Texto alternativo: la mascota es contenido, no decoración. */
  readonly alt: string;
}

export interface SeasonProps {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly palette: Palette;
  /** `null` = se usa la mascota de siempre, la que vive en el repositorio. */
  readonly mascot: Mascot | null;
  readonly updatedAt: Date;
}

const MAX_NAME_LENGTH = 40;

export class Season {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly palette: Palette;
  readonly mascot: Mascot | null;
  readonly updatedAt: Date;

  private constructor(props: SeasonProps) {
    this.id = props.id;
    this.name = props.name;
    this.active = props.active;
    this.palette = props.palette;
    this.mascot = props.mascot;
    this.updatedAt = props.updatedAt;
    Object.freeze(this);
  }

  static of(props: SeasonProps): Season {
    const name = props.name.trim();

    if (name.length < 2) {
      throw new ValidationError('Ponle un nombre a la temporada.', { campo: 'name' });
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(
        `El nombre de la temporada no puede pasar de ${MAX_NAME_LENGTH} caracteres.`,
        { campo: 'name' },
      );
    }
    if (props.mascot) Season.assertMascotIsUsable(props.mascot);

    return new Season({ ...props, name });
  }

  /** Crea una temporada a partir de los colores sueltos que manda el panel. */
  static create(input: {
    id: string;
    name: string;
    colors: PaletteProps;
    mascot: Mascot | null;
    active?: boolean;
    updatedAt?: Date;
  }): Season {
    return Season.of({
      id: input.id,
      name: input.name,
      active: input.active ?? false,
      palette: Palette.of(input.colors),
      mascot: input.mascot,
      updatedAt: input.updatedAt ?? new Date(),
    });
  }

  withPalette(palette: Palette): Season {
    return Season.of({ ...this.toProps(), palette, updatedAt: new Date() });
  }

  withName(name: string): Season {
    return Season.of({ ...this.toProps(), name, updatedAt: new Date() });
  }

  /** `null` quita la mascota y devuelve el hero a la imagen de siempre. */
  withMascot(mascot: Mascot | null): Season {
    return Season.of({ ...this.toProps(), mascot, updatedAt: new Date() });
  }

  activated(): Season {
    return this.active ? this : Season.of({ ...this.toProps(), active: true });
  }

  deactivated(): Season {
    return this.active ? Season.of({ ...this.toProps(), active: false }) : this;
  }

  private toProps(): SeasonProps {
    return {
      id: this.id,
      name: this.name,
      active: this.active,
      palette: this.palette,
      mascot: this.mascot,
      updatedAt: this.updatedAt,
    };
  }

  private static assertMascotIsUsable(mascot: Mascot): void {
    if (!ALLOWED_MIME_TYPES.includes(mascot.mimeType)) {
      throw new ValidationError('La mascota debe ser PNG, JPG o WebP.', { campo: 'mascot' });
    }
    if (mascot.image.byteLength === 0) {
      throw new ValidationError('La imagen de la mascota llegó vacía.', { campo: 'mascot' });
    }
    if (mascot.image.byteLength > MAX_MASCOT_BYTES) {
      const kb = Math.round(MAX_MASCOT_BYTES / 1024);
      throw new ValidationError(
        `La imagen pesa ${Math.round(mascot.image.byteLength / 1024)} KB y el tope son ${kb} KB. ` +
          `Bájale el tamaño y vuelve a subirla.`,
        { campo: 'mascot' },
      );
    }
    if (!mascot.alt.trim()) {
      throw new ValidationError(
        'Describe la imagen en una línea: es lo que leen quienes no pueden verla.',
        { campo: 'mascotAlt' },
      );
    }
  }
}

export function parseMascotMimeType(raw: string): MascotMimeType {
  const value = raw.trim().toLowerCase();
  const match = ALLOWED_MIME_TYPES.find((allowed) => allowed === value);

  if (!match) {
    throw new ValidationError('La mascota debe ser PNG, JPG o WebP.', { campo: 'mascot' });
  }

  return match;
}
