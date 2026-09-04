/**
 * Order — raíz de agregado del módulo de pedidos.
 *
 * Es el guardián de las invariantes: un pedido no puede existir vacío, sus
 * totales siempre cuadran con sus líneas (se calculan, nunca se reciben desde
 * fuera) y solo cambia de estado por transiciones legales.
 */

import { Money } from '../shared/money';
import { ValidationError } from '../shared/errors';
import { ConflictError } from '../shared/errors';
import type { Customer } from './customer';
import type { OrderLine } from './order-line';
import { OrderCode } from './order-code';
import type { DeliveryPolicy, FulfillmentMethod } from './fulfillment';
import { canTransition, type OrderStatus } from './order-status';

export const PAYMENT_METHODS = ['whatsapp', 'wompi'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface OrderProps {
  readonly id: string;
  readonly code: OrderCode;
  readonly status: OrderStatus;
  readonly customer: Customer;
  readonly fulfillmentMethod: FulfillmentMethod;
  readonly lines: readonly OrderLine[];
  readonly deliveryFee: Money;
  readonly paymentMethod: PaymentMethod;
  readonly paymentReference: string | null;
  readonly placedAt: Date;
  readonly updatedAt: Date;
}

export class Order {
  readonly id: string;
  readonly code: OrderCode;
  readonly status: OrderStatus;
  readonly customer: Customer;
  readonly fulfillmentMethod: FulfillmentMethod;
  readonly lines: readonly OrderLine[];
  readonly deliveryFee: Money;
  readonly paymentMethod: PaymentMethod;
  readonly paymentReference: string | null;
  readonly placedAt: Date;
  readonly updatedAt: Date;

  private constructor(props: OrderProps) {
    this.id = props.id;
    this.code = props.code;
    this.status = props.status;
    this.customer = props.customer;
    this.fulfillmentMethod = props.fulfillmentMethod;
    this.lines = Object.freeze([...props.lines]);
    this.deliveryFee = props.deliveryFee;
    this.paymentMethod = props.paymentMethod;
    this.paymentReference = props.paymentReference;
    this.placedAt = props.placedAt;
    this.updatedAt = props.updatedAt;
    Object.freeze(this);
  }

  /**
   * Crea un pedido nuevo. El costo de envío no se recibe: lo calcula la
   * política a partir del subtotal, así que el cliente no puede manipularlo.
   */
  static place(params: {
    id: string;
    code: OrderCode;
    customer: Customer;
    fulfillmentMethod: FulfillmentMethod;
    lines: readonly OrderLine[];
    deliveryPolicy: DeliveryPolicy;
    paymentMethod: PaymentMethod;
    now: Date;
  }): Order {
    if (params.lines.length === 0) {
      throw new ValidationError('Tu carrito está vacío — agrega al menos un pote.');
    }

    const subtotal = Order.sumLines(params.lines);
    const deliveryFee = params.deliveryPolicy.feeFor(params.fulfillmentMethod, subtotal);

    return new Order({
      id: params.id,
      code: params.code,
      status: 'pending',
      customer: params.customer,
      fulfillmentMethod: params.fulfillmentMethod,
      lines: params.lines,
      deliveryFee,
      paymentMethod: params.paymentMethod,
      paymentReference: null,
      placedAt: params.now,
      updatedAt: params.now,
    });
  }

  /** Reconstruye un pedido desde persistencia sin volver a aplicar reglas de creación. */
  static rehydrate(props: OrderProps): Order {
    return new Order(props);
  }

  get subtotal(): Money {
    return Order.sumLines(this.lines);
  }

  get total(): Money {
    return this.subtotal.plus(this.deliveryFee);
  }

  get itemCount(): number {
    return this.lines.reduce((sum, line) => sum + line.quantity.value, 0);
  }

  get hasFreeDelivery(): boolean {
    return this.fulfillmentMethod === 'delivery' && this.deliveryFee.isZero();
  }

  /** Cambia de estado si la transición es legal; si no, falla explícitamente. */
  transitionTo(next: OrderStatus, now: Date): Order {
    if (next === this.status) return this;
    if (!canTransition(this.status, next)) {
      throw new ConflictError(
        `Un pedido "${this.status}" no puede pasar a "${next}".`,
        { estadoActual: this.status, estadoSolicitado: next },
      );
    }
    return new Order({ ...this.toProps(), status: next, updatedAt: now });
  }

  /** Anota la referencia que devolvió la pasarela (id de transacción de Wompi, etc.). */
  withPaymentReference(reference: string, now: Date): Order {
    return new Order({ ...this.toProps(), paymentReference: reference, updatedAt: now });
  }

  toProps(): OrderProps {
    return {
      id: this.id,
      code: this.code,
      status: this.status,
      customer: this.customer,
      fulfillmentMethod: this.fulfillmentMethod,
      lines: this.lines,
      deliveryFee: this.deliveryFee,
      paymentMethod: this.paymentMethod,
      paymentReference: this.paymentReference,
      placedAt: this.placedAt,
      updatedAt: this.updatedAt,
    };
  }

  private static sumLines(lines: readonly OrderLine[]): Money {
    return lines.reduce<Money>(
      (total, line) => total.plus(line.subtotal),
      Money.zero(),
    );
  }
}
