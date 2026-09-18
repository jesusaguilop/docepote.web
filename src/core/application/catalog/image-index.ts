import type { ProductImage } from '@core/domain/catalog/product-image';
import type { ProductImageReader } from '@core/domain/catalog/product-image.repository';

/**
 * Carga las fotos del catálogo sin poder tumbarlo.
 *
 * Una foto es adorno; el producto, su precio y su disponibilidad son el
 * negocio. Si la consulta de fotos falla —la tabla todavía sin crear tras un
 * despliegue, la base con hipo— es mucho mejor un catálogo con los potecitos
 * ilustrados que un catálogo vacío: con dibujos se vende, en blanco no.
 *
 * El fallo se registra para que sea diagnosticable, no se esconde.
 */
export async function loadImageIndex(
  images: ProductImageReader,
  productIds: readonly string[],
): Promise<Map<string, ProductImage[]>> {
  if (productIds.length === 0) return new Map();

  try {
    return await images.listByProducts(productIds);
  } catch (error) {
    console.error('[catalogo] no se pudieron leer las fotos:', error);
    return new Map();
  }
}

/** Igual, para la ficha de un solo producto. */
export async function loadImagesFor(
  images: ProductImageReader,
  productId: string,
): Promise<ProductImage[]> {
  try {
    return await images.listByProduct(productId);
  } catch (error) {
    console.error('[catalogo] no se pudieron leer las fotos del producto:', error);
    return [];
  }
}
