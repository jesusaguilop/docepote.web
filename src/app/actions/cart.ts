'use server';

/**
 * Acciones del carrito.
 *
 * El navegador solo guarda ids y cantidades; para saber cuánto cuesta pregunta
 * aquí. Así el precio siempre sale de la base de datos y el resumen refleja
 * el stock real en ese instante.
 */

import { container } from '@infra/container';
import { guard, type ActionResult } from '@/lib/action-result';
import type { CartItem } from '@core/domain/ordering/cart';
import type { CartSummaryDTO } from '@core/application/ordering/get-cart-summary.use-case';

export async function getCartSummary(
  items: CartItem[],
  fulfillmentMethod?: string,
): Promise<ActionResult<CartSummaryDTO>> {
  return guard(() =>
    container().ordering.cartSummary.execute({ items, fulfillmentMethod }),
  );
}
