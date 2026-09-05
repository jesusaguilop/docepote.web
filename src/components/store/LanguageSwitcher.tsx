'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { setLocale } from '@/app/actions/locale';
import { useTranslation } from '@/lib/i18n/context';
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT } from '@/lib/i18n/locale';
import { cn } from '@/lib/cn';

/**
 * Conmutador de idioma.
 *
 * Dos botones en vez de un desplegable: con solo dos idiomas, un `select`
 * añade un toque de más y esconde la opción disponible. Así el visitante ve
 * de una que existe portugués.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const change = (next: string) => {
    if (next === locale) return;

    startTransition(async () => {
      await setLocale(next);
      // El servidor vuelve a renderizar con el diccionario nuevo.
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        'relative flex items-center rounded-full border border-kraft-line/70 p-0.5',
        isPending && 'opacity-60',
        className,
      )}
      role="group"
      aria-label={LOCALE_LABELS[locale] === 'Español' ? 'Idioma' : 'Idioma'}
    >
      {LOCALES.map((value) => {
        const active = value === locale;

        return (
          <button
            key={value}
            type="button"
            onClick={() => change(value)}
            disabled={isPending}
            aria-pressed={active}
            aria-label={LOCALE_LABELS[value]}
            className={cn(
              'relative rounded-full px-2.5 py-1 font-display text-[0.72rem] font-bold tracking-wide transition-colors',
              active ? 'text-paper' : 'text-ink-soft hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId="locale-pill"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{LOCALE_SHORT[value]}</span>
          </button>
        );
      })}
    </div>
  );
}
