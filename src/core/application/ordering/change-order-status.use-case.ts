/**
 * Mueve un pedido por la línea de producción.
 *
 * El caso de uso no decide qué transiciones son válidas: se lo pregunta al
 * agregado (`order.transitionTo`). Si mañana aparece un estado "en camino",
 * se agrega en la máquina de estados del dominio y el panel lo muestra solo.
 *
 * Cancelar devuelve al inventario lo que el pedido había descontado al
 * crearse. "Cancelado" es final, así que esto pasa una sola vez por pedido.
 */

import type { OrderRepository } from '@core/domain/ordering/order.repository';
import type { ProductWriter } from '@core/domain/catalog/product.repository';
import { parseOrderStatus } from '@core/domain/ordering/order-status';
import { NotFoundError, isDomainError, type DomainError } from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';
import { toOrderDTO, type OrderDTO } from '../dto/order.dto';
import type { Clock } from '../ports/clock';
import type { TransactionRunner } from '../ports/transaction-runner';

export interface ChangeOrderStatusInput {
  readonly orderId: string;
  readonly status: string;
}

export class ChangeOrderStatusUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: Pick<ProductWriter, 'releaseStock'>,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  async execute(input: ChangeOrderStatusInput): Promise<Result<OrderDTO, DomainError>> {
    try {
      const order = await this.orders.findById(input.orderId);
      if (!order) return Err(new NotFoundError('el pedido', input.orderId));

      const updated = order.transitionTo(parseOrderStatus(input.status), this.clock.now());
      const restock = updated.status === 'cancelled' && order.status !== 'cancelled';

      await this.transactions.run(async () => {
        await this.orders.save(updated);
        if (!restock) return;
        for (const line of updated.lines) {
          await this.products.releaseStock(line.productId, line.quantity.value);
        }
      });

      return Ok(toOrderDTO(updated));
    } catch (error) {
      if (isDomainError(error)) return Err(error);
      throw error;
    }
  }
}
