/**
 * Mueve un pedido por la línea de producción.
 *
 * El caso de uso no decide qué transiciones son válidas: se lo pregunta al
 * agregado (`order.transitionTo`). Si mañana aparece un estado "en camino",
 * se agrega en la máquina de estados del dominio y el panel lo muestra solo.
 */

import type { OrderRepository } from '@core/domain/ordering/order.repository';
import { parseOrderStatus } from '@core/domain/ordering/order-status';
import { NotFoundError, isDomainError, type DomainError } from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';
import { toOrderDTO, type OrderDTO } from '../dto/order.dto';
import type { Clock } from '../ports/clock';

export interface ChangeOrderStatusInput {
  readonly orderId: string;
  readonly status: string;
}

export class ChangeOrderStatusUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ChangeOrderStatusInput): Promise<Result<OrderDTO, DomainError>> {
    try {
      const order = await this.orders.findById(input.orderId);
      if (!order) return Err(new NotFoundError('el pedido', input.orderId));

      const updated = order.transitionTo(parseOrderStatus(input.status), this.clock.now());
      await this.orders.save(updated);

      return Ok(toOrderDTO(updated));
    } catch (error) {
      if (isDomainError(error)) return Err(error);
      throw error;
    }
  }
}
