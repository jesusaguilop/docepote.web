'use client';

import { useState, useTransition } from 'react';
import { saveDeliverySettings } from '@/app/actions/admin';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { DeliverySettingsDTO } from '@core/application/ordering/delivery-settings.use-cases';

/** Separador de miles colombiano: 60000 → "60.000". */
const pesos = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

/** Deja solo los dígitos: acepta "5.000", "$ 5000" o "5 000" por igual. */
function digitsOf(text: string): string {
  return text.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9);
}

function show(digits: string): string {
  return digits === '' ? '' : pesos.format(Number(digits));
}

const DEFAULT_FREE_THRESHOLD = '60000';

/**
 * Tarifa de domicilio del panel.
 *
 * Los montos se escriben como se dicen —"5.000"— y el campo pone los puntos
 * solo: nadie debería tener que contar ceros para saber si escribió cinco mil
 * o cincuenta mil.
 */
export function DeliverySettingsForm({ initial }: { initial: DeliverySettingsDTO }) {
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();

  const [fee, setFee] = useState(String(initial.fee));
  const [freeEnabled, setFreeEnabled] = useState(initial.freeThreshold > 0);
  const [threshold, setThreshold] = useState(
    initial.freeThreshold > 0 ? String(initial.freeThreshold) : DEFAULT_FREE_THRESHOLD,
  );
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const feeValue = fee === '' ? null : Number(fee);
  const thresholdValue = freeEnabled ? (threshold === '' ? null : Number(threshold)) : 0;

  const dirty =
    feeValue !== saved.fee || (thresholdValue ?? -1) !== saved.freeThreshold;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const localErrors: Record<string, string> = {};
    if (feeValue === null) localErrors.fee = 'Escribe cuánto cuesta el domicilio. Pon 0 si es gratis siempre.';
    if (thresholdValue === null) localErrors.freeThreshold = 'Escribe desde qué monto va gratis.';
    setErrors(localErrors);
    if (feeValue === null || thresholdValue === null) return;

    startTransition(async () => {
      const result = await saveDeliverySettings({ fee: feeValue, freeThreshold: thresholdValue });
      if (!result.ok) {
        setErrors(result.details);
        notify(result.error, 'error');
        return;
      }
      setSaved(result.data);
      notify('Listo, la nueva tarifa ya se cobra en la tienda.');
    });
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-6" noValidate>
      <section className="space-y-6 rounded-md border border-kraft-line bg-white px-6 py-6">
        <MoneyField
          id="delivery-fee"
          label="Costo del domicilio"
          hint="Lo que paga el cliente cuando pide a domicilio. Pon 0 si es gratis siempre."
          value={fee}
          onChange={setFee}
          error={errors.fee}
        />

        <div className="border-t border-kraft-line/60 pt-6">
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={freeEnabled}
              onChange={(event) => setFreeEnabled(event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-green-deep"
            />
            <span>
              <span className="block font-display text-[0.95rem] font-semibold">
                Domicilio gratis en pedidos grandes
              </span>
              <span className="mt-0.5 block text-[0.88rem] text-ink-soft">
                En el carrito se le avisa al cliente cuánto le falta para no pagar domicilio.
              </span>
            </span>
          </label>

          {freeEnabled && (
            <div className="mt-4 pl-8">
              <MoneyField
                id="free-threshold"
                label="Gratis desde"
                hint="Subtotal del pedido, sin contar el domicilio."
                value={threshold}
                onChange={setThreshold}
                error={errors.freeThreshold}
              />
            </div>
          )}
        </div>
      </section>

      <p className="rounded-md bg-paper-2 px-4 py-3 text-[0.92rem]" aria-live="polite">
        <b className="font-display">Así lo verá el cliente:</b>{' '}
        {feeValue === null
          ? 'escribe el costo del domicilio.'
          : feeValue === 0
            ? 'el domicilio es gratis en todos los pedidos.'
            : `el domicilio cuesta $${show(fee)}${
                freeEnabled && thresholdValue
                  ? ` y es gratis en pedidos desde $${show(threshold)}.`
                  : ', sin importar el monto del pedido.'
              }`}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="green" disabled={isPending || !dirty} aria-busy={isPending}>
          {isPending ? 'Guardando…' : 'Guardar tarifa'}
        </Button>
        {!dirty && !isPending && (
          <span className="text-[0.88rem] text-ink-soft">Sin cambios por guardar.</span>
        )}
      </div>
    </form>
  );
}

function MoneyField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (digits: string) => void;
  error?: string;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block font-display text-[0.95rem] font-semibold">
        {label}
      </label>
      <p id={hintId} className="mt-0.5 text-[0.88rem] text-ink-soft">
        {hint}
      </p>
      <div className="relative mt-2 max-w-60">
        <span
          className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-display font-semibold text-ink-soft"
          aria-hidden
        >
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={show(value)}
          onChange={(event) => onChange(digitsOf(event.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          className="min-h-12 w-full rounded-md border border-kraft-line bg-white py-3 pl-8 pr-4 font-display text-[1.05rem] font-semibold tabular-nums outline-none transition-[border-color,box-shadow] focus:border-green-deep focus:ring-3 focus:ring-green-deep/25 aria-invalid:border-berry"
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-[0.88rem] font-semibold text-berry">
          {error}
        </p>
      )}
    </div>
  );
}
