'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useCart } from './cart-context';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import type { ProductDTO } from '@core/application/dto/product.dto';

interface AddToCartButtonProps {
  product: ProductDTO;
  quantity?: number;
  /** `full` ocupa todo el ancho: se usa en la página de detalle. */
  layout?: 'compact' | 'full';
  /** Abre el cajón del carrito después de agregar. */
  openDrawerOnAdd?: boolean;
}

const CONFIRMATION_MS = 1200;

export function AddToCartButton({
  product,
  quantity = 1,
  layout = 'compact',
  openDrawerOnAdd = false,
}: AddToCartButtonProps) {
  const { add, openDrawer } = useCart();
  const { notify } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  if (!product.purchasable) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-sm border border-dashed border-kraft-line px-4 py-2 font-display text-[0.86rem] font-semibold text-ink-soft',
          layout === 'full' && 'w-full py-3.5 text-[0.98rem]',
        )}
      >
        {product.soldOut ? 'Agotado por hoy' : 'No disponible'}
      </span>
    );
  }

  const handleAdd = () => {
    add(product.id, quantity);
    notify(`${product.name} — agregado al carrito`);

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), CONFIRMATION_MS);

    if (openDrawerOnAdd) openDrawer();
  };

  return (
    <motion.button
      type="button"
      onClick={handleAdd}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-sm font-display font-semibold transition-colors duration-200',
        justAdded ? 'bg-green-deep text-white' : 'bg-ink text-paper hover:bg-[#100b06]',
        layout === 'full' ? 'w-full py-3.5 text-[0.98rem]' : 'px-4 py-2 text-[0.86rem]',
      )}
      aria-label={`Agregar ${product.name} al carrito`}
    >
      {/* El texto se sustituye en su lugar para que el botón no cambie de tamaño. */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={justAdded ? 'added' : 'idle'}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5"
        >
          {justAdded ? 'Agregado' : 'Agregar'}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
