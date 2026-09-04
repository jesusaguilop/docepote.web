import type { ProductReader } from '@core/domain/catalog/product.repository';
import type { FlavorReader } from '@core/domain/catalog/flavor.repository';
import { Slug } from '@core/domain/shared/slug';
import { NotFoundError, type DomainError } from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';
import { toProductDTO, toProductDTOs, type ProductDTO } from '../dto/product.dto';
import { loadFlavorIndex } from './flavor-index';

/** Trae un producto por su slug para la página de detalle. */
export class GetProductBySlugUseCase {
  constructor(
    private readonly products: ProductReader,
    private readonly flavors: FlavorReader,
  ) {}

  async execute(rawSlug: string): Promise<Result<ProductDTO, DomainError>> {
    let slug: Slug;
    try {
      slug = Slug.of(rawSlug);
    } catch {
      return Err(new NotFoundError('el producto', rawSlug));
    }

    const product = await this.products.findBySlug(slug);
    if (!product) return Err(new NotFoundError('el producto', rawSlug));

    const flavor = product.flavorId ? await this.flavors.findById(product.flavorId) : null;
    return Ok(toProductDTO(product, flavor));
  }
}

/**
 * Sugerencias para el bloque "también te puede gustar".
 *
 * Primero busca en la misma categoría; si esa categoría tiene poco (los
 * combos, por ejemplo, son uno solo), completa con otros productos activos
 * para no dejar el bloque cojo.
 */
export class GetRelatedProductsUseCase {
  constructor(
    private readonly products: ProductReader,
    private readonly flavors: FlavorReader,
  ) {}

  async execute(slug: string, limit = 3): Promise<Result<ProductDTO[], DomainError>> {
    let parsed: Slug;
    try {
      parsed = Slug.of(slug);
    } catch {
      return Ok([]);
    }

    const current = await this.products.findBySlug(parsed);
    if (!current) return Ok([]);

    const sameCategory = (await this.products.findAll({
      category: current.category,
      onlyActive: true,
    })).filter((p) => p.id !== current.id);

    let picks = sameCategory.slice(0, limit);

    if (picks.length < limit) {
      const chosen = new Set([current.id, ...picks.map((p) => p.id)]);
      const rest = (await this.products.findAll({ onlyActive: true })).filter(
        (p) => !chosen.has(p.id),
      );
      picks = [...picks, ...rest.slice(0, limit - picks.length)];
    }

    const flavorsById = await loadFlavorIndex(this.flavors, picks);
    return Ok(toProductDTOs(picks, flavorsById));
  }
}
