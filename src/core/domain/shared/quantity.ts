/** Quantity — entero acotado; evita carritos con 0, negativos o cantidades absurdas. */

import { ValidationError } from './errors';

export const MAX_QUANTITY_PER_LINE = 50;

export class Quantity {
  private constructor(readonly value: number) {
    Object.freeze(this);
  }

  static of(value: number): Quantity {
    if (!Number.isInteger(value)) {
      throw new ValidationError('La cantidad debe ser un número entero.');
    }
    if (value < 1) {
      throw new ValidationError('La cantidad mínima es 1.');
    }
    if (value > MAX_QUANTITY_PER_LINE) {
      throw new ValidationError(
        `Para pedidos de más de ${MAX_QUANTITY_PER_LINE} unidades escríbenos por WhatsApp y lo coordinamos.`,
      );
    }
    return new Quantity(value);
  }

  plus(amount: number): Quantity {
    return Quantity.of(this.value + amount);
  }

  toString(): string {
    return String(this.value);
  }
}
