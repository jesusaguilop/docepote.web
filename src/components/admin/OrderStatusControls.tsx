'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { changeOrderStatus } from '@/app/actions/admin';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import type { OrderDTO } from '@core/application/dto/order.dto';
import type { OrderStatus } from '@core/domain/ordering/order-status';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-caramel/15 text-caramel',
  confirmed: 'bg-green/15 text-green-deep',
  preparing: 'bg-green/20 text-green-dark',
  ready: 'bg-green-deep/15 text-green-dark',
  delivered: 'bg-ink/10 text-ink-soft',
  cancelled: 'bg-berry/12 text-berry',
};

/**
 * Insignia de estado y botones de avance.
 *
 * Los botones no están escritos aquí: salen de `order.nextStatuses`, que el
 * DTO calcula pidiéndole las transiciones legales al dominio. Si mañana se
 * agrega un estado nuevo, este componente lo muestra sin tocarlo.
 */
export function OrderStatusControls({
  order,
  compact = false,
}: {
  order: OrderDTO;
  compact?: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();

  const move = (status: OrderStatus, label: string) => {
    startTransition(async () => {
      const result = await changeOrderStatus(order.id, status);

      if (!result.ok) {
        notify(result.error, 'error');
        return;
      }

      notify(`${order.code} → ${label}`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <motion.span
        key={order.status}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'rounded-full px-3 py-1 font-display text-[0.76rem] font-bold',
          STATUS_STYLES[order.status],
        )}
      >
        {order.statusLabel}
      </motion.span>

      {order.nextStatuses.map((next) => {
        const isCancel = next.value === 'cancelled';

        // En modo compacto solo se ofrece el avance natural; cancelar exige
        // entrar al detalle, para no perder un pedido con un clic distraído.
        if (compact && isCancel) return null;

        return (
          <button
            key={next.value}
            type="button"
            disabled={isPending}
            onClick={() => move(next.value, next.label)}
            className={cn(
              'rounded-full border px-3 py-1 font-display text-[0.78rem] font-semibold transition-colors disabled:opacity-50',
              isCancel
                ? 'border-berry/40 text-berry hover:bg-berry hover:text-white'
                : 'border-kraft-line text-ink-soft hover:border-ink hover:bg-ink hover:text-paper',
            )}
          >
            {isCancel ? 'Cancelar' : `→ ${next.label}`}
          </button>
        );
      })}
    </div>
  );
}
