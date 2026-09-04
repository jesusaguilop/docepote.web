import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { container } from '@infra/container';
import { JarIcon } from '@/components/brand/JarIcon';
import { OrderTracker } from '@/components/store/OrderTracker';
import { Confetti } from '@/components/store/Confetti';
import { ButtonLink } from '@/components/ui/Button';
import type { JarPattern } from '@/components/brand/JarIcon';

export const metadata: Metadata = {
  title: 'Tu pedido',
  // Un pedido lleva datos personales: fuera de los buscadores.
  robots: { index: false, follow: false },
};

/** El estado cambia desde el panel, así que esta página nunca se cachea. */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function OrderPage({ params }: PageProps) {
  const { code } = await params;
  const { ordering, config } = container();

  const result = await ordering.getByCode.execute(code);
  if (!result.ok) notFound();

  const order = result.value;
  const justPlaced = order.status === 'pending';

  return (
    <div className="wrap max-w-3xl py-16">
      {justPlaced && <Confetti />}

      <header className="text-center">
        <p className="font-script text-4xl text-green-deep">
          {justPlaced ? '¡Gracias!' : 'Tu pedido'}
        </p>
        <h1 className="mt-3 text-[clamp(1.8rem,3.2vw,2.4rem)] font-bold">
          Pedido {order.code}
        </h1>
        <p className="mt-3 text-[0.98rem] text-ink-soft">
          {justPlaced
            ? `Ya nos llegó, ${order.customer.name.split(' ')[0]}. Te confirmamos por WhatsApp en un momento.`
            : `Estado actual: ${order.statusLabel}.`}
        </p>
      </header>

      <div className="mt-14 rounded-md border border-kraft-line bg-white px-6 py-8 sm:px-10">
        <OrderTracker status={order.status} />
      </div>

      <section className="mt-8 rounded-md border border-kraft-line bg-white">
        <h2 className="border-b border-kraft-line/60 px-6 py-4 font-display text-[1.05rem] font-bold">
          Lo que pediste
        </h2>

        <ul className="divide-y divide-kraft-line/40 px-6">
          {order.lines.map((line) => (
            <li key={line.productId} className="flex items-center gap-4 py-4">
              <div className="h-12 w-12 shrink-0 rounded bg-paper-2 p-1">
                <JarIcon
                  fillColor={line.art.fillColor}
                  pattern={line.art.pattern as JarPattern}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[0.94rem] font-semibold">
                  {line.productName}
                </p>
                <p className="text-[0.82rem] text-ink-soft">
                  {line.quantity} × {line.unitPriceFormatted}
                </p>
              </div>
              <span className="font-display text-[0.94rem] font-bold">
                {line.subtotalFormatted}
              </span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-kraft-line/60 px-6 py-5 text-[0.92rem]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="font-semibold">{order.subtotalFormatted}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">{order.fulfillmentLabel}</dt>
            <dd className={order.hasFreeDelivery ? 'font-semibold text-green-deep' : 'font-semibold'}>
              {order.deliveryFeeFormatted}
            </dd>
          </div>
          <div className="flex justify-between border-t border-kraft-line/60 pt-3 font-display">
            <dt className="text-[1rem] font-bold">Total</dt>
            <dd className="text-[1.3rem] font-bold">{order.totalFormatted}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 grid gap-4 rounded-md border border-kraft-line bg-paper-2/50 px-6 py-6 sm:grid-cols-2">
        <div>
          <h3 className="font-display text-[0.8rem] font-bold uppercase tracking-wider text-ink-soft">
            Datos de entrega
          </h3>
          <p className="mt-2 text-[0.92rem]">{order.customer.name}</p>
          <p className="text-[0.92rem] text-ink-soft">{order.customer.phoneFormatted}</p>
          {order.customer.address && (
            <p className="mt-1 text-[0.92rem] text-ink-soft">{order.customer.address}</p>
          )}
        </div>

        {order.customer.notes && (
          <div>
            <h3 className="font-display text-[0.8rem] font-bold uppercase tracking-wider text-ink-soft">
              Notas
            </h3>
            <p className="mt-2 text-[0.92rem] text-ink-soft">{order.customer.notes}</p>
          </div>
        )}
      </section>

      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <p className="text-[0.88rem] text-ink-soft">
          Guarda este enlace para seguir tu pedido cuando quieras.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href="/catalogo" variant="outline" size="sm">
            Seguir comprando
          </ButtonLink>
          <Link
            href={`https://wa.me/${config.WHATSAPP_NUMBER}?text=${encodeURIComponent(
              `Hola, pregunto por mi pedido ${order.code}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-sm bg-green-deep px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-green-dark"
          >
            Escribir por WhatsApp
          </Link>
        </div>
      </div>
    </div>
  );
}
