'use client';

import { motion } from 'motion/react';
import { useTranslation } from '@/lib/i18n/context';

/**
 * Franja de datos en movimiento continuo.
 *
 * El contenido se duplica y se desplaza justo la mitad de su ancho: cuando la
 * animación reinicia, la segunda copia está exactamente donde estaba la
 * primera, así que el bucle no tiene costura visible.
 */
export function FactsStrip() {
  const { t } = useTranslation();

  const FACTS = [
    { value: '6', label: t.facts.sabores },
    { value: '100%', label: t.facts.hechoAMano },
    { value: '8 oz', label: t.facts.contenido },
    { value: 'Kits', label: t.facts.kits },
  ];

  return (
    <div className="overflow-hidden border-y border-kraft-line bg-paper-2 py-4">
      <motion.div
        className="flex w-max gap-14 pr-14"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
        aria-hidden
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-14 pr-14">
            {FACTS.map((fact) => (
              <span
                key={`${copy}-${fact.label}`}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[0.92rem] text-ink-soft"
              >
                <b className="font-display text-ink">{fact.value}</b>
                {fact.label}
                <span className="ml-8 text-green" aria-hidden>
                  &bull;
                </span>
              </span>
            ))}
          </div>
        ))}
      </motion.div>

      {/* Versión estática y accesible del mismo contenido. */}
      <p className="sr-only">
        {FACTS.map((fact) => `${fact.value} ${fact.label}`).join('. ')}
      </p>
    </div>
  );
}
