/** Puerto de fotos de producto. */

import type { ImageFile, NewProductImage, ProductImage } from './product-image';

export interface ProductImageReader {
  /** Fichas (sin bytes) de un producto, en orden de carrusel. */
  listByProduct(productId: string): Promise<ProductImage[]>;
  /**
   * Igual, pero para varios productos de una sola consulta. El catálogo pinta
   * doce tarjetas: pedirlas una por una serían doce viajes a la base.
   */
  listByProducts(productIds: readonly string[]): Promise<Map<string, ProductImage[]>>;
  /** Los bytes de una foto. Solo lo usa la ruta que la sirve. */
  findFile(id: string): Promise<ImageFile | null>;
  findById(id: string): Promise<ProductImage | null>;
  countByProduct(productId: string): Promise<number>;
}

export interface ProductImageWriter {
  add(id: string, productId: string, position: number, image: NewProductImage): Promise<void>;
  delete(id: string): Promise<void>;
  /** Reasigna posiciones para que no queden huecos tras borrar o reordenar. */
  reposition(images: readonly ProductImage[]): Promise<void>;
}

export interface ProductImageRepository extends ProductImageReader, ProductImageWriter {}
