/**
 * Fotos de producto: subir, quitar y reordenar.
 *
 * El orden importa de verdad y por eso no se deja al azar: la foto en la
 * posición 0 es la que sale en la tarjeta del catálogo, que es la que decide
 * si alguien entra a la ficha. Todas las operaciones dejan las posiciones
 * consecutivas desde 0 — sin huecos, sin empates.
 */

import {
  MAX_IMAGES_PER_PRODUCT,
  ProductImage,
  assertUploadable,
  type NewProductImage,
} from '@core/domain/catalog/product-image';
import type { ProductImageRepository } from '@core/domain/catalog/product-image.repository';
import type { ProductReader } from '@core/domain/catalog/product.repository';
import type { IdGenerator } from '../ports/id-generator';
import type { TransactionRunner } from '../ports/transaction-runner';
import {
  ConflictError,
  NotFoundError,
  isDomainError,
  type DomainError,
} from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';
import type { ProductImageDTO } from '../dto/product.dto';

async function attempt<T>(work: () => Promise<T>): Promise<Result<T, DomainError>> {
  try {
    return Ok(await work());
  } catch (error) {
    if (isDomainError(error)) return Err(error);
    throw error;
  }
}

function toDTO(image: ProductImage): ProductImageDTO {
  return { id: image.id, url: image.url, alt: image.alt };
}

export interface AddProductImageInput {
  readonly productId: string;
  readonly image: NewProductImage;
}

export class AddProductImageUseCase {
  constructor(
    private readonly images: ProductImageRepository,
    private readonly products: ProductReader,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: AddProductImageInput): Promise<Result<ProductImageDTO[], DomainError>> {
    return attempt(async () => {
      const product = await this.products.findById(input.productId);
      if (!product) throw new NotFoundError('el producto', input.productId);

      assertUploadable(input.image);

      const existing = await this.images.countByProduct(input.productId);
      if (existing >= MAX_IMAGES_PER_PRODUCT) {
        throw new ConflictError(
          `Este producto ya tiene ${MAX_IMAGES_PER_PRODUCT} fotos, que es el máximo. ` +
            `Quita una para subir otra.`,
          { campo: 'foto' },
        );
      }

      // Al final de la fila: quien sube una foto nueva no espera que se le
      // cuele de portada por encima de la que ya eligió.
      await this.images.add(this.ids.generate(), input.productId, existing, input.image);

      return (await this.images.listByProduct(input.productId)).map(toDTO);
    });
  }
}

export class DeleteProductImageUseCase {
  constructor(
    private readonly images: ProductImageRepository,
    private readonly transactions: TransactionRunner,
  ) {}

  async execute(id: string): Promise<Result<ProductImageDTO[], DomainError>> {
    return attempt(async () => {
      const image = await this.images.findById(id);
      if (!image) throw new NotFoundError('la foto', id);

      return this.transactions.run(async () => {
        await this.images.delete(id);

        // Sin esto quedarían posiciones 0, 2, 3: funciona, pero el siguiente
        // reordenamiento partiría de una numeración rota.
        const rest = await this.images.listByProduct(image.productId);
        await this.images.reposition(rest.map((one, index) => one.movedTo(index)));

        return rest.map((one, index) => toDTO(one.movedTo(index)));
      });
    });
  }
}

export interface ReorderProductImagesInput {
  readonly productId: string;
  /** Los ids en el orden deseado. La primera es la portada. */
  readonly orderedIds: readonly string[];
}

export class ReorderProductImagesUseCase {
  constructor(
    private readonly images: ProductImageRepository,
    private readonly transactions: TransactionRunner,
  ) {}

  async execute(
    input: ReorderProductImagesInput,
  ): Promise<Result<ProductImageDTO[], DomainError>> {
    return attempt(async () => {
      const current = await this.images.listByProduct(input.productId);
      const byId = new Map(current.map((image) => [image.id, image]));

      // Se ordena por la lista recibida y se agrega al final cualquier foto
      // que no venga en ella. Así una pantalla desactualizada —alguien subió
      // una foto en otra pestaña— reordena sin hacer desaparecer nada.
      const ordered: ProductImage[] = [];

      for (const id of input.orderedIds) {
        const image = byId.get(id);
        if (!image) continue;
        ordered.push(image);
        byId.delete(id);
      }

      ordered.push(...byId.values());

      const repositioned = ordered.map((image, index) => image.movedTo(index));
      await this.transactions.run(() => this.images.reposition(repositioned));

      return repositioned.map(toDTO);
    });
  }
}

/** Las fotos de un producto, para refrescar el panel tras un cambio. */
export class ListProductImagesUseCase {
  constructor(private readonly images: ProductImageRepository) {}

  async execute(productId: string): Promise<Result<ProductImageDTO[], DomainError>> {
    return attempt(async () => (await this.images.listByProduct(productId)).map(toDTO));
  }
}
