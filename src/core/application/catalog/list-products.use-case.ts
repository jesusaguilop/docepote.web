import type { ProductReader, ProductQuery } from '@core/domain/catalog/product.repository';
import type { FlavorReader } from '@core/domain/catalog/flavor.repository';
import { toFlavorDTO, toProductDTOs, type ProductDTO } from '../dto/product.dto';
import { Ok, type Result } from '@core/domain/shared/result';
import type { DomainError } from '@core/domain/shared/errors';
import { isCategory } from '@core/domain/catalog/category';
import { loadFlavorIndex } from './flavor-index';

export interface ListProductsInput {
  readonly category?: string;
  readonly search?: string;
  /** El catálogo público pasa `true`; el panel pasa `false` para ver también los ocultos. */
  readonly onlyActive?: boolean;
  /** Idioma en el que se devuelven nombres y descripciones. */
  readonly locale?: string;
}

/**
 * Lista el catálogo. Una categoría desconocida no es un error: se ignora el
 * filtro y se devuelve todo, que es lo que el visitante espera al llegar con
 * un enlace viejo.
 */
export class ListProductsUseCase {
  constructor(
    private readonly products: ProductReader,
    private readonly flavors: FlavorReader,
  ) {}

  async execute(input: ListProductsInput = {}): Promise<Result<ProductDTO[], DomainError>> {
    const query: ProductQuery = {
      onlyActive: input.onlyActive ?? true,
      ...(input.category && isCategory(input.category) ? { category: input.category } : {}),
      ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    };

    const found = await this.products.findAll(query);
    const flavorsById = await loadFlavorIndex(this.flavors, found);

    return Ok(toProductDTOs(found, flavorsById, input.locale));
  }
}

/** Los seis sabores de la casa, para la sección que los presenta. */
export class ListFlavorsUseCase {
  constructor(private readonly flavors: FlavorReader) {}

  async execute(locale = 'es') {
    const found = await this.flavors.findAll();
    return Ok(found.map((flavor) => toFlavorDTO(flavor, locale)));
  }
}
