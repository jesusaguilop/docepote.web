/** Implementación del catálogo sobre Prisma. */

import type { Prisma } from '@prisma/client';
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
    await db().product.delete({ where: { id } });
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
