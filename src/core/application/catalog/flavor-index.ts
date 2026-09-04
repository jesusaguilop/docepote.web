/**
 * Carga los sabores de un conjunto de productos en una sola consulta.
 *
 * Sin esto, armar la grilla del catálogo dispararía una consulta por tarjeta
 * — el clásico problema N+1. Aquí se juntan los ids, se piden todos de una y
 * se devuelve un índice para que el mapeo a DTO sea instantáneo.
 */

import type { Flavor } from '@core/domain/catalog/flavor';
import type { FlavorReader } from '@core/domain/catalog/flavor.repository';
import type { Product } from '@core/domain/catalog/product';

export async function loadFlavorIndex(
  flavors: FlavorReader,
  products: readonly Product[],
): Promise<Map<string, Flavor>> {
  const ids = [
    ...new Set(
      products
        .map((product) => product.flavorId)
        .filter((id): id is string => id !== null),
    ),
  ];

  if (ids.length === 0) return new Map();

  const found = await flavors.findManyByIds(ids);
  return new Map(found.map((flavor) => [flavor.id, flavor]));
}
