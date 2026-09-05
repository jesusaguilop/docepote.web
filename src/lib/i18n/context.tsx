'use client';

/**
 * Traducción para componentes de cliente.
 *
 * El diccionario se resuelve en el servidor y baja una sola vez por el
 * proveedor: así el cliente no carga los dos idiomas ni tiene que esperar a
 * hidratarse para mostrar el texto correcto.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { interpolate, type Dictionary } from './index';
import { DEFAULT_LOCALE, type Locale } from './locale';

interface TranslationValue {
  t: Dictionary;
  locale: Locale;
  /** Rellena marcadores: `fill(t.producto.quedan, { n: 3 })`. */
  fill: (template: string, values: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationValue | null>(null);

export function TranslationProvider({
  dictionary,
  locale,
  children,
}: {
  dictionary: Dictionary;
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<TranslationValue>(
    () => ({ t: dictionary, locale, fill: interpolate }),
    [dictionary, locale],
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation(): TranslationValue {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation debe usarse dentro de <TranslationProvider>.');
  }
  return context;
}

export { DEFAULT_LOCALE };
