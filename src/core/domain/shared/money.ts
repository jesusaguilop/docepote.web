/**
 * Money — objeto de valor inmutable.
 *
 * Regla del proyecto: el dinero SIEMPRE viaja como entero en la unidad
 * mínima de la moneda. Para el peso colombiano (COP) esa unidad es el peso:
 * el centavo no circula, así que `COP.decimals = 0` y `amount` son pesos
 * enteros. Nunca uses `number` con decimales para precios.
 */

import { ValidationError } from './errors';

export interface Currency {
  readonly code: 'COP';
  readonly symbol: string;
  readonly decimals: number;
  readonly locale: string;
}

export const COP: Currency = Object.freeze({
  code: 'COP',
  symbol: '$',
  decimals: 0,
  locale: 'es-CO',
});

export class Money {
  private constructor(
    readonly amount: number,
    readonly currency: Currency,
  ) {
    Object.freeze(this);
  }

  static of(amount: number, currency: Currency = COP): Money {
    if (!Number.isFinite(amount)) {
      throw new ValidationError('El monto debe ser un número válido.');
    }
    if (!Number.isInteger(amount)) {
      throw new ValidationError('El monto debe ser un entero en la unidad mínima de la moneda.');
    }
    if (amount < 0) {
      throw new ValidationError('El monto no puede ser negativo.');
    }
    return new Money(amount, currency);
  }

  static zero(currency: Currency = COP): Money {
    return new Money(0, currency);
  }

  plus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  minus(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount - other.amount, this.currency);
  }

  times(factor: number): Money {
    if (!Number.isInteger(factor) || factor < 0) {
      throw new ValidationError('El multiplicador debe ser un entero no negativo.');
    }
    return new Money(this.amount * factor, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount >= other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency.code === other.currency.code;
  }

  /** Representación legible: "$9.500" */
  format(): string {
    return new Intl.NumberFormat(this.currency.locale, {
      style: 'currency',
      currency: this.currency.code,
      minimumFractionDigits: this.currency.decimals,
      maximumFractionDigits: this.currency.decimals,
    })
      .format(this.amount)
      // Intl agrega un espacio duro tras el símbolo en es-CO; lo quitamos
      // para respetar el estilo de la marca ("$9.500", no "$ 9.500").
      .replace(/ /g, '');
  }

  toJSON(): { amount: number; currency: string; formatted: string } {
    return { amount: this.amount, currency: this.currency.code, formatted: this.format() };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency.code !== other.currency.code) {
      throw new ValidationError(
        `No se pueden operar montos en monedas distintas (${this.currency.code} vs ${other.currency.code}).`,
      );
    }
  }
}
