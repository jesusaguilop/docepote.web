'use client';

/**
 * Formulario de checkout.
 *
 * El resumen se recalcula en el servidor cada vez que cambia el carrito o el
 * método de entrega, así que el total que ve el cliente es el mismo que se
 * cobrará. La validación fuerte también es del servidor: lo de aquí es
 * cortesía para no hacer ir y volver por un teléfono mal escrito.
 */

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useCart } from './cart-context';
import { useToast } from '@/components/ui/Toast';
import { getCartSummary } from '@/app/actions/cart';
import { placeOrder } from '@/app/actions/orders';
import { JarIcon } from '@/components/brand/JarIcon';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { CartSummaryDTO } from '@core/application/ordering/get-cart-summary.use-case';
import type { FulfillmentMethod } from '@core/domain/ordering/fulfillment';

interface FormState {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

const EMPTY_FORM: FormState = { name: '', phone: '', address: '', notes: '' };

const METHODS: { value: FulfillmentMethod; label: string; hint: string }[] = [
  { value: 'pickup', label: 'Recojo en el punto', hint: 'Sin costo adicional' },
  { value: 'delivery', label: 'Domicilio', hint: 'Dentro de Valledupar' },
];

export function CheckoutForm() {
  const router = useRouter();
  const { items, totalItems, clear, ready } = useCart();
  const { notify } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [method, setMethod] = useState<FulfillmentMethod>('pickup');
  const [summary, setSummary] = useState<CartSummaryDTO | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  // Recalcula el resumen ante cualquier cambio que afecte el total.
  useEffect(() => {
    if (!ready || items.length === 0) return;

    let cancelled = false;
    void getCartSummary(items, method).then((result) => {
      if (!cancelled && result.ok) setSummary(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [items, method, ready]);

  const update = (field: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  /** Validación de cortesía; la que manda es la del dominio. */
  const validateLocally = (): boolean => {
    const errors: Record<string, string> = {};

    if (form.name.trim().length < 2) {
      errors.name = 'Cuéntanos tu nombre.';
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Necesitamos un celular de 10 dígitos.';
    }
    if (method === 'delivery' && form.address.trim().length < 8) {
      errors.address = 'Escribe la dirección completa, con barrio.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!validateLocally()) return;

    startSubmit(async () => {
      const result = await placeOrder(items, {
        name: form.name,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        fulfillmentMethod: method,
      });

      if (!result.ok) {
        setFormError(result.error);
        // El dominio marca el campo culpable cuando puede identificarlo.
        const field = result.details.campo;
        if (field) setFieldErrors({ [field]: result.error });
        notify(result.error, 'error');
        return;
      }

      const { order, payment } = result.data;
      clear();

      // La pasarela decide a dónde va el cliente: hoy WhatsApp, mañana Wompi.
      // Esta pantalla solo obedece la instrucción.
      if (payment.kind === 'redirect') {
        window.open(payment.url, '_blank', 'noopener,noreferrer');
      }

      router.push(`/pedido/${order.code}`);
    });
  };

  if (ready && items.length === 0) {
    return <EmptyCheckout />;
  }

  const submitDisabled = isSubmitting || !summary || summary.hasBlockingIssues;

  return (
    <form
      onSubmit={handleSubmit}
      /* El padding inferior en móvil deja sitio para la barra fija de abajo;
         sin él, el botón tapa las notas del pedido. */
      className="grid items-start gap-12 pb-28 lg:grid-cols-[1.1fr_0.9fr] lg:pb-0"
    >
      <div className="space-y-10">
        {/* ── Entrega ─────────────────────────────────────────────────── */}
        <fieldset>
          <legend className="font-display text-[1.15rem] font-bold">
            ¿Cómo lo quieres recibir?
          </legend>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {METHODS.map((option) => {
              const active = method === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    'relative cursor-pointer rounded-md border p-4 transition-colors duration-200',
                    active
                      ? 'border-green-deep bg-green-deep/6'
                      : 'border-kraft-line bg-white hover:border-kraft-dark',
                  )}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    value={option.value}
                    checked={active}
                    onChange={() => setMethod(option.value)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        active ? 'border-green-deep' : 'border-kraft-line',
                      )}
                      aria-hidden
                    >
                      {active && (
                        <motion.span
                          layoutId="method-dot"
                          className="h-2 w-2 rounded-full bg-green-deep"
                        />
                      )}
                    </span>
                    <span className="font-display text-[0.96rem] font-semibold">
                      {option.label}
                    </span>
                  </span>
                  <span className="mt-1.5 block pl-7 text-[0.82rem] text-ink-soft">
                    {option.hint}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* ── Datos ───────────────────────────────────────────────────── */}
        <fieldset className="space-y-5">
          <legend className="font-display text-[1.15rem] font-bold">Tus datos</legend>

          <Field
            id="name"
            label="Nombre"
            value={form.name}
            onChange={update('name')}
            error={fieldErrors.name}
            autoComplete="name"
            placeholder="Como te decimos"
          />

          <Field
            id="phone"
            label="Celular (WhatsApp)"
            value={form.phone}
            onChange={update('phone')}
            error={fieldErrors.phone}
            autoComplete="tel"
            inputMode="tel"
            placeholder="318 017 3770"
          />

          <AnimatePresence initial={false}>
            {method === 'delivery' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28 }}
                className="overflow-hidden"
              >
                <Field
                  id="address"
                  label="Dirección de entrega"
                  value={form.address}
                  onChange={update('address')}
                  error={fieldErrors.address}
                  autoComplete="street-address"
                  placeholder="Calle 16 #12-30, barrio Novalito"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label
              htmlFor="notes"
              className="mb-1.5 block font-display text-[0.88rem] font-semibold"
            >
              Notas <span className="font-normal text-ink-soft">(opcional)</span>
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={update('notes')}
              rows={3}
              maxLength={400}
              placeholder="Dedicatoria, alergias, hora preferida..."
              className="w-full resize-none rounded-md border border-kraft-line bg-white px-4 py-3 text-[0.94rem] outline-none transition-colors placeholder:text-ink-soft/55 focus:border-green-deep"
            />
          </div>
        </fieldset>
      </div>

      {/* ── Resumen ───────────────────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-28">
        <div className="rounded-md border border-kraft-line bg-white">
          <h2 className="border-b border-kraft-line/60 px-6 py-4 font-display text-[1.05rem] font-bold">
            Tu pedido
            <span className="ml-2 font-normal text-ink-soft">
              ({totalItems} {totalItems === 1 ? 'unidad' : 'unidades'})
            </span>
          </h2>

          <ul className="divide-y divide-kraft-line/40 px-6">
            {(summary?.lines ?? []).map((line) => (
              <li key={line.product.id} className="flex items-center gap-3 py-4">
                <div className="h-11 w-11 shrink-0 rounded bg-paper-2 p-1">
                  <JarIcon
                    fillColor={line.product.art.fillColor}
                    pattern={line.product.art.pattern}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.88rem] font-semibold">{line.product.name}</p>
                  <p className="text-[0.8rem] text-ink-soft">
                    {line.quantity} × {line.product.priceFormatted}
                  </p>
                </div>
                <span className="font-display text-[0.9rem] font-bold">
                  {line.subtotalFormatted}
                </span>
              </li>
            ))}
          </ul>

          {summary && (
            <div className="space-y-2.5 border-t border-kraft-line/60 px-6 py-5 text-[0.92rem]">
              <Row label="Subtotal" value={summary.subtotalFormatted} />
              <Row
                label={method === 'delivery' ? 'Domicilio' : 'Recojo en el punto'}
                value={summary.deliveryFeeFormatted}
                highlight={summary.freeDelivery}
              />

              {summary.missingForFreeDeliveryFormatted && (
                <p className="rounded bg-green-deep/8 px-3 py-2 text-[0.82rem] text-green-deep">
                  Agrega {summary.missingForFreeDeliveryFormatted} más y el domicilio va por
                  nuestra cuenta.
                </p>
              )}

              <div className="flex items-center justify-between border-t border-kraft-line/60 pt-3 font-display">
                <span className="text-[1rem] font-bold">Total</span>
                <motion.span
                  key={summary.total}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-[1.35rem] font-bold"
                >
                  {summary.totalFormatted}
                </motion.span>
              </div>
            </div>
          )}

          <div className="hidden border-t border-kraft-line/60 px-6 py-5 lg:block">
            {formError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded bg-berry/10 px-3 py-2.5 text-[0.85rem] text-berry"
                role="alert"
              >
                {formError}
              </motion.p>
            )}

            <Button type="submit" variant="green" className="w-full" disabled={submitDisabled}>
              {isSubmitting ? 'Confirmando...' : 'Confirmar pedido'}
            </Button>

            <p className="mt-3 text-center text-[0.78rem] leading-relaxed text-ink-soft">
              Al confirmar te abrimos WhatsApp con el resumen para cerrar el pago.
            </p>
          </div>
        </div>
      </aside>

      {/*
        Barra fija de confirmación, solo en móvil y tablet.

        En pantallas angostas el resumen queda debajo del formulario, así que
        el cliente llenaba sus datos sin ver nunca el total ni el botón. Aquí
        los tiene siempre a la vista, con el área segura del iPhone respetada.
      */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-kraft-line bg-paper/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        {formError && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2.5 rounded bg-berry/10 px-3 py-2 text-[0.82rem] text-berry"
            role="alert"
          >
            {formError}
          </motion.p>
        )}

        <div className="flex items-center gap-3">
          <div className="min-w-0 shrink-0">
            <p className="text-[0.72rem] uppercase tracking-wide text-ink-soft">Total</p>
            <p className="font-display text-[1.25rem] font-bold leading-tight tabular-nums">
              {summary?.totalFormatted ?? '—'}
            </p>
          </div>

          <Button
            type="submit"
            variant="green"
            className="h-12 flex-1"
            disabled={submitDisabled}
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar pedido'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className={cn('font-semibold', highlight && 'text-green-deep')}>{value}</span>
    </div>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

function Field({ id, label, error, ...rest }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-display text-[0.88rem] font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'w-full rounded-md border bg-white px-4 py-3 text-[0.94rem] outline-none transition-colors placeholder:text-ink-soft/55',
          error ? 'border-berry focus:border-berry' : 'border-kraft-line focus:border-green-deep',
        )}
        {...rest}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-[0.82rem] text-berry"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyCheckout() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <motion.div
        className="h-28 w-28 opacity-55"
        animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <JarIcon fillColor="#e8dfc6" pattern="drop" />
      </motion.div>
      <p className="font-script text-4xl text-ink-soft">Tu carrito está vacío</p>
      <p className="max-w-[34ch] text-[0.95rem] text-ink-soft">
        Elige algo del catálogo y vuelve — te lo guardamos aquí.
      </p>
      <Link
        href="/catalogo"
        className="mt-3 rounded-sm bg-ink px-6 py-3.5 font-display font-semibold text-paper transition-colors hover:bg-[#100b06]"
      >
        Ir al catálogo
      </Link>
    </div>
  );
}
