'use client';

import { motion } from 'motion/react';
import { ORDER_STATUSES, type OrderStatus } from '@core/domain/ordering/order-status';
import { cn } from '@/lib/cn';

/** Los pasos que el cliente ve; "cancelado" se muestra aparte. */
const VISIBLE_STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: 'pending', label: 'Recibido', hint: 'Ya nos llegó tu pedido' },
  { status: 'confirmed', label: 'Confirmado', hint: 'Lo confirmamos contigo' },
  { status: 'preparing', label: 'En preparación', hint: 'Manos a la obra' },
  { status: 'ready', label: 'Listo', hint: 'Listo para salir' },
  { status: 'delivered', label: 'Entregado', hint: '¡Que lo disfrutes!' },
];

export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="rounded-md border border-berry/30 bg-berry/5 px-6 py-5">
        <p className="font-display font-bold text-berry">Pedido cancelado</p>
        <p className="mt-1 text-[0.9rem] text-ink-soft">
          Si crees que fue un error, escríbenos por WhatsApp y lo revisamos.
        </p>
      </div>
    );
  }

  const currentIndex = VISIBLE_STEPS.findIndex((step) => step.status === status);
  // Un estado fuera de la lista visible no debe dejar la barra en -1.
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const progress = activeIndex / (VISIBLE_STEPS.length - 1);

  return (
    <div className="relative">
      {/* Riel de fondo y su relleno animado. */}
      <div className="absolute left-0 right-0 top-4 h-0.5 bg-kraft-line/50" aria-hidden />
      <motion.div
        className="absolute left-0 top-4 h-0.5 origin-left bg-green-deep"
        style={{ right: 0 }}
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
                  'mt-2.5 font-display text-[0.76rem] font-semibold leading-tight sm:text-[0.84rem]',
                  done ? 'text-ink' : 'text-ink-soft',
                )}
              >
                {step.label}
              </span>

              {isCurrent && (
                <span className="mt-0.5 hidden text-[0.74rem] text-ink-soft sm:block">
                  {step.hint}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <p className="sr-only">
        Estado actual del pedido: {VISIBLE_STEPS[activeIndex]?.label}. Paso{' '}
        {activeIndex + 1} de {VISIBLE_STEPS.length}.
      </p>

      {/* Se referencia la lista completa de estados del dominio para que este
          componente falle en compilación si allá se agrega uno nuevo. */}
      <span hidden data-known-statuses={ORDER_STATUSES.join(',')} />
    </div>
  );
}
