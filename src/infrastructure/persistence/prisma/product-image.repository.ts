/** Implementación de fotos de producto sobre Prisma. */

import {
  ProductImage,
  parseImageMimeType,
  type ImageFile,
  type NewProductImage,
} from '@core/domain/catalog/product-image';
import type { ProductImageRepository } from '@core/domain/catalog/product-image.repository';
import { db } from './client';

/**
 * Columnas de la ficha, sin el blob.
 *
 * Es el detalle que hace que el catálogo sea rápido: sin este `select`,
 * pintar doce tarjetas traería de la base los ocho megabytes de todas las
 * fotos de todos los productos para terminar mostrando doce miniaturas.
 */
const FICHA = {
  id: true,
  productId: true,
  position: true,
  mimeType: true,
  alt: true,
  updatedAt: true,
} as const;

interface FichaRow {
  id: string;
  productId: string;
  position: number;
  mimeType: string;
  alt: string;
  updatedAt: Date;
}

export class PrismaProductImageRepository implements ProductImageRepository {
  async listByProduct(productId: string): Promise<ProductImage[]> {
    const rows = await db().productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
      select: FICHA,
    });

    return rows.map(toEntity);
  }

  async listByProducts(
    productIds: readonly string[],
  ): Promise<Map<string, ProductImage[]>> {
    const index = new Map<string, ProductImage[]>();
    if (productIds.length === 0) return index;

    const rows = await db().productImage.findMany({
      where: { productId: { in: [...productIds] } },
      orderBy: [{ productId: 'asc' }, { position: 'asc' }],
      select: FICHA,
    });

    for (const row of rows) {
      const list = index.get(row.productId) ?? [];
      list.push(toEntity(row));
      index.set(row.productId, list);
    }

    return index;
  }

  async findById(id: string): Promise<ProductImage | null> {
    const row = await db().productImage.findUnique({ where: { id }, select: FICHA });
    return row ? toEntity(row) : null;
  }

  async findFile(id: string): Promise<ImageFile | null> {
    const row = await db().productImage.findUnique({
      where: { id },
      select: { image: true, mimeType: true },
    });

    if (!row) return null;

    return {
      bytes: Uint8Array.from(row.image),
      mimeType: parseImageMimeType(row.mimeType),
    };
  }

  async countByProduct(productId: string): Promise<number> {
    return db().productImage.count({ where: { productId } });
  }

  async add(
    id: string,
    productId: string,
    position: number,
    image: NewProductImage,
  ): Promise<void> {
    await db().productImage.create({
      data: {
        id,
        productId,
        position,
        image: Buffer.from(image.bytes),
        mimeType: image.mimeType,
        alt: image.alt.trim(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await db().productImage.delete({ where: { id } });
  }

  async reposition(images: readonly ProductImage[]): Promise<void> {
    for (const image of images) {
      await db().productImage.update({
        where: { id: image.id },
        data: { position: image.position },
      });
    }
  }
}

function toEntity(row: FichaRow): ProductImage {
  return ProductImage.of({
    id: row.id,
    productId: row.productId,
    position: row.position,
    mimeType: parseImageMimeType(row.mimeType),
    alt: row.alt,
    updatedAt: row.updatedAt,
  });
}
