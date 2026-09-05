'use server';

/**
 * Acciones del carrito.
 *
 * El navegador solo guarda ids y cantidades; para saber cuánto cuesta pregunta
 * aquí. Así el precio siempre sale de la base de datos y el resumen refleja
 * el stock real en ese instante.
 */

import { container } from '@infra/container';
import { getLocale } from '@/lib/i18n/server';
import { guard, type ActionResult } from '@/lib/action-result';
import type { CartItem } from '@core/domain/ordering/cart';
import type { CartSummaryDTO } from '@core/application/ordering/get-cart-summary.use-case';

export async function getCartSummary(
  items: CartItem[],
  fulfillmentMethod?: string,
): Promise<ActionResult<CartSummaryDTO>> {
  // El idioma sale de la cookie aquí mismo: el cliente no tiene que
  // acordarse de mandarlo, y así no puede quedar desincronizado.
  const locale = await getLocale();

  return guard(() =>
    container().ordering.cartSummary.execute({ items, fulfillmentMethod, locale }),
  );
}
