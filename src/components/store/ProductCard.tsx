'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { JarIcon } from '@/components/brand/JarIcon';
import { AddToCartButton } from './AddToCartButton';
import { DiscountBadge, PriceTag } from './PriceTag';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/cn';
import type { ProductDTO } from '@core/application/dto/product.dto';

/**
 * Tarjeta del catálogo.
 *
 * La tarjeta entera enlaza al detalle, pero el botón de agregar vive fuera de
 * ese enlace: anidar un botón dentro de un `<a>` es HTML inválido y rompe la
 * navegación por teclado.
 */
export function ProductCard({ product }: { product: ProductDTO }) {
  const { t, fill } = useTranslation();

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={cn(
        // `h-full`: el envoltorio animado se estira con la grilla, pero el
        // artículo de dentro se quedaba del alto de su contenido — de ahí que
        // unas tarjetas salieran más altas que otras en la misma fila.
        'group relative flex h-full flex-col overflow-hidden rounded-md border border-kraft-line/70 bg-white',
        'transition-shadow duration-300 hover:shadow-[0_14px_38px_rgba(37,26,16,0.13)]',
        !product.purchasable && 'opacity-75',
      )}
    >
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-1.5">
        {product.badge && (
          <span className="rounded-full bg-caramel px-3 py-1 font-display text-[0.7rem] font-bold uppercase tracking-wide text-white">
            {product.badge}
          </span>
        )}
        <DiscountBadge product={product} className="py-1" />
      </div>

      {product.lowStock && !product.soldOut && (
        <span className="absolute right-4 top-4 z-10 rounded-full bg-berry/10 px-2.5 py-1 font-display text-[0.7rem] font-bold text-berry">
          {fill(t.producto.quedan, { n: product.stock ?? 0 })}
        </span>
      )}

      <Link
        href={`/producto/${product.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-offset-[-4px]"
      >
        <div className="relative flex items-center justify-center bg-paper-2/70 px-6 py-9">
          {/* Halo suave que crece al pasar el cursor. */}
          <span
            className="absolute h-32 w-32 rounded-full bg-white/60 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
            aria-hidden
          />
          <motion.div
            className="relative h-32 w-32"
            whileHover={{ rotate: [0, -6, 6, -3, 0], scale: 1.06 }}
            transition={{ duration: 0.6 }}
          >
            <JarIcon
              fillColor={product.art.fillColor}
              pattern={product.art.pattern}
              label={product.name}
            />
          </motion.div>

          {product.soldOut && (
            <span className="absolute inset-x-0 bottom-3 text-center font-script text-2xl text-ink-soft">
              {t.producto.seAcabo}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-6 pb-5 pt-5">
          {/* Metadatos del formato: onzas para individuales, unidades para combos. */}
          <p className="mb-1.5 flex flex-wrap items-center gap-x-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.09em] text-green-deep">
            {product.flavor && <span>{product.flavor.emoji} {product.flavor.name}</span>}
            {product.units && <span>{fill(t.producto.unidades, { n: product.units })}</span>}
            {product.sizeOz && <span className="text-ink-soft">{product.sizeOz} oz</span>}
          </p>

          <h3 className="font-display text-[1.05rem] font-semibold leading-snug">
            {product.name}
          </h3>
          <p className="mt-2 flex-1 text-[0.88rem] leading-relaxed text-ink-soft">
            {product.description}
          </p>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 border-t border-kraft-line/50 px-6 py-4">
        <div>
          <PriceTag product={product} />
          {product.pricePerUnitFormatted && (
            <p className="text-[0.74rem] text-ink-soft">
              {product.pricePerUnitFormatted} {t.producto.cadaUno}
            </p>
          )}
        </div>
        <AddToCartButton product={product} />
      </div>
    </motion.article>
  );
}
