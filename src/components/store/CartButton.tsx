'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useCart } from './cart-context';
import { useTranslation } from '@/lib/i18n/context';

/** Disparador del carrito: el número salta cada vez que cambia la cuenta. */
export function CartButton() {
  const { totalItems, openDrawer, ready } = useCart();
  const { t, fill } = useTranslation();

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="group flex items-center gap-2.5 rounded-full border border-ink py-2 pl-3.5 pr-4 font-display text-[0.92rem] font-semibold transition-colors duration-200 hover:bg-ink hover:text-paper"
      aria-label={fill(t.carrito.abrirAria, {
        n: totalItems,
        productos: totalItems === 1 ? t.carrito.producto : t.carrito.productos,
      })}
    >
      <span>{t.nav.carrito}</span>
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-caramel px-1.5 text-[0.72rem] font-bold text-white">
        {/* Hasta leer localStorage se muestra 0 para no desajustar la hidratación. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={ready ? totalItems : 0}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {ready ? totalItems : 0}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
