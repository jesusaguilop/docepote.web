'use client';

import { motion } from 'motion/react';
import { ORDER_STATUSES, type OrderStatus } from '@core/domain/ordering/order-status';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/cn';

/**
 * Estado del pedido.
 *
 * En celular va en vertical y en escritorio en horizontal. No es un capricho:
 * cinco columnas en una pantalla de 390px dejan 78px por paso, y etiquetas
 * como "En preparación" se parten en tres líneas. En vertical cada paso tiene
 * el ancho completo y además caben las descripciones.
 */
export function OrderTracker({ status }: { status: OrderStatus }) {
  const { t, fill } = useTranslation();

  /** Los pasos que el cliente ve; "cancelado" se muestra aparte. */
  const VISIBLE_STEPS: { status: OrderStatus; label: string; hint: string }[] = [
    { status: 'pending', label: t.pedido.pasos.recibido, hint: t.pedido.pasos.recibidoHint },
    { status: 'confirmed', label: t.pedido.pasos.confirmado, hint: t.pedido.pasos.confirmadoHint },
    { status: 'preparing', label: t.pedido.pasos.preparacion, hint: t.pedido.pasos.preparacionHint },
    { status: 'ready', label: t.pedido.pasos.listo, hint: t.pedido.pasos.listoHint },
    { status: 'delivered', label: t.pedido.pasos.entregado, hint: t.pedido.pasos.entregadoHint },
  ];

  if (status === 'cancelled') {
    return (
      <div className="rounded-md border border-berry/30 bg-berry/5 px-5 py-5 sm:px-6">
        <p className="font-display font-bold text-berry">{t.pedido.cancelado}</p>
        <p className="mt-1 text-[0.9rem] text-ink-soft">
          {t.pedido.canceladoLead}
        </p>
      </div>
    );
  }

  const currentIndex = VISIBLE_STEPS.findIndex((step) => step.status === status);
  // Un estado fuera de la lista visible no debe dejar la barra en -1.
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const progress = activeIndex / (VISIBLE_STEPS.length - 1);

  return (
    <div>
      {/* ── Celular: lista vertical ─────────────────────────────────── */}
      <ol className="relative sm:hidden">
        {/* Riel vertical y su relleno. */}
        <div className="absolute bottom-4 left-4 top-4 w-0.5 -translate-x-1/2 bg-kraft-line/50" aria-hidden />
        <motion.div
          className="absolute left-4 top-4 w-0.5 origin-top -translate-x-1/2 bg-green-deep"
          style={{ bottom: '1rem' }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: progress }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />

        {VISIBLE_STEPS.map((step, index) => {
          const done = index <= activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * index, type: 'spring', stiffness: 400, damping: 24 }}
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[0.72rem] font-bold transition-colors',
                  done
                    ? 'border-green-deep bg-green-deep text-white'
                    : 'border-kraft-line bg-paper text-ink-soft',
                )}
              >
                {done ? '✓' : index + 1}
                {isCurrent && status !== 'delivered' && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-green-deep"
                    animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
                    transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut' }}
                    aria-hidden
                  />
                )}
              </motion.span>

              <div className="pt-1">
                <p
                  className={cn(
                    'font-display text-[0.95rem] font-semibold leading-tight',
                    done ? 'text-ink' : 'text-ink-soft',
                  )}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-[0.82rem] text-ink-soft">{step.hint}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* ── Tablet y escritorio: barra horizontal ───────────────────── */}
      <div className="relative hidden sm:block">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-kraft-line/50" aria-hidden />
        <motion.div
          className="absolute left-0 right-0 top-4 h-0.5 origin-left bg-green-deep"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />

        <ol className="relative grid grid-cols-5 gap-1">
          {VISIBLE_STEPS.map((step, index) => {
            const done = index <= activeIndex;
            const isCurrent = index === activeIndex;

            return (
              <li key={step.status} className="flex flex-col items-center text-center">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.12 * index, type: 'spring', stiffness: 400, damping: 24 }}
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-[0.72rem] font-bold transition-colors',
                    done
                      ? 'border-green-deep bg-green-deep text-white'
                      : 'border-kraft-line bg-paper text-ink-soft',
                  )}
                >
                  {done ? '✓' : index + 1}
                  {isCurrent && status !== 'delivered' && (
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-green-deep"
                      animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
                      transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut' }}
                      aria-hidden
                    />
                  )}
                </motion.span>

                <span
                  className={cn(
                    'mt-2.5 font-display text-[0.8rem] font-semibold leading-tight lg:text-[0.86rem]',
                    done ? 'text-ink' : 'text-ink-soft',
                  )}
                >
                  {step.label}
                </span>

                {isCurrent && (
                  <span className="mt-0.5 hidden text-[0.74rem] text-ink-soft lg:block">
                    {step.hint}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <p className="sr-only">
        {fill(t.pedido.pasoDe, {
          estado: VISIBLE_STEPS[activeIndex]?.label ?? '',
          actual: activeIndex + 1,
          total: VISIBLE_STEPS.length,
        })}
      </p>

      {/* Se referencia la lista completa de estados del dominio para que este
          componente falle en compilación si allá se agrega uno nuevo. */}
      <span hidden data-known-statuses={ORDER_STATUSES.join(',')} />
    </div>
  );
}
