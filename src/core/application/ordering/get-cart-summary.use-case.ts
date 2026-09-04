/**
 * Valora el carrito en el servidor.
 *
 * El navegador solo guarda ids y cantidades; esta consulta les pone precio,
 * detecta lo que se agotó mientras el cliente decidía y calcula el domicilio
 * con la misma `DeliveryPolicy` que usará el pedido final. Así lo que se ve
 * en el resumen es exactamente lo que se va a cobrar.
 */

import { Cart, type CartItem } from '@core/domain/ordering/cart';
import type { ProductReader } from '@core/domain/catalog/product.repository';
import type { FlavorReader } from '@core/domain/catalog/flavor.repository';
import { loadFlavorIndex } from '../catalog/flavor-index';
import type { DeliveryPolicy, FulfillmentMethod } from '@core/domain/ordering/fulfillment';
import { parseFulfillmentMethod } from '@core/domain/ordering/fulfillment';
import { Money } from '@core/domain/shared/money';
import { Ok, type Result } from '@core/domain/shared/result';
import type { DomainError } from '@core/domain/shared/errors';
import { toProductDTO, type ProductDTO } from '../dto/product.dto';

export interface CartLineDTO {
  readonly product: ProductDTO;
  readonly quantity: number;
  readonly subtotal: number;
  readonly subtotalFormatted: string;
  /** El stock ya no alcanza para la cantidad pedida. */
  readonly exceedsStock: boolean;
  readonly maxAvailable: number | null;
}

export interface CartSummaryDTO {
  readonly lines: readonly CartLineDTO[];
  /** Productos del carrito que desaparecieron o se despublicaron. */
  readonly removedProductIds: readonly string[];
  readonly itemCount: number;
  readonly subtotal: number;
  readonly subtotalFormatted: string;
  readonly deliveryFee: number;
  readonly deliveryFeeFormatted: string;
  readonly total: number;
  readonly totalFormatted: string;
  readonly fulfillmentMethod: FulfillmentMethod;
  readonly freeDelivery: boolean;
  /** Cuánto falta para el domicilio gratis; `null` si ya aplica o no hay promo. */
  readonly missingForFreeDeliveryFormatted: string | null;
  readonly hasBlockingIssues: boolean;
}

export interface GetCartSummaryInput {
  readonly items: readonly CartItem[];
  readonly fulfillmentMethod?: string;
}

export class GetCartSummaryUseCase {
  constructor(
    private readonly products: ProductReader,
    private readonly flavors: FlavorReader,
    private readonly deliveryPolicy: DeliveryPolicy,
  ) {}

  async execute(input: GetCartSummaryInput): Promise<Result<CartSummaryDTO, DomainError>> {
    const cart = Cart.fromItems(input.items);
    const method = this.resolveMethod(input.fulfillmentMethod);

    const found = await this.products.findManyByIds(cart.productIds);
    const byId = new Map(found.map((product) => [product.id, product]));
    const flavorsById = await loadFlavorIndex(this.flavors, found);

    const lines: CartLineDTO[] = [];
    const removedProductIds: string[] = [];

    for (const { productId, quantity } of cart.toItems()) {
      const product = byId.get(productId);
      if (!product || !product.active) {
        removedProductIds.push(productId);
        continue;
      }

      const subtotal = product.price.times(quantity);
      lines.push({
        product: toProductDTO(
          product,
          product.flavorId ? flavorsById.get(product.flavorId) ?? null : null,
        ),
        quantity,
        subtotal: subtotal.amount,
        subtotalFormatted: subtotal.format(),
        exceedsStock: !product.canFulfill(quantity),
        maxAvailable: product.stock,
      });
    }

    const subtotal = lines.reduce<Money>(
      (total, line) => total.plus(Money.of(line.subtotal)),
      Money.zero(),
    );
    const deliveryFee = this.deliveryPolicy.feeFor(method, subtotal);
    const total = subtotal.plus(deliveryFee);
    const missing = method === 'delivery'
      ? this.deliveryPolicy.amountMissingForFreeDelivery(subtotal)
      : null;

    return Ok({
      lines,
      removedProductIds,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: subtotal.amount,
      subtotalFormatted: subtotal.format(),
      deliveryFee: deliveryFee.amount,
      // "Gratis" solo tiene sentido si de verdad había un domicilio que
      // regalar; cuando el cliente recoge, no hay envío en la ecuación.
      deliveryFeeFormatted: formatDeliveryFee(method, deliveryFee),
      total: total.amount,
      totalFormatted: total.format(),
      fulfillmentMethod: method,
      freeDelivery: method === 'delivery' && deliveryFee.isZero(),
      missingForFreeDeliveryFormatted: missing ? missing.format() : null,
      hasBlockingIssues: removedProductIds.length > 0 || lines.some((line) => line.exceedsStock),
    });
  }

  /** Un método inválido cae a "recoger", que nunca cobra de más. */
  private resolveMethod(raw: string | undefined): FulfillmentMethod {
    if (!raw) return 'pickup';
    try {
      return parseFulfillmentMethod(raw);
    } catch {
      return 'pickup';
    }
  }
}

/** Cómo se muestra el costo de entrega según lo que eligió el cliente. */
function formatDeliveryFee(method: FulfillmentMethod, fee: Money): string {
  if (method === 'pickup') return 'Sin costo';
  return fee.isZero() ? 'Gratis' : fee.format();
}
