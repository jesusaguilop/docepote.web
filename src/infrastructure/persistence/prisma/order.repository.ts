/** Implementación de pedidos sobre Prisma. */

import type { Prisma } from '@prisma/client';
import type { Order } from '@core/domain/ordering/order';
import type {
  OrderRepository,
  OrderQuery,
  SalesSummary,
} from '@core/domain/ordering/order.repository';
import type { OrderCode } from '@core/domain/ordering/order-code';
import { db } from './client';
import { toOrderEntity, toOrderRow, toOrderLineRows } from './mappers';

/** Estados que siguen ocupando a la cocina. */
const ACTIVE_KITCHEN_STATUSES = ['confirmed', 'preparing'];

export class PrismaOrderRepository implements OrderRepository {
  async findByCode(code: OrderCode): Promise<Order | null> {
    const row = await db().order.findUnique({
      where: { code: code.value },
      include: { lines: true },
    });
    return row ? toOrderEntity(row) : null;
  }

  async findById(id: string): Promise<Order | null> {
    const row = await db().order.findUnique({ where: { id }, include: { lines: true } });
    return row ? toOrderEntity(row) : null;
  }

  async findAll(query: OrderQuery = {}): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.placedAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search.toUpperCase() } },
        { customerName: { contains: query.search } },
        { customerPhone: { contains: query.search.replace(/\D/g, '') } },
      ];
    }

    const rows = await db().order.findMany({
      where,
      include: { lines: true },
      orderBy: { placedAt: 'desc' },
      take: query.limit ?? 100,
    });

    return rows.map(toOrderEntity);
  }

  async existsWithCode(code: OrderCode): Promise<boolean> {
    const found = await db().order.findUnique({
      where: { code: code.value },
      select: { id: true },
    });
    return found !== null;
  }

  /**
   * Guarda el pedido.
   *
   * Las líneas solo se escriben al crearlo: una vez hecho el pedido, el
   * agregado no ofrece ninguna forma de cambiarlas (ver `Order` — no hay
   * `addLine` ni nada parecido). Lo que sí cambia después es el estado y la
   * referencia de pago, y eso es lo único que toca el `update`.
   */
  async save(order: Order): Promise<void> {
    const data = toOrderRow(order);

    await db().order.upsert({
      where: { id: order.id },
      create: { ...data, lines: { create: toOrderLineRows(order) } },
      update: data,
    });
  }

  /**
   * Cifras del tablero. Se calculan con agregaciones en la base y no trayendo
   * todos los pedidos a memoria: es la diferencia entre un panel que abre al
   * instante y uno que se arrastra cuando haya miles de pedidos.
   */
  async summarize(now: Date): Promise<SalesSummary> {
    const client = db();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const notCancelled: Prisma.OrderWhereInput = { status: { not: 'cancelled' } };

    const [todayOrders, pendingCount, inKitchenCount, last30Orders, topLines] = await Promise.all([
      client.order.findMany({
        where: { ...notCancelled, placedAt: { gte: startOfToday } },
        select: { deliveryFee: true, lines: { select: { unitPrice: true, quantity: true } } },
      }),
      client.order.count({ where: { status: 'pending' } }),
      client.order.count({ where: { status: { in: ACTIVE_KITCHEN_STATUSES } } }),
      client.order.findMany({
        where: { ...notCancelled, placedAt: { gte: thirtyDaysAgo } },
        select: { deliveryFee: true, lines: { select: { unitPrice: true, quantity: true } } },
      }),
      client.orderLine.groupBy({
        by: ['productName'],
        _sum: { quantity: true },
        where: { order: { ...notCancelled, placedAt: { gte: thirtyDaysAgo } } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      ordersToday: todayOrders.length,
      revenueToday: sumRevenue(todayOrders),
      pendingCount,
      inKitchenCount,
      revenueLast30Days: sumRevenue(last30Orders),
      topProducts: topLines.map((line) => ({
        productName: line.productName,
        unitsSold: line._sum.quantity ?? 0,
      })),
    };
  }
}

type RevenueRow = {
  deliveryFee: number;
  lines: { unitPrice: number; quantity: number }[];
};

function sumRevenue(orders: readonly RevenueRow[]): number {
  return orders.reduce(
    (total, order) =>
      total +
      order.deliveryFee +
      order.lines.reduce((lineTotal, line) => lineTotal + line.unitPrice * line.quantity, 0),
    0,
  );
}
