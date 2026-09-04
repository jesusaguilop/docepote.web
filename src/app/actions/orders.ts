'use server';

/** Acciones de pedidos de cara al cliente. */

import { container } from '@infra/container';
import { guard, type ActionResult } from '@/lib/action-result';
import type { CartItem } from '@core/domain/ordering/cart';
import type { PlaceOrderOutput } from '@core/application/ordering/place-order.use-case';

export interface CheckoutFormData {
  readonly name: string;
  readonly phone: string;
  readonly address: string;
  readonly notes: string;
  readonly fulfillmentMethod: string;
}

/**
 * Cierra el pedido.
 *
 * Devuelve, además del pedido creado, la instrucción de pago: hoy es la URL
 * de WhatsApp; con Wompi activo sería la del checkout de la pasarela. La UI
 * solo obedece la instrucción, no sabe cuál pasarela está detrás.
 */
export async function placeOrder(
  items: CartItem[],
  form: CheckoutFormData,
): Promise<ActionResult<PlaceOrderOutput>> {
  return guard(() =>
    container().ordering.placeOrder.execute({
      items,
      fulfillmentMethod: form.fulfillmentMethod,
      customer: {
        name: form.name,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
      },
    }),
  );
}
