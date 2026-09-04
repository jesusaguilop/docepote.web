/**
 * PhoneNumber — celular colombiano.
 *
 * Acepta lo que la gente realmente escribe ("318 017 3770", "+57 318-017-3770")
 * y lo normaliza a formato E.164 sin el "+" (573180173770), que es justo lo
 * que necesita el enlace de WhatsApp.
 */

import { ValidationError } from './errors';

const COLOMBIA_CODE = '57';
const MOBILE_LENGTH = 10;

export class PhoneNumber {
  private constructor(readonly e164: string) {
    Object.freeze(this);
  }

  static of(raw: string): PhoneNumber {
    const digits = raw.replace(/\D/g, '');

    const national = digits.startsWith(COLOMBIA_CODE) && digits.length === MOBILE_LENGTH + 2
      ? digits.slice(COLOMBIA_CODE.length)
      : digits;

    if (national.length !== MOBILE_LENGTH) {
      throw new ValidationError('El celular debe tener 10 dígitos. Ejemplo: 318 017 3770.');
    }
    if (!national.startsWith('3')) {
      throw new ValidationError('El celular colombiano debe empezar por 3.');
    }

    return new PhoneNumber(`${COLOMBIA_CODE}${national}`);
  }

  /** "318 017 3770" — para mostrar en pantalla. */
  format(): string {
    const n = this.national;
    return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  }

  get national(): string {
    return this.e164.slice(COLOMBIA_CODE.length);
  }

  toString(): string {
    return this.e164;
  }
}
