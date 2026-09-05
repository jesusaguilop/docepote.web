/**
 * DTOs del catálogo.
 *
 * Las entidades del dominio son clases con métodos; React Server Components
 * solo puede enviar objetos serializables al cliente. Estos DTOs son esa
 * frontera: planos, congelados y con los precios ya formateados para que la UI
 * no tenga que saber de `Money` ni de locales.
 */

import type { Product } from '@core/domain/catalog/product';
import type { Flavor } from '@core/domain/catalog/flavor';
import type { Category } from '@core/domain/catalog/category';
import type { JarPattern } from '@core/domain/catalog/jar-art';

export interface FlavorDTO {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly emoji: string;
  readonly displayName: string;
  readonly summary: string;
  readonly composition: string | null;
}

export interface ProductDTO {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;

  readonly price: number;
  readonly priceFormatted: string;
  /** Precio anterior tachado; `null` si el producto no está en oferta. */
  readonly previousPriceFormatted: string | null;
  readonly discountPercent: number | null;
  readonly savingsFormatted: string | null;
  /** Precio por pote en los combos, para comparar contra el individual. */
  readonly pricePerUnitFormatted: string | null;

  readonly category: Category;
  readonly flavor: FlavorDTO | null;
  readonly badge: string | null;
  readonly art: { readonly fillColor: string; readonly pattern: JarPattern };
  readonly imageUrl: string | null;
  readonly sizeOz: number | null;
  readonly units: number | null;

  readonly active: boolean;
  readonly stock: number | null;
  readonly position: number;

  /** Estado de venta ya resuelto por el dominio, para que la UI no lo recalcule. */
  readonly purchasable: boolean;
  readonly soldOut: boolean;
  readonly lowStock: boolean;
}

export function toFlavorDTO(flavor: Flavor, locale = 'es'): FlavorDTO {
  const text = flavor.textFor(locale);

  return {
    id: flavor.id,
    slug: flavor.slug.value,
    name: text.name,
    emoji: flavor.emoji,
    displayName: flavor.emoji ? `${flavor.emoji} ${text.name}` : text.name,
    summary: text.summary,
    composition: text.composition,
  };
}

/**
 * El sabor llega por separado porque vive en otra tabla: quien construye el
 * DTO ya lo cargó (en lote, no uno por uno) y lo inyecta aquí.
 */
export function toProductDTO(
  product: Product,
  flavor: Flavor | null = null,
  locale = 'es',
): ProductDTO {
  const savings = product.savings;
  const perUnit = product.pricePerUnit;
  const text = product.textFor(locale);

  return {
    id: product.id,
    slug: product.slug.value,
    name: text.name,
    description: text.description,

    price: product.price.amount,
    priceFormatted: product.price.format(),
    previousPriceFormatted: product.previousPrice ? product.previousPrice.format() : null,
    discountPercent: product.discountPercent,
    savingsFormatted: savings ? savings.format() : null,
    pricePerUnitFormatted: perUnit ? perUnit.format() : null,

    category: product.category,
    flavor: flavor ? toFlavorDTO(flavor, locale) : null,
    badge: product.badge,
    art: { fillColor: product.art.fillColor, pattern: product.art.pattern },
    imageUrl: product.imageUrl,
    sizeOz: product.sizeOz,
    units: product.units,

    active: product.active,
    stock: product.stock,
    position: product.position,

    purchasable: product.isPurchasable(),
    soldOut: product.isSoldOut(),
    lowStock: product.isLowStock(),
  };
}

/**
 * Convierte una lista resolviendo los sabores de una sola pasada: se recibe el
 * índice ya cargado en vez de consultar la base por cada producto (N+1).
 */
export function toProductDTOs(
  products: readonly Product[],
  flavorsById: ReadonlyMap<string, Flavor> = new Map(),
  locale = 'es',
): ProductDTO[] {
  return products.map((product) =>
    toProductDTO(
      product,
      product.flavorId ? flavorsById.get(product.flavorId) ?? null : null,
      locale,
    ),
  );
}
