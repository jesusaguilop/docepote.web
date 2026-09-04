import Link from 'next/link';
import { container } from '@infra/container';
import { OrderStatusControls } from '@/components/admin/OrderStatusControls';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { JarIcon, type JarPattern } from '@/components/brand/JarIcon';
import { ClockIcon, FlameIcon, MoneyIcon, OrdersIcon, TrendIcon } from '@/components/admin/icons';

/** El tablero refleja el estado del negocio ahora mismo: nunca se cachea. */
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Resumen' };

export default async function DashboardPage() {
  const { ordering } = container();

  const [summaryResult, ordersResult] = await Promise.all([
    ordering.salesSummary.execute(),
    ordering.list.execute({ limit: 6 }),
  ]);

  const summary = summaryResult.ok ? summaryResult.value : null;
  const recentOrders = ordersResult.ok ? ordersResult.value : [];

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Escala relativa para las barras del ranking: el más vendido llena la
  // barra y el resto se mide contra él.
  const topUnits = summary?.topProducts[0]?.unitsSold ?? 0;

  return (
    <>
      <PageHeader
        eyebrow={today}
        title="Resumen de hoy"
        description="Lo que está pasando en la tienda en este momento."
      />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pedidos hoy"
            value={String(summary.ordersToday)}
            hint={summary.ordersToday === 0 ? 'Todavía no entra ninguno' : 'Desde la medianoche'}
            icon={<OrdersIcon className="h-4 w-4" />}
          />
          <StatCard
            label="Vendido hoy"
            value={summary.revenueTodayFormatted}
            hint="Incluye domicilios, sin pedidos cancelados"
            icon={<MoneyIcon className="h-4 w-4" />}
            tone="money"
          />
          <StatCard
            label="Por confirmar"
            value={String(summary.pendingCount)}
            hint={
              summary.pendingCount > 0
                ? 'Escríbeles para cerrar el pedido'
                : 'Todo al día'
            }
            icon={<ClockIcon className="h-4 w-4" />}
            tone={summary.pendingCount > 0 ? 'attention' : 'neutral'}
          />
          <StatCard
            label="En cocina"
            value={String(summary.inKitchenCount)}
            hint="Confirmados y en preparación"
            icon={<FlameIcon className="h-4 w-4" />}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* ── Últimos pedidos ─────────────────────────────────────────── */}
        <section className="rounded-lg border border-kraft-line/70 bg-white">
          <header className="flex items-center justify-between border-b border-kraft-line/50 px-5 py-4">
            <h2 className="font-display text-[1.02rem] font-bold">Últimos pedidos</h2>
            <Link
              href="/admin/pedidos"
              className="font-display text-[0.82rem] font-semibold text-green-deep underline-offset-4 hover:underline"
            >
              Ver todos
            </Link>
          </header>

          {recentOrders.length === 0 ? (
            <EmptyBlock
              title="Todavía no hay pedidos"
              body="Cuando entre el primero aparecerá aquí, listo para confirmar."
            />
          ) : (
            <ul className="divide-y divide-kraft-line/40">
              {recentOrders.map((order) => (
                <li key={order.id} className="px-5 py-4 transition-colors hover:bg-paper-2/30">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-baseline gap-x-2 font-display">
                        <span className="text-[0.95rem] font-bold tracking-tight">
                          {order.code}
                        </span>
                        <span className="text-[0.9rem] font-medium text-ink-soft">
                          {order.customer.name}
                        </span>
                      </p>

                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-ink-soft">
                        <span className="font-semibold text-ink">{order.totalFormatted}</span>
                        <Dot />
                        <span>
                          {order.itemCount} {order.itemCount === 1 ? 'unidad' : 'unidades'}
                        </span>
                        <Dot />
                        <span>{order.fulfillmentLabel}</span>
                        <Dot />
                        <time dateTime={order.placedAt}>
                          {new Date(order.placedAt).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </p>
                    </div>

                    <OrderStatusControls order={order} compact />
                  </div>

                  {/* Miniaturas de lo pedido: se reconoce el pedido de un vistazo. */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {order.lines.slice(0, 6).map((line) => (
                      <span
                        key={line.productId}
                        title={`${line.quantity} × ${line.productName}`}
                        className="relative h-8 w-8 rounded bg-paper-2 p-1"
                      >
                        <JarIcon
                          fillColor={line.art.fillColor}
                          pattern={line.art.pattern as JarPattern}
                        />
                        {line.quantity > 1 && (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 font-display text-[0.62rem] font-bold text-paper">
                            {line.quantity}
                          </span>
                        )}
                      </span>
                    ))}
                    {order.lines.length > 6 && (
                      <span className="text-[0.76rem] text-ink-soft">
                        +{order.lines.length - 6}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Ranking ─────────────────────────────────────────────────── */}
        <section className="flex flex-col rounded-lg border border-kraft-line/70 bg-white">
          <header className="flex items-center justify-between border-b border-kraft-line/50 px-5 py-4">
            <h2 className="font-display text-[1.02rem] font-bold">Lo más vendido</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-paper-2 px-2.5 py-1 font-display text-[0.72rem] font-bold uppercase tracking-wider text-ink-soft">
              <TrendIcon className="h-3.5 w-3.5" />
              30 días
            </span>
          </header>

          {!summary || summary.topProducts.length === 0 ? (
            <EmptyBlock
              title="Sin datos aún"
              body="Con unas cuantas ventas empezamos a ver qué se mueve más."
            />
          ) : (
            <ol className="flex-1 space-y-4 px-5 py-5">
              {summary.topProducts.map((item, index) => (
                <li key={item.productName}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate font-display text-[0.88rem] font-semibold">
                      <span className="mr-2 text-ink-soft">{index + 1}.</span>
                      {item.productName}
                    </span>
                    <span className="shrink-0 font-display text-[0.88rem] font-bold tabular-nums">
                      {item.unitsSold}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
                    <div
                      className="h-full rounded-full bg-green-deep/70"
                      style={{
                        width: `${topUnits > 0 ? (item.unitsSold / topUnits) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}

          <p className="border-t border-kraft-line/50 px-5 py-4 text-[0.84rem] text-ink-soft">
            Vendido en 30 días{' '}
            <b className="font-display text-ink">
              {summary?.revenueLast30DaysFormatted ?? '—'}
            </b>
          </p>
        </section>
      </div>
    </>
  );
}

function Dot() {
  return (
    <span className="text-kraft-line" aria-hidden>
      ·
    </span>
  );
}

function EmptyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
      <p className="font-script text-3xl text-ink-soft">{title}</p>
      <p className="mt-2 max-w-[34ch] text-[0.86rem] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
