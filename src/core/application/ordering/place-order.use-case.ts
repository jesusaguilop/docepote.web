/**
 * PlaceOrderUseCase — convierte un carrito en un pedido real.
 *
 * Es el corazón transaccional de la tienda y concentra las reglas que NO
 * pueden vivir en el navegador:
 *
 *  1. Los precios se releen del catálogo. Lo que manda el cliente es solo
 *     "qué producto y cuántos"; cuánto cuesta lo decide el servidor.
 *  2. Se verifica disponibilidad real contra el inventario del momento.
 *  3. El costo de domicilio lo calcula `DeliveryPolicy`, no el formulario.
 *  4. Todo se escribe dentro de una transacción: o queda el pedido con su
 *     stock descontado, o no queda nada.
 *  5. El cobro se delega al `PaymentGateway` inyectado, así que este código
 *     es idéntico con WhatsApp o con Wompi.
 */

import { Order, type PaymentMethod } from '@core/domain/ordering/order';
import { OrderLine } from '@core/domain/ordering/order-line';
import { OrderCode } from '@core/domain/ordering/order-code';
import { Customer, type CustomerInput } from '@core/domain/ordering/customer';
import {
  parseFulfillmentMethod,
  type DeliveryPolicy,
} from '@core/domain/ordering/fulfillment';
import { Cart, type CartItem } from '@core/domain/ordering/cart';
import { Quantity } from '@core/domain/shared/quantity';
import type { OrderRepository } from '@core/domain/ordering/order.repository';
import type { ProductRepository } from '@core/domain/catalog/product.repository';
import {
  UnavailableError,
  ValidationError,
  isDomainError,
  type DomainError,
} from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';
import { toOrderDTO, type OrderDTO } from '../dto/order.dto';
import type { Clock } from '../ports/clock';
import type { IdGenerator } from '../ports/id-generator';
import type { PaymentGateway, PaymentInstruction } from '../ports/payment-gateway';
import type { TransactionRunner } from '../ports/transaction-runner';

export interface PlaceOrderInput {
  readonly items: readonly CartItem[];
  readonly customer: CustomerInput;
  readonly fulfillmentMethod: string;
}

export interface PlaceOrderOutput {
  readonly order: OrderDTO;
  readonly payment: PaymentInstruction;
}

/** Cuántas veces reintentar si el código aleatorio ya estaba tomado. */
const MAX_CODE_ATTEMPTS = 8;

export class PlaceOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
    private readonly deliveryPolicy: DeliveryPolicy,
    private readonly payments: PaymentGateway,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: PlaceOrderInput): Promise<Result<PlaceOrderOutput, DomainError>> {
    try {
      const cart = Cart.fromItems(input.items);
      if (cart.isEmpty) {
        return Err(new ValidationError('Tu carrito está vacío — agrega al menos un pote.'));
      }

      const method = parseFulfillmentMethod(input.fulfillmentMethod);
      const customer = Customer.of(input.customer, method);

      // Una sola consulta para todos los productos del carrito (evita N+1).
      const catalog = await this.products.findManyByIds(cart.productIds);
      const byId = new Map(catalog.map((product) => [product.id, product]));

      const lines: OrderLine[] = [];
      const unavailable: string[] = [];

      for (const { productId, quantity } of cart.toItems()) {
        const product = byId.get(productId);

        // Un producto que ya no existe o fue despublicado no bloquea el pedido
        // con un error críptico: se reporta por nombre al final.
        if (!product || !product.active) {
          unavailable.push(product?.name ?? 'un producto que ya no está disponible');
          continue;
        }
        if (!product.canFulfill(quantity)) {
          unavailable.push(`${product.name} (quedan ${product.stock ?? 0})`);
          continue;
        }

        lines.push(OrderLine.fromProduct(product, Quantity.of(quantity)));
      }

      if (unavailable.length > 0) {
        return Err(
          new UnavailableError(
            `Se nos acabaron algunas cosas mientras armabas el pedido: ${unavailable.join(', ')}.`,
            { productos: unavailable.join(', ') },
          ),
        );
      }

      const now = this.clock.now();
      const code = await this.generateUniqueCode();

      const order = Order.place({
        id: this.ids.generate(),
        code,
        customer,
        fulfillmentMethod: method,
        lines,
        deliveryPolicy: this.deliveryPolicy,
        paymentMethod: this.payments.method as PaymentMethod,
        now,
      });

      // Pedido y descuento de inventario viajan juntos o no viajan.
      await this.transactions.run(async () => {
        await this.orders.save(order);
        for (const line of order.lines) {
          const product = byId.get(line.productId);
          if (!product || product.stock === null) continue;
          await this.products.save(product.withStockReduced(line.quantity.value));
        }
      });

      const payment = await this.payments.prepare(order);

      return Ok({ order: toOrderDTO(order), payment });
    } catch (error) {
      if (isDomainError(error)) return Err(error);
      throw error;
    }
  }

  /** Vuelve a sortear si el código ya existe; tras varios intentos, se rinde. */
  private async generateUniqueCode(): Promise<OrderCode> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const candidate = OrderCode.generate();
      if (!(await this.orders.existsWithCode(candidate))) return candidate;
    }
    throw new ValidationError('No pudimos generar un código de pedido. Intenta de nuevo.');
  }
}
