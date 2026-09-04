/**
 * Puertos del catálogo (ISP).
 *
 * La tienda pública solo consume `ProductReader`; el panel de administración
 * es el único que depende además de `ProductWriter`. Así ningún caso de uso
 * de lectura arrastra métodos de escritura que no usa.
 *
 * Las implementaciones viven en `src/infrastructure/persistence`.
 */

import type { Product } from './product';
import type { Category } from './category';
import type { Slug } from '../shared/slug';

export interface ProductQuery {
  /** `undefined` = todas las categorías. */
  readonly category?: Category;
  /** Búsqueda por nombre o descripción. */
  readonly search?: string;
  /** `true` devuelve solo productos activos (lo que ve la tienda). */
  readonly onlyActive?: boolean;
}

export interface ProductReader {
  findAll(query?: ProductQuery): Promise<Product[]>;
  findBySlug(slug: Slug): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  /** Carga varios por id de una sola vez; evita el problema N+1 al armar un pedido. */
  findManyByIds(ids: readonly string[]): Promise<Product[]>;
}

export interface ProductWriter {
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
  existsWithSlug(slug: Slug, excludingId?: string): Promise<boolean>;
}

export interface ProductRepository extends ProductReader, ProductWriter {}
