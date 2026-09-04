/** Implementación de sabores sobre Prisma. */

import type { Flavor } from '@core/domain/catalog/flavor';
import type { FlavorRepository } from '@core/domain/catalog/flavor.repository';
import type { Slug } from '@core/domain/shared/slug';
import { db } from './client';
import { toFlavorEntity, toFlavorRow } from './mappers';

export class PrismaFlavorRepository implements FlavorRepository {
  async findAll(): Promise<Flavor[]> {
    const rows = await db().flavor.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] });
    return rows.map(toFlavorEntity);
  }

  async findById(id: string): Promise<Flavor | null> {
    const row = await db().flavor.findUnique({ where: { id } });
    return row ? toFlavorEntity(row) : null;
  }

  async findBySlug(slug: Slug): Promise<Flavor | null> {
    const row = await db().flavor.findUnique({ where: { slug: slug.value } });
    return row ? toFlavorEntity(row) : null;
  }

  async findManyByIds(ids: readonly string[]): Promise<Flavor[]> {
    if (ids.length === 0) return [];
    const rows = await db().flavor.findMany({ where: { id: { in: [...ids] } } });
    return rows.map(toFlavorEntity);
  }

  async save(flavor: Flavor): Promise<void> {
    const data = toFlavorRow(flavor);
    await db().flavor.upsert({ where: { id: flavor.id }, create: data, update: data });
  }
}
