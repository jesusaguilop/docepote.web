/** DTOs de pedidos: la vista serializable de un `Order`. */

import type { Order } from '@core/domain/ordering/order';
import type { OrderStatus } from '@core/domain/ordering/order-status';
import type { FulfillmentMethod } from '@core/domain/ordering/fulfillment';
import { ORDER_STATUS_LABELS, allowedTransitionsFrom } from '@core/domain/ordering/order-status';
import { FULFILLMENT_LABELS } from '@core/domain/ordering/fulfillment';

export interface OrderLineDTO {
  readonly productId: string;
  readonly productName: string;
  readonly productSlug: string;
  readonly unitPrice: number;
  readonly unitPriceFormatted: string;
  readonly quantity: number;
  readonly subtotal: number;
  readonly subtotalFormatted: string;
  readonly art: { readonly fillColor: string; readonly pattern: string };
}

export interface OrderDTO {
  readonly id: string;
  readonly code: string;
  readonly status: OrderStatus;
  readonly statusLabel: string;
  /** Transiciones legales desde el estado actual: el panel pinta un botón por cada una. */
  readonly nextStatuses: readonly { value: OrderStatus; label: string }[];
  readonly customer: {
    readonly name: string;
    readonly phone: string;
    readonly phoneFormatted: string;
    readonly address: string | null;
    readonly notes: string | null;
  };
  readonly fulfillmentMethod: FulfillmentMethod;
  readonly fulfillmentLabel: string;
  readonly lines: readonly OrderLineDTO[];
  readonly itemCount: number;
  readonly subtotal: number;
  readonly subtotalFormatted: string;
  readonly deliveryFee: number;
  readonly deliveryFeeFormatted: string;
  readonly hasFreeDelivery: boolean;
  readonly total: number;
  readonly totalFormatted: string;
  readonly paymentMethod: string;
  readonly paymentReference: string | null;
  readonly placedAt: string;
  readonly updatedAt: string;
}

export function toOrderDTO(order: Order): OrderDTO {
  return {
    id: order.id,
    code: order.code.value,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    nextStatuses: allowedTransitionsFrom(order.status).map((value) => ({
      value,
      label: ORDER_STATUS_LABELS[value],
    })),
    customer: {
      name: order.customer.name,
      phone: order.customer.phone.e164,
      phoneFormatted: order.customer.phone.format(),
      address: order.customer.address,
      notes: order.customer.notes,
    },
    fulfillmentMethod: order.fulfillmentMethod,
    fulfillmentLabel: FULFILLMENT_LABELS[order.fulfillmentMethod],
    lines: order.lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      productSlug: line.productSlug,
      unitPrice: line.unitPrice.amount,
      unitPriceFormatted: line.unitPrice.format(),
      quantity: line.quantity.value,
      subtotal: line.subtotal.amount,
      subtotalFormatted: line.subtotal.format(),
      art: { fillColor: line.art.fillColor, pattern: line.art.pattern },
    })),
    itemCount: order.itemCount,
    subtotal: order.subtotal.amount,
    subtotalFormatted: order.subtotal.format(),
    deliveryFee: order.deliveryFee.amount,
    deliveryFeeFormatted:
      order.fulfillmentMethod === 'pickup'
        ? 'Sin costo'
        : order.deliveryFee.isZero()
          ? 'Gratis'
          : order.deliveryFee.format(),
    hasFreeDelivery: order.hasFreeDelivery,
    total: order.total.amount,
    totalFormatted: order.total.format(),
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    placedAt: order.placedAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export const toOrderDTOs = (orders: readonly Order[]): OrderDTO[] => orders.map(toOrderDTO);
