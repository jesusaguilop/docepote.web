/**
 * Categorías del catálogo.
 *
 * Se modelan como unión de literales en vez de enum de TypeScript para que
 * el valor persistido en SQLite y el del dominio sean exactamente el mismo
 * string, sin capa de traducción.
 */

import { ValidationError } from '../shared/errors';

export const CATEGORIES = ['individual', 'mini', 'combo', 'eventos'] as const;

export type Category = (typeof CATEGORIES)[number];

/** Etiquetas de la marca, tal como se muestran en las pestañas del catálogo. */
export const CATEGORY_LABELS: Readonly<Record<Category, string>> = Object.freeze({
  individual: 'Bolo no pote individual',
  mini: 'Mini bolo no pote',
  combo: 'Para compartir',
  eventos: 'Eventos',
});

/** Versión corta, para las pestañas en pantallas angostas. */
export const CATEGORY_SHORT_LABELS: Readonly<Record<Category, string>> = Object.freeze({
  individual: 'Individual',
  mini: 'Mini',
  combo: 'Combos',
  eventos: 'Eventos',
});

/** Orden en que se presentan al cliente. */
export const CATEGORY_ORDER: Readonly<Record<Category, number>> = Object.freeze({
  individual: 1,
  mini: 2,
  combo: 3,
  eventos: 4,
});

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function parseCategory(value: string): Category {
  if (!isCategory(value)) {
    throw new ValidationError(`"${value}" no es una categoría válida.`, {
      categoriasValidas: CATEGORIES.join(', '),
    });
  }
  return value;
}
