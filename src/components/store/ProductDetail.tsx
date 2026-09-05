'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { JarIcon } from '@/components/brand/JarIcon';
import { AddToCartButton } from './AddToCartButton';
import { QuantityStepper } from './QuantityStepper';
import { DiscountBadge, PriceTag } from './PriceTag';
import type { Category } from '@core/domain/catalog/category';
import { useTranslation } from '@/lib/i18n/context';
import type { ProductDTO } from '@core/application/dto/product.dto';

/**
 * Detalle de producto.
 *
 * Es cliente solo por el selector de cantidad; el resto de la página que lo
 * contiene se renderiza en el servidor.
 */
export function ProductDetail({ product }: { product: ProductDTO }) {
  const { t, fill } = useTranslation();
  const [quantity, setQuantity] = useState(1);

  const categoryLabel: Record<Category, string> = {
    individual: t.categorias.individual,
    mini: t.categorias.mini,
    combo: t.categorias.combo,
    eventos: t.categorias.eventos,
  };

  return (
    <div className="grid items-start gap-14 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex items-center justify-center rounded-md bg-paper-2/70 px-8 py-16 lg:sticky lg:top-28"
      >
        <span className="absolute h-56 w-56 rounded-full bg-white/50 blur-3xl" aria-hidden />
        <motion.div
          className="relative h-64 w-64"
          animate={{ y: [0, -12, 0], rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <JarIcon
            fillColor={product.art.fillColor}
            pattern={product.art.pattern}
            label={product.name}
          />
        </motion.div>

        <div className="absolute left-6 top-6 flex flex-wrap gap-2">
          {product.badge && (
            <span className="rounded-full bg-caramel px-3.5 py-1.5 font-display text-[0.74rem] font-bold uppercase tracking-wide text-white">
              {product.badge}
            </span>
          )}
          <DiscountBadge product={product} className="px-3 py-1.5 text-[0.74rem]" />
        </div>
      </motion.div>

      <div>
        <p className="font-display text-[0.86rem] font-semibold uppercase tracking-wider text-green-deep">
          {categoryLabel[product.category]}
        </p>

        <h1 className="mt-3 text-[clamp(2rem,3.6vw,2.8rem)] font-bold leading-tight">
          {product.name}
        </h1>

        <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-soft">
          {product.description}
        </p>

        {/* Ficha corta: solo se pintan los datos que este producto declara. */}
        {(product.sizeOz || product.units || product.flavor) && (
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-kraft-line/50 py-4">
            {product.flavor && (
              <div>
                <dt className="font-display text-[0.72rem] font-bold uppercase tracking-wider text-ink-soft">
                  {t.producto.sabor}
                </dt>
                <dd className="mt-0.5 font-display text-[0.95rem] font-semibold">
                  {product.flavor.emoji} {product.flavor.name}
                </dd>
              </div>
            )}
            {product.sizeOz && (
              <div>
                <dt className="font-display text-[0.72rem] font-bold uppercase tracking-wider text-ink-soft">
                  {t.producto.tamano}
                </dt>
                <dd className="mt-0.5 font-display text-[0.95rem] font-semibold">
                  {product.sizeOz} oz
                </dd>
              </div>
            )}
            {product.units && (
              <div>
                <dt className="font-display text-[0.72rem] font-bold uppercase tracking-wider text-ink-soft">
                  {t.producto.contiene}
                </dt>
                <dd className="mt-0.5 font-display text-[0.95rem] font-semibold">
                  {fill(t.producto.potes, { n: product.units })}
                </dd>
              </div>
            )}
          </dl>
        )}

        {/* Composición del sabor: la receta capa por capa, si está documentada. */}
        {product.flavor?.composition && (
          <div className="mt-6 rounded-md bg-paper-2/60 px-5 py-4">
            <p className="font-display text-[0.76rem] font-bold uppercase tracking-wider text-ink-soft">
              {t.producto.queLleva}
            </p>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
              {product.flavor.composition}
            </p>
          </div>
        )}

        <div className="mt-8">
          <PriceTag product={product} size="lg" />

          {product.pricePerUnitFormatted && (
            <p className="mt-1 text-[0.9rem] text-ink-soft">
              {fill(t.producto.precioPorPote, { precio: product.pricePerUnitFormatted })}
            </p>
          )}
          {product.savingsFormatted && (
            <p className="mt-1 font-display text-[0.9rem] font-semibold text-berry">
              {fill(t.producto.teAhorras, { monto: product.savingsFormatted })}
            </p>
          )}
        </div>

        {product.stock !== null && (
          <p className="mt-3 text-[0.9rem] text-ink-soft">
            {product.soldOut ? (
              <span className="font-semibold text-berry">{t.producto.agotado}</span>
            ) : product.lowStock ? (
              <span className="font-semibold text-berry">
                {fill(t.producto.ultimas, { n: product.stock ?? 0 })}
              </span>
            ) : (
              fill(t.producto.disponibles, { n: product.stock ?? 0 })
            )}
          </p>
        )}

        {product.stock === null && (
          <p className="mt-3 text-[0.9rem] text-ink-soft">
            {t.producto.porEncargo}
          </p>
        )}

        {product.purchasable && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QuantityStepper
              value={quantity}
              max={product.stock}
              onChange={(next) => setQuantity(Math.max(1, next))}
              size="md"
            />
            {quantity > 1 && (
              <span className="text-[0.88rem] text-ink-soft">
                {fill(t.producto.unidades, { n: quantity })}
              </span>
            )}
          </div>
        )}

        <div className="mt-6 max-w-sm">
          <AddToCartButton
            product={product}
            quantity={quantity}
            layout="full"
            openDrawerOnAdd
          />
        </div>

        <ul className="mt-10 space-y-3 border-t border-kraft-line/60 pt-8 text-[0.9rem] text-ink-soft">
          <li className="flex gap-3">
            <span aria-hidden>📦</span>
            {t.producto.empacado}
          </li>
          <li className="flex gap-3">
            <span aria-hidden>🛵</span>
            {t.producto.domicilio}
          </li>
          <li className="flex gap-3">
            <span aria-hidden>🍮</span>
            {t.producto.tandas}
          </li>
        </ul>
      </div>
    </div>
  );
}
