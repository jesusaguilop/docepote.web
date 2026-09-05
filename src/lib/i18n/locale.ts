/**
 * Idiomas de la tienda.
 *
 * Español es el idioma canónico — es donde vive el negocio. El portugués
 * existe porque la marca es brasileña y buena parte de su público lo lee
 * mejor: "bolo no pote", "brigadeiro" y los nombres de los sabores ya son
 * portugués, así que traducir el resto cierra el círculo.
 */

export const LOCALES = ['es', 'pt'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

/** Nombre de la cookie donde se recuerda la elección del visitante. */
export const LOCALE_COOKIE = 'docepote_locale';

/** Un año: la preferencia de idioma no caduca cada sesión. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Readonly<Record<Locale, string>> = Object.freeze({
  es: 'Español',
  pt: 'Português',
});

/** Etiqueta corta para el conmutador. */
export const LOCALE_SHORT: Readonly<Record<Locale, string>> = Object.freeze({
  es: 'ES',
  pt: 'PT',
});

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value);
}

/** Cualquier valor desconocido cae al idioma por defecto, nunca falla. */
export function parseLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
