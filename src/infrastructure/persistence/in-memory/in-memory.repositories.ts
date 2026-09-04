/**
 * Repositorios en memoria.
 *
 * Implementan exactamente los mismos puertos que los de Prisma, así que
 * pueden sustituirlos sin que ningún caso de uso lo note — que es justo lo
 * que pide el principio de sustitución de Liskov. Gracias a eso los tests
 * del dominio corren en milisegundos y sin base de datos.
 */

import type { Product } from '@core/domain/catalog/product';
import type {
  ProductQuery,
  ProductRepository,
} from '@core/domain/catalog/product.repository';
import type { Slug } from '@core/domain/shared/slug';
import type { Order } from '@core/domain/ordering/order';
import type {
  OrderQuery,
  OrderRepository,
  SalesSummary,
} from '@core/domain/ordering/order.repository';
import type { OrderCode } from '@core/domain/ordering/order-code';
import type { TransactionRunner } from '@core/application/ports/transaction-runner';

export class InMemoryProductRepository implements ProductRepository {
  private readonly items = new Map<string, Product>();

  constructor(seed: readonly Product[] = []) {
    for (const product of seed) this.items.set(product.id, product);
  }

  async findAll(query: ProductQuery = {}): Promise<Product[]> {
    const needle = query.search?.toLowerCase();

    return [...this.items.values()]
      .filter((product) => {
        if (query.onlyActive && !product.active) return false;
        if (query.category && product.category !== query.category) return false;
        if (needle) {
          const haystack = `${product.name} ${product.description}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  }

  async findBySlug(slug: Slug): Promise<Product | null> {
    return [...this.items.values()].find((p) => p.slug.equals(slug)) ?? null;
  }

  async findById(id: string): Promise<Product | null> {
    return this.items.get(id) ?? null;
  }

  async findManyByIds(ids: readonly string[]): Promise<Product[]> {
    return ids
      .map((id) => this.items.get(id))
      .filter((product): product is Product => product !== undefined);
  }

  async save(product: Product): Promise<void> {
    this.items.set(product.id, product);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async existsWithSlug(slug: Slug, excludingId?: string): Promise<boolean> {
    return [...this.items.values()].some(
      (product) => product.slug.equals(slug) && product.id !== excludingId,
    );
  }
}

export class InMemoryOrderRepository implements OrderRepository {
  readonly items = new Map<string, Order>();

  async findByCode(code: OrderCode): Promise<Order | null> {
    return [...this.items.values()].find((order) => order.code.value === code.value) ?? null;
  }

  async findById(id: string): Promise<Order | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(query: OrderQuery = {}): Promise<Order[]> {
    return [...this.items.values()]
      .filter((order) => !query.status || order.status === query.status)
      .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
      .slice(0, query.limit ?? 100);
  }

  async existsWithCode(code: OrderCode): Promise<boolean> {
    return (await this.findByCode(code)) !== null;
  }

  async save(order: Order): Promise<void> {
    this.items.set(order.id, order);
  }

  async summarize(now: Date): Promise<SalesSummary> {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const active = [...this.items.values()].filter((order) => order.status !== 'cancelled');
    const today = active.filter((order) => order.placedAt >= startOfToday);

    const sum = (orders: readonly Order[]) =>
      orders.reduce((total, order) => total + order.total.amount, 0);

    return {
      ordersToday: today.length,
      revenueToday: sum(today),
      pendingCount: [...this.items.values()].filter((o) => o.status === 'pending').length,
      inKitchenCount: [...this.items.values()].filter(
        (o) => o.status === 'confirmed' || o.status === 'preparing',
      ).length,
      revenueLast30Days: sum(active),
      topProducts: [],
    };
  }
}

/** Ejecuta el trabajo tal cual: en memoria no hay nada que confirmar ni revertir. */
export class ImmediateTransactionRunner implements TransactionRunner {
  async run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
