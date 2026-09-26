/** Implementación del catálogo sobre Prisma. */

import { Prisma } from '@prisma/client';
import { ConflictError } from '@core/domain/shared/errors';
import type { Product } from '@core/domain/catalog/product';
import type {
  ProductRepository,
  ProductQuery,
} from '@core/domain/catalog/product.repository';
import type { Slug } from '@core/domain/shared/slug';
import { db } from './client';
import { toProductEntity, toProductRow } from './mappers';

export class PrismaProductRepository implements ProductRepository {
  async findAll(query: ProductQuery = {}): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {};

    if (query.onlyActive) where.active = true;
    if (query.category) where.category = query.category;

    if (query.search) {
      // SQLite no soporta `mode: 'insensitive'`; el seed guarda los textos
      // como se muestran y `contains` alcanza para un catálogo de este tamaño.
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const rows = await db().product.findMany({
      where,
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });

    return rows.map(toProductEntity);
  }

  async findBySlug(slug: Slug): Promise<Product | null> {
    const row = await db().product.findUnique({ where: { slug: slug.value } });
    return row ? toProductEntity(row) : null;
  }

  async findById(id: string): Promise<Product | null> {
    const row = await db().product.findUnique({ where: { id } });
    return row ? toProductEntity(row) : null;
  }

  async findManyByIds(ids: readonly string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const rows = await db().product.findMany({ where: { id: { in: [...ids] } } });
    return rows.map(toProductEntity);
  }

  async save(product: Product): Promise<void> {
    const data = toProductRow(product);
    await db().product.upsert({
      where: { id: product.id },
      create: data,
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    try {
      await db().product.delete({ where: { id } });
    } catch (error) {
      // P2003: la base no lo deja ir porque hay pedidos que lo nombran. Es el
      // único fallo que se traduce: cualquier otro (base dormida, red) debe
      // llegar como lo que es y no disfrazarse de "tiene pedidos".
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictError(
          'Este producto ya tiene pedidos, así que no se puede borrar. Ocúltalo para que no salga en la tienda.',
          { motivo: 'tiene-pedidos' },
        );
      }
      throw error;
    }
  }

  async reserveStock(id: string, quantity: number): Promise<boolean> {
    // La condición va en el WHERE: Postgres bloquea la fila y vuelve a
    // evaluarla, así que el segundo de dos pedidos simultáneos ya no la cumple.
    const { count } = await db().product.updateMany({
      where: { id, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (count > 0) return true;

    const row = await db().product.findUnique({ where: { id }, select: { stock: true } });
    return row !== null && row.stock === null;
  }

  async releaseStock(id: string, quantity: number): Promise<void> {
    await db().product.updateMany({
      where: { id, stock: { not: null } },
      data: { stock: { increment: quantity } },
    });
  }

  async existsWithSlug(slug: Slug, excludingId?: string): Promise<boolean> {
    const found = await db().product.findFirst({
      where: {
        slug: slug.value,
        ...(excludingId ? { NOT: { id: excludingId } } : {}),
      },
      select: { id: true },
    });
    return found !== null;
  }
}
