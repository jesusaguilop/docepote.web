/**
 * Código de pedido legible: "DP-7K2M".
 *
 * Es lo que el cliente dicta por WhatsApp, así que evitamos caracteres que se
 * confunden al leerlos en voz alta o escribirlos (O/0, I/1, etc.).
 */

import { ValidationError } from '../shared/errors';

const ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY3479';
const PREFIX = 'DP';
const LENGTH = 4;
const PATTERN = new RegExp(`^${PREFIX}-[${ALPHABET}]{${LENGTH}}$`);

export class OrderCode {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static of(value: string): OrderCode {
    const normalized = value.trim().toUpperCase();
    if (!PATTERN.test(normalized)) {
      throw new ValidationError(`"${value}" no es un código de pedido válido.`);
    }
    return new OrderCode(normalized);
  }

  /**
   * Genera un código nuevo. Recibe la fuente de aleatoriedad por parámetro
   * para que los tests puedan hacerlo determinista.
   */
  static generate(random: () => number = Math.random): OrderCode {
    let suffix = '';
    for (let i = 0; i < LENGTH; i += 1) {
      const index = Math.floor(random() * ALPHABET.length);
      suffix += ALPHABET.charAt(Math.min(index, ALPHABET.length - 1));
    }
    return new OrderCode(`${PREFIX}-${suffix}`);
  }

  toString(): string {
    return this.value;
  }
}
