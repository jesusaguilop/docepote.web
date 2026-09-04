/**
 * Alta y edición de productos desde el panel.
 *
 * Ambas comparten validación e invariantes, así que viven en un mismo caso de
 * uso con dos entradas: crear (sin id) y actualizar (con id). El slug se
 * deriva del nombre y se verifica que no choque con otro producto.
 */

import { Product } from '@core/domain/catalog/product';
import { JarArt } from '@core/domain/catalog/jar-art';
import { parseCategory } from '@core/domain/catalog/category';
import type { ProductRepository } from '@core/domain/catalog/product.repository';
import type { FlavorReader } from '@core/domain/catalog/flavor.repository';
import { Money } from '@core/domain/shared/money';
import { Slug } from '@core/domain/shared/slug';
import {
  ConflictError,
  NotFoundError,
  isDomainError,
  type DomainError,
} from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';
import { toProductDTO, type ProductDTO } from '../dto/product.dto';
import type { IdGenerator } from '../ports/id-generator';

export interface SaveProductInput {
  /** Ausente = crear uno nuevo. */
  readonly id?: string | null;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  /** Precio anterior tachado. `null` o ausente si no hay oferta. */
  readonly previousPrice?: number | null;
  readonly category: string;
  readonly flavorId?: string | null;
  readonly sizeOz?: number | null;
  readonly units?: number | null;
  readonly badge?: string | null;
  readonly fillColor: string;
  readonly pattern: string;
  readonly imageUrl?: string | null;
  readonly active: boolean;
  /** `null` = sin control de inventario. */
  readonly stock: number | null;
  readonly position?: number;
}

export class SaveProductUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly flavors: FlavorReader,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: SaveProductInput): Promise<Result<ProductDTO, DomainError>> {
    try {
      const existing = input.id ? await this.products.findById(input.id) : null;
      if (input.id && !existing) {
        return Err(new NotFoundError('el producto', input.id));
      }

      const slug = Slug.fromText(input.name);
      const slugTaken = await this.products.existsWithSlug(slug, existing?.id);
      if (slugTaken) {
        return Err(
          new ConflictError('Ya existe un producto con un nombre muy parecido.', {
            campo: 'name',
            slug: slug.value,
          }),
        );
      }

      const product = Product.create({
        id: existing?.id ?? this.ids.generate(),
        slug,
        name: input.name,
        description: input.description,
        price: Money.of(Math.trunc(input.price)),
        previousPrice:
          input.previousPrice == null ? null : Money.of(Math.trunc(input.previousPrice)),
        category: parseCategory(input.category),
        flavorId: input.flavorId?.trim() || null,
        badge: input.badge ?? null,
        art: JarArt.of(input.fillColor, input.pattern),
        imageUrl: input.imageUrl?.trim() || null,
        sizeOz: input.sizeOz ?? null,
        units: input.units ?? null,
        active: input.active,
        stock: input.stock,
        position: input.position ?? existing?.position ?? 0,
      });

      await this.products.save(product);

      const flavor = product.flavorId ? await this.flavors.findById(product.flavorId) : null;
      return Ok(toProductDTO(product, flavor));
    } catch (error) {
      if (isDomainError(error)) return Err(error);
      throw error;
    }
  }
}
