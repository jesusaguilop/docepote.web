/**
 * Cómo recibe el cliente su pedido, y cuánto cuesta eso.
 *
 * `DeliveryPolicy` es un objeto de valor configurable: la tarifa y el umbral
 * de envío gratis llegan desde configuración, no están quemados en el código.
 * Si mañana hay domicilio gratis por encima de otro monto, cambia el .env.
 */

import { Money, COP } from '../shared/money';
import { ValidationError } from '../shared/errors';

export const FULFILLMENT_METHODS = ['pickup', 'delivery'] as const;
export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number];

export const FULFILLMENT_LABELS: Readonly<Record<FulfillmentMethod, string>> = Object.freeze({
  pickup: 'Recoger en el punto',
  delivery: 'Domicilio en Valledupar',
});

export function parseFulfillmentMethod(value: string): FulfillmentMethod {
  if (!(FULFILLMENT_METHODS as readonly string[]).includes(value)) {
    throw new ValidationError(`"${value}" no es un método de entrega válido.`);
  }
  return value as FulfillmentMethod;
}

export class DeliveryPolicy {
  private constructor(
    readonly fee: Money,
    readonly freeThreshold: Money,
  ) {
    Object.freeze(this);
  }

  static of(feeAmount: number, freeThresholdAmount: number): DeliveryPolicy {
    return new DeliveryPolicy(Money.of(feeAmount, COP), Money.of(freeThresholdAmount, COP));
  }

  /** Cuánto se cobra por llevar un pedido de este subtotal. */
  feeFor(method: FulfillmentMethod, subtotal: Money): Money {
    if (method === 'pickup') return Money.zero(subtotal.currency);
    if (this.qualifiesForFreeDelivery(subtotal)) return Money.zero(subtotal.currency);
    return this.fee;
  }

  qualifiesForFreeDelivery(subtotal: Money): boolean {
    return !this.freeThreshold.isZero() && subtotal.isGreaterThanOrEqual(this.freeThreshold);
  }

  /** Cuánto le falta al cliente para el domicilio gratis. `null` si ya llegó. */
  amountMissingForFreeDelivery(subtotal: Money): Money | null {
    if (this.freeThreshold.isZero() || this.qualifiesForFreeDelivery(subtotal)) return null;
    return this.freeThreshold.minus(subtotal);
  }
}
