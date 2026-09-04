/** Consultas de pedidos: seguimiento del cliente y bandeja del panel. */

import type { OrderReader, OrderQuery, SalesSummary } from '@core/domain/ordering/order.repository';
import { OrderCode } from '@core/domain/ordering/order-code';
import { isOrderStatus } from '@core/domain/ordering/order-status';
import { NotFoundError, type DomainError } from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';
import { toOrderDTO, toOrderDTOs, type OrderDTO } from '../dto/order.dto';
import { Money } from '@core/domain/shared/money';
import type { Clock } from '../ports/clock';

/** Página pública de seguimiento: el cliente entra con su código "DP-7K2M". */
export class GetOrderByCodeUseCase {
  constructor(private readonly orders: OrderReader) {}

  async execute(rawCode: string): Promise<Result<OrderDTO, DomainError>> {
    let code: OrderCode;
    try {
      code = OrderCode.of(rawCode);
    } catch {
      return Err(new NotFoundError('el pedido', rawCode));
    }

    const order = await this.orders.findByCode(code);
    if (!order) return Err(new NotFoundError('el pedido', rawCode));

    return Ok(toOrderDTO(order));
  }
}

export interface ListOrdersInput {
  readonly status?: string;
  readonly search?: string;
  readonly limit?: number;
}

export class ListOrdersUseCase {
  constructor(private readonly orders: OrderReader) {}

  async execute(input: ListOrdersInput = {}): Promise<Result<OrderDTO[], DomainError>> {
    const query: OrderQuery = {
      ...(input.status && isOrderStatus(input.status) ? { status: input.status } : {}),
      ...(input.search?.trim() ? { search: input.search.trim() } : {}),
      limit: input.limit ?? 100,
    };

    return Ok(toOrderDTOs(await this.orders.findAll(query)));
  }
}

export interface SalesSummaryDTO {
  readonly ordersToday: number;
  readonly revenueTodayFormatted: string;
  readonly pendingCount: number;
  readonly inKitchenCount: number;
  readonly revenueLast30DaysFormatted: string;
  readonly topProducts: readonly { productName: string; unitsSold: number }[];
}

/** Cifras del tablero. Formatea aquí para que la UI no cargue con `Money`. */
export class GetSalesSummaryUseCase {
  constructor(
    private readonly orders: OrderReader,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<Result<SalesSummaryDTO, DomainError>> {
    const summary: SalesSummary = await this.orders.summarize(this.clock.now());

    return Ok({
      ordersToday: summary.ordersToday,
      revenueTodayFormatted: Money.of(summary.revenueToday).format(),
      pendingCount: summary.pendingCount,
      inKitchenCount: summary.inKitchenCount,
      revenueLast30DaysFormatted: Money.of(summary.revenueLast30Days).format(),
      topProducts: summary.topProducts,
    });
  }
}
