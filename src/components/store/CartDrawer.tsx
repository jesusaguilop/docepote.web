'use client';

/**
 * Cajón lateral del carrito.
 *
 * Los precios no se calculan aquí: cada vez que cambia el contenido se le
 * piden al servidor (`getCartSummary`), que además avisa si algo se agotó
 * mientras el cliente decidía.
 */

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useCart } from './cart-context';
import { getCartSummary } from '@/app/actions/cart';
import type { CartSummaryDTO } from '@core/application/ordering/get-cart-summary.use-case';
import { JarIcon } from '@/components/brand/JarIcon';
import { ButtonLink } from '@/components/ui/Button';
import { QuantityStepper } from './QuantityStepper';
import { useTranslation } from '@/lib/i18n/context';

export function CartDrawer() {
  const { isDrawerOpen, closeDrawer, items, setQuantity, remove, ready } = useCart();
  const { t, fill } = useTranslation();
  const [summary, setSummary] = useState<CartSummaryDTO | null>(null);
  const [isPending, startTransition] = useTransition();

  // Revalora el carrito cuando cambia su contenido, pero solo con el cajón
  // abierto: no tiene sentido consultar al servidor si nadie lo está viendo.
  useEffect(() => {
    if (!ready || !isDrawerOpen) return;

    let cancelled = false;
    startTransition(async () => {
      const result = await getCartSummary(items);
      if (!cancelled && result.ok) setSummary(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [items, isDrawerOpen, ready]);

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen, closeDrawer]);

  const lines = summary?.lines ?? [];
  const isEmpty = items.length === 0;

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={closeDrawer}
            aria-hidden
          />

          <motion.aside
            className="fixed right-0 top-0 z-[70] flex h-dvh w-full max-w-[420px] flex-col bg-paper shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            role="dialog"
            aria-modal="true"
            aria-label={t.carrito.titulo}
          >
            <header className="flex items-center justify-between border-b border-kraft-line px-6 py-5">
              <h2 className="font-display text-xl font-bold">{t.carrito.titulo}</h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
                aria-label={t.carrito.cerrar}
              >
                &#10005;
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6">
              {isEmpty ? (
                <EmptyCart onClose={closeDrawer} />
              ) : (
                <ul className="divide-y divide-kraft-line/50">
                  <AnimatePresence initial={false}>
                    {lines.map((line) => (
                      <motion.li
                        key={line.product.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-4 overflow-hidden py-5"
                      >
                        <div className="h-16 w-16 shrink-0 rounded-md bg-paper-2 p-1.5">
                          <JarIcon
                            fillColor={line.product.art.fillColor}
                            pattern={line.product.art.pattern}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-display text-[0.95rem] font-semibold">
                            {line.product.name}
                          </h3>
                          <p className="mt-0.5 text-[0.8rem] text-ink-soft">
                            {line.product.priceFormatted} {t.producto.cadaUno}
                          </p>

                          {line.exceedsStock && (
                            <p className="mt-1 text-[0.78rem] font-semibold text-berry">
                              {fill(t.carrito.soloQuedan, { n: line.maxAvailable ?? 0 })}
                            </p>
                          )}

                          <div className="mt-2.5 flex items-center gap-3">
                            <QuantityStepper
                              value={line.quantity}
                              max={line.maxAvailable}
                              onChange={(next) => setQuantity(line.product.id, next)}
                            />
                            <button
                              type="button"
                              onClick={() => remove(line.product.id)}
                              className="text-[0.78rem] text-ink-soft underline-offset-2 transition-colors hover:text-berry hover:underline"
                            >
                              {t.carrito.quitar}
                            </button>
                          </div>
                        </div>

                        <span className="shrink-0 font-display text-[0.95rem] font-bold">
                          {line.subtotalFormatted}
                        </span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}

              {summary && summary.removedProductIds.length > 0 && (
                <p className="mb-4 rounded-md bg-berry/10 px-4 py-3 text-[0.82rem] text-berry">
                  {t.carrito.retirados}
                </p>
              )}
            </div>

            {!isEmpty && summary && (
              <footer className="border-t border-kraft-line bg-paper-2/60 px-6 py-5">
                {summary.missingForFreeDeliveryFormatted && (
                  <p className="mb-3 text-center text-[0.82rem] text-ink-soft">
                    {fill(t.carrito.faltanParaGratis, {
                      monto: summary.missingForFreeDeliveryFormatted,
                    })}
                  </p>
                )}

                <div className="mb-4 flex items-center justify-between font-display">
                  <span className="text-[0.95rem] font-semibold text-ink-soft">{t.carrito.subtotal}</span>
                  <motion.span
                    key={summary.subtotal}
                    initial={{ scale: 1.12 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="text-xl font-bold"
                  >
                    {summary.subtotalFormatted}
                  </motion.span>
                </div>

                <ButtonLink
                  href="/checkout"
                  onClick={closeDrawer}
                  variant="solid"
                  className="w-full"
                >
                  {t.carrito.finalizar}
                </ButtonLink>

                <p className="mt-3 text-center text-[0.76rem] text-ink-soft">
                  {t.carrito.domicilioDespues}
                </p>
              </footer>
            )}

            {isPending && (
              <div
                className="absolute inset-x-0 top-[73px] h-0.5 overflow-hidden bg-kraft-line/30"
                aria-hidden
              >
                <motion.div
                  className="h-full w-1/3 bg-green-deep"
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
      <motion.div
        className="h-24 w-24 opacity-60"
        animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <JarIcon fillColor="#e8dfc6" pattern="drop" />
      </motion.div>
      <p className="font-script text-3xl text-ink-soft">{t.carrito.vacio}</p>
      <p className="max-w-[24ch] text-[0.9rem] text-ink-soft">
        {t.carrito.vacioLead}
      </p>
      <Link
        href="/catalogo"
        onClick={onClose}
        className="mt-2 font-display text-[0.9rem] font-semibold text-green-deep underline underline-offset-4"
      >
        {t.carrito.verCatalogo}
      </Link>
    </div>
  );
}
