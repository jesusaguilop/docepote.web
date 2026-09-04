/**
 * Estado del pedido y sus transiciones legales.
 *
 * La máquina de estados vive aquí y no en la UI: el panel de administración
 * pregunta `allowedTransitionsFrom()` para pintar botones, en lugar de tener
 * su propia copia de las reglas.
 */

import { ValidationError } from '../shared/errors';

export const ORDER_STATUSES = [
  'pending',    // creado, esperando que el negocio lo confirme
  'confirmed',  // confirmado con el cliente
  'preparing',  // en cocina
  'ready',      // listo para recoger o despachar
  'delivered',  // entregado
  'cancelled',  // cancelado
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Readonly<Record<OrderStatus, string>> = Object.freeze({
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
});

const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = Object.freeze({
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
});

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function parseOrderStatus(value: string): OrderStatus {
  if (!isOrderStatus(value)) {
    throw new ValidationError(`"${value}" no es un estado de pedido válido.`);
  }
  return value;
}

export function allowedTransitionsFrom(status: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Un pedido cerrado ya no cuenta para la cocina ni admite cambios. */
export function isFinalStatus(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
