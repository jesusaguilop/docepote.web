'use client';

import { motion } from 'motion/react';
import { MAX_QUANTITY_PER_LINE } from '@core/domain/shared/quantity';

interface QuantityStepperProps {
  value: number;
  /** Tope por inventario; `null` cuando el producto se hace por encargo. */
  max?: number | null;
  onChange: (next: number) => void;
  size?: 'sm' | 'md';
}

/** Control de cantidad. El tope real lo marca el stock, no la interfaz. */
export function QuantityStepper({ value, max, onChange, size = 'sm' }: QuantityStepperProps) {
  const ceiling = Math.min(max ?? MAX_QUANTITY_PER_LINE, MAX_QUANTITY_PER_LINE);
  const canIncrease = value < ceiling;

  const dimension = size === 'sm' ? 'h-7 w-7 text-base' : 'h-9 w-9 text-lg';

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-kraft-line bg-paper p-0.5">
      <motion.button
        type="button"
        whileTap={{ scale: 0.86 }}
        onClick={() => onChange(value - 1)}
        className={`${dimension} flex items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink`}
        aria-label="Quitar una unidad"
      >
        &#8211;
      </motion.button>

      <span
        className={`min-w-6 text-center font-display text-sm font-bold tabular-nums`}
        aria-live="polite"
      >
        {value}
      </span>

      <motion.button
        type="button"
        whileTap={{ scale: 0.86 }}
        onClick={() => onChange(value + 1)}
        disabled={!canIncrease}
        className={`${dimension} flex items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent`}
        aria-label="Agregar una unidad"
      >
        +
      </motion.button>
    </div>
  );
}
