/** Puertos del módulo de pedidos. */

import type { Order } from './order';
import type { OrderCode } from './order-code';
import type { OrderStatus } from './order-status';

export interface OrderQuery {
  readonly status?: OrderStatus;
  readonly search?: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly limit?: number;
}

/** Cifras agregadas para el tablero del panel. */
export interface SalesSummary {
  readonly ordersToday: number;
  readonly revenueToday: number;
  readonly pendingCount: number;
  readonly inKitchenCount: number;
  readonly revenueLast30Days: number;
  readonly topProducts: readonly { productName: string; unitsSold: number }[];
}

export interface OrderReader {
  findByCode(code: OrderCode): Promise<Order | null>;
  findById(id: string): Promise<Order | null>;
  findAll(query?: OrderQuery): Promise<Order[]>;
  existsWithCode(code: OrderCode): Promise<boolean>;
  summarize(now: Date): Promise<SalesSummary>;
}

export interface OrderWriter {
  save(order: Order): Promise<void>;
}

export interface OrderRepository extends OrderReader, OrderWriter {}
