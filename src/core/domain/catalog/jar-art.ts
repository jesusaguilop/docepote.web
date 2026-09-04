/**
 * Arte del pote.
 *
 * Cada producto se dibuja como un pote SVG con un color de contenido y un
 * patrón encima. Guardamos solo esos dos datos (no el SVG completo) para que
 * el dibujo viva en la capa de UI y el dominio no sepa nada de markup.
 */

import { ValidationError } from '../shared/errors';

export const JAR_PATTERNS = ['wave', 'dots', 'drop'] as const;
export type JarPattern = (typeof JAR_PATTERNS)[number];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export class JarArt {
  private constructor(
    readonly fillColor: string,
    readonly pattern: JarPattern,
  ) {
    Object.freeze(this);
  }

  static of(fillColor: string, pattern: string): JarArt {
    if (!HEX_COLOR.test(fillColor)) {
      throw new ValidationError(`"${fillColor}" no es un color hexadecimal de 6 dígitos.`);
    }
    if (!(JAR_PATTERNS as readonly string[]).includes(pattern)) {
      throw new ValidationError(`"${pattern}" no es un patrón válido.`, {
        patronesValidos: JAR_PATTERNS.join(', '),
      });
    }
    return new JarArt(fillColor.toLowerCase(), pattern as JarPattern);
  }

  static default(): JarArt {
    return new JarArt('#b98f55', 'wave');
  }
}
