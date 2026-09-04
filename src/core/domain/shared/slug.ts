/** Slug — identificador legible y estable para URLs de producto. */

import { ValidationError } from './errors';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Marcas diacríticas combinantes que deja `normalize('NFD')` al separar tildes. */
const COMBINING_MARKS = /\p{M}/gu;

export class Slug {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static of(value: string): Slug {
    const normalized = value.trim().toLowerCase();
    if (!SLUG_PATTERN.test(normalized)) {
      throw new ValidationError(`"${value}" no es un slug válido.`);
    }
    return new Slug(normalized);
  }

  /** Genera un slug a partir de texto libre: "Bolo no pote · Maracuyá" → "bolo-no-pote-maracuya" */
  static fromText(text: string): Slug {
    const normalized = text
      .normalize('NFD')
      .replace(COMBINING_MARKS, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!normalized) {
      throw new ValidationError('No se pudo generar un slug a partir del texto dado.');
    }
    return new Slug(normalized);
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
