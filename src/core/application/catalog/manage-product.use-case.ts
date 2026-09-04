/** Operaciones puntuales del panel sobre un producto ya existente. */

import type { ProductRepository } from '@core/domain/catalog/product.repository';
import type { FlavorReader } from '@core/domain/catalog/flavor.repository';
import {
  NotFoundError,
  isDomainError,
  type DomainError,
} from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';
import { toProductDTO, type ProductDTO } from '../dto/product.dto';

/** Publicar u ocultar un pote del catálogo con un solo clic. */
export class ToggleProductAvailabilityUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly flavors: FlavorReader,
  ) {}

  async execute(id: string): Promise<Result<ProductDTO, DomainError>> {
    const product = await this.products.findById(id);
    if (!product) return Err(new NotFoundError('el producto', id));

    const updated = product.withActive(!product.active);
    await this.products.save(updated);

    const flavor = updated.flavorId ? await this.flavors.findById(updated.flavorId) : null;
    return Ok(toProductDTO(updated, flavor));
  }
}

/** Ajusta el inventario del día (lo que se horneó esta mañana). */
export class SetProductStockUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly flavors: FlavorReader,
  ) {}

  async execute(id: string, stock: number | null): Promise<Result<ProductDTO, DomainError>> {
    const product = await this.products.findById(id);
    if (!product) return Err(new NotFoundError('el producto', id));

    try {
      const updated = product.withChanges({ stock });
      await this.products.save(updated);

      const flavor = updated.flavorId ? await this.flavors.findById(updated.flavorId) : null;
      return Ok(toProductDTO(updated, flavor));
    } catch (error) {
      if (isDomainError(error)) return Err(error);
      throw error;
    }
  }
}

export class DeleteProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string): Promise<Result<{ id: string }, DomainError>> {
    const product = await this.products.findById(id);
    if (!product) return Err(new NotFoundError('el producto', id));

    await this.products.delete(id);
    return Ok({ id });
  }
}
