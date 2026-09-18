/**
 * Palette — los doce colores con los que se viste la tienda.
 *
 * Es un objeto de valor, no un saco de strings: valida que cada color sea un
 * hexadecimal de verdad y, sobre todo, que el acento principal contraste con
 * el blanco. Ese último detalle es la razón de que esta clase exista.
 *
 * El acento se usa de fondo en los botones que cierran el pedido, con el
 * texto en blanco encima. Un rosa pastel precioso en el selector del panel
 * deja "Confirmar pedido" ilegible al sol, que es exactamente donde la
 * clienta lo va a leer. Como la regla es de la marca y no de la pantalla que
 * la edita, vive aquí: así la respetan por igual el panel, el seed y
 * cualquier cosa que venga después.
 */

import { ValidationError } from '../shared/errors';

export interface PaletteProps {
  /** Texto principal. */
  readonly ink: string;
  /** Texto secundario. */
  readonly inkSoft: string;
  /** Acento claro, decorativo: fondos suaves, selección, texturas. */
  readonly accent: string;
  /** Acento principal: botones sólidos y foco. Lleva texto blanco encima. */
  readonly accentDeep: string;
  /** El acento principal, un paso más oscuro, para hover. */
  readonly accentDark: string;
  readonly kraft: string;
  readonly kraftDark: string;
  /** Color de los bordes de tarjetas y separadores. */
  readonly kraftLine: string;
  readonly caramel: string;
  /** Fondo de la página. */
  readonly paper: string;
  /** Fondo de los bloques hundidos. */
  readonly paper2: string;
  /** Rojo de error. */
  readonly berry: string;
}

export type PaletteKey = keyof PaletteProps;

/** Orden en que se muestran y se guardan. */
export const PALETTE_KEYS: readonly PaletteKey[] = [
  'ink',
  'inkSoft',
  'accent',
  'accentDeep',
  'accentDark',
  'kraft',
  'kraftDark',
  'kraftLine',
  'caramel',
  'paper',
  'paper2',
  'berry',
] as const;

/**
 * Qué token de `globals.css` pisa cada color.
 *
 * Los nombres del dominio dicen "accent" y los del CSS dicen "green" por
 * historia: el acento de la marca era verde oliva. Renombrar el token
 * obligaba a tocar los setenta sitios que ya lo usan, así que la traducción
 * se resuelve aquí, en una sola tabla que se lee de un vistazo.
 */
export const CSS_VARIABLE_BY_KEY: Readonly<Record<PaletteKey, string>> = Object.freeze({
  ink: '--color-ink',
  inkSoft: '--color-ink-soft',
  accent: '--color-green',
  accentDeep: '--color-green-deep',
  accentDark: '--color-green-dark',
  kraft: '--color-kraft',
  kraftDark: '--color-kraft-dark',
  kraftLine: '--color-kraft-line',
  caramel: '--color-caramel',
  paper: '--color-paper',
  paper2: '--color-paper-2',
  berry: '--color-berry',
});

const HEX = /^#[0-9a-f]{6}$/i;

/** Mínimo de la WCAG para texto normal. El acento carga texto de botón. */
const MIN_CONTRAST_ON_WHITE = 4.5;
/** El texto secundario es el que más se sufre; se le exige lo mismo. */
const MIN_BODY_CONTRAST = 4.5;

export class Palette {
  private constructor(private readonly colors: PaletteProps) {
    Object.freeze(this.colors);
    Object.freeze(this);
  }

  static of(input: PaletteProps): Palette {
    const normalized = {} as Record<PaletteKey, string>;

    for (const key of PALETTE_KEYS) {
      const raw = String(input[key] ?? '').trim();
      // "FF4C84" y "#ff4c84" son lo mismo escrito por dos personas distintas.
      const value = raw.startsWith('#') ? raw : `#${raw}`;

      if (!HEX.test(value)) {
        throw new ValidationError(
          `El color "${key}" debe ser un hexadecimal de seis dígitos, como #bc0045.`,
          { campo: key },
        );
      }

      normalized[key] = value.toLowerCase();
    }

    const palette = new Palette(normalized as PaletteProps);
    palette.assertReadable();
    return palette;
  }

  get(key: PaletteKey): string {
    return this.colors[key];
  }

  toObject(): PaletteProps {
    return { ...this.colors };
  }

  /**
   * Las variables CSS listas para inyectar, en el orden de PALETTE_KEYS.
   *
   * Devuelve pares y no una cadena a propósito: quien las pinte decide cómo
   * escaparlas. Los valores ya pasaron por el regex de hexadecimal, así que
   * no hay forma de que se cuele nada raro en la hoja de estilos.
   */
  toCssVariables(): ReadonlyArray<readonly [string, string]> {
    return PALETTE_KEYS.map((key) => [CSS_VARIABLE_BY_KEY[key], this.colors[key]] as const);
  }

  /** Contraste WCAG entre dos hexadecimales: de 1 (igual) a 21 (negro/blanco). */
  static contrast(a: string, b: string): number {
    const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (l1 + 0.05) / (l2 + 0.05);
  }

  /**
   * Las dos combinaciones que de verdad se leen en la tienda.
   *
   * No se validan las doce contra todo: sería un muro de errores por una
   * decoración. Se protegen las que, si fallan, dejan a alguien sin poder
   * comprar o sin poder leer.
   */
  private assertReadable(): void {
    const onWhite = Palette.contrast(this.colors.accentDeep, '#ffffff');
    if (onWhite < MIN_CONTRAST_ON_WHITE) {
      throw new ValidationError(
        `El acento principal es muy claro: el texto blanco encima queda ilegible ` +
          `(contraste ${onWhite.toFixed(1)}:1, hace falta ${MIN_CONTRAST_ON_WHITE}:1). ` +
          `Oscurécelo y vuelve a probar.`,
        { campo: 'accentDeep' },
      );
    }

    const bodyOnPaper = Palette.contrast(this.colors.inkSoft, this.colors.paper);
    if (bodyOnPaper < MIN_BODY_CONTRAST) {
      throw new ValidationError(
        `El texto secundario no se distingue del fondo ` +
          `(contraste ${bodyOnPaper.toFixed(1)}:1, hace falta ${MIN_BODY_CONTRAST}:1).`,
        { campo: 'inkSoft' },
      );
    }
  }
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
