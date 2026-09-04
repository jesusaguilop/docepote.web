import Link from 'next/link';
import { container } from '@infra/container';
import { OrderStatusControls } from '@/components/admin/OrderStatusControls';
import { PageHeader } from '@/components/admin/PageHeader';
import { JarIcon, type JarPattern } from '@/components/brand/JarIcon';
import { SearchIcon } from '@/components/admin/icons';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  isOrderStatus,
} from '@core/domain/ordering/order-status';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pedidos' };

interface PageProps {
  searchParams: Promise<{ estado?: string; q?: string }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const { estado, q } = await searchParams;
  const { ordering } = container();

  const result = await ordering.list.execute({ status: estado, search: q, limit: 120 });
  const orders = result.ok ? result.value : [];

  const activeStatusLabel = estado && isOrderStatus(estado) ? ORDER_STATUS_LABELS[estado] : null;

  const filters: { value?: string; label: string }[] = [
    { label: 'Todos' },
    ...ORDER_STATUSES.map((status) => ({
      value: status as string,
      label: ORDER_STATUS_LABELS[status],
    })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Bandeja"
        title="Pedidos"
        description="Confirma, manda a cocina y marca entregas. Cada pedido avanza solo por los pasos que permite su estado."
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1"
          aria-label="Filtrar por estado"
        >
          {filters.map((filter) => {
            const active = estado === filter.value || (!estado && !filter.value);
            return (
              <Link
                key={filter.label}
                href={filter.value ? `/admin/pedidos?estado=${filter.value}` : '/admin/pedidos'}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 font-display text-[0.82rem] font-semibold transition-colors',
                  active
                    ? 'border-ink bg-ink text-paper'
                    : 'border-kraft-line/70 bg-white text-ink-soft hover:border-ink hover:text-ink',
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        {/* Buscador sin JavaScript: un GET normal que recarga con el filtro. */}
        <form className="relative lg:w-72">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Código, nombre o celular"
            aria-label="Buscar pedidos"
            className="w-full rounded-full border border-kraft-line/70 bg-white py-2 pl-10 pr-4 text-[0.88rem] outline-none transition-colors placeholder:text-ink-soft/60 focus:border-green-deep"
          />
          {estado && <input type="hidden" name="estado" value={estado} />}
        </form>
      </div>

      <p className="mb-4 text-[0.86rem] text-ink-soft">
        {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        {activeStatusLabel ? ` en estado “${activeStatusLabel}”` : ''}
        {q ? ` que coinciden con “${q}”` : ''}.
      </p>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-kraft-line py-20 text-center">
          <p className="font-script text-3xl text-ink-soft">Nada por aquí</p>
          <p className="mt-2 text-[0.88rem] text-ink-soft">
            Prueba con otro filtro o limpia la búsqueda.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="overflow-hidden rounded-lg border border-kraft-line/70 bg-white transition-shadow hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-kraft-line/40 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-display text-[1.05rem] font-bold tracking-tight">
                    {order.code}
                  </p>
                  <p className="mt-0.5 text-[0.82rem] text-ink-soft">
                    <time dateTime={order.placedAt}>
                      {new Date(order.placedAt).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </p>
                </div>
                <OrderStatusControls order={order} />
              </div>

              <div className="grid gap-5 px-5 py-4 lg:grid-cols-[1.35fr_1fr]">
                <div>
                  <ul className="space-y-2.5">
                    {order.lines.map((line) => (
                      <li key={line.productId} className="flex items-center gap-3">
                        <span className="h-9 w-9 shrink-0 rounded bg-paper-2 p-1">
                          <JarIcon
                            fillColor={line.art.fillColor}
                            pattern={line.art.pattern as JarPattern}
                          />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[0.88rem]">
                          <b className="font-display">{line.quantity}×</b> {line.productName}
                        </span>
                        <span className="shrink-0 text-[0.86rem] tabular-nums text-ink-soft">
                          {line.subtotalFormatted}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-baseline justify-between border-t border-kraft-line/40 pt-3">
                    <span className="font-display text-[0.9rem] font-semibold text-ink-soft">
                      Total
                      <span className="ml-2 font-normal text-[0.8rem]">
                        (entrega {order.deliveryFeeFormatted})
                      </span>
                    </span>
                    <span className="font-display text-[1.15rem] font-bold tabular-nums">
                      {order.totalFormatted}
                    </span>
                  </div>
                </div>

                <div className="rounded-md bg-paper-2/50 px-4 py-3.5 text-[0.86rem]">
                  <p className="font-display font-semibold">{order.customer.name}</p>
                  <a
                    href={`https://wa.me/${order.customer.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-deep underline underline-offset-2"
                  >
                    {order.customer.phoneFormatted}
                  </a>

                  <p className="mt-2.5 font-display text-[0.78rem] font-bold uppercase tracking-wider text-ink-soft">
                    {order.fulfillmentLabel}
                  </p>
                  {order.customer.address && (
                    <p className="mt-0.5 leading-snug text-ink-soft">{order.customer.address}</p>
                  )}

                  {order.customer.notes && (
                    <p className="mt-3 rounded bg-caramel/10 px-3 py-2 leading-snug text-ink">
                      <b className="font-display">Nota:</b> {order.customer.notes}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
