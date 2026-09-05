/**
 * Punto de entrada de la traducción.
 *
 * Se usa desde componentes de servidor (`getDictionary`) y de cliente
 * (`useTranslation`, con el proveedor del layout). El diccionario español es
 * el tipo canónico: cualquier clave nueva obliga al portugués a tenerla.
 */

import { es } from './dictionaries/es';
import { pt } from './dictionaries/pt';
import { DEFAULT_LOCALE, type Locale } from './locale';

/**
 * Misma forma que el diccionario español, pero con cadenas libres.
 *
 * `es` lleva `as const` para que las claves sean exactas, y eso convierte cada
 * texto en un tipo literal. Sin ensanchar, el portugués tendría que repetir
 * palabra por palabra el español — que es justo lo contrario de traducir.
 */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof es>;

const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = Object.freeze({ es, pt });

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * Rellena marcadores: `interpolate('Quedan {n}', { n: 3 })` → "Quedan 3".
 *
 * Existe porque varias frases llevan un dato en medio, y partirlas en trozos
 * para concatenar en JSX produce traducciones que no se pueden reordenar —
 * y en portugués el orden de la frase a veces cambia.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export * from './locale';
