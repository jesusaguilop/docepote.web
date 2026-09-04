/**
 * WompiGateway — pasarela de pago colombiana (PSE, Nequi, tarjetas).
 *
 * Está implementada y lista: solo faltan las llaves reales. Para activarla,
 * en el .env:
 *
 *     PAYMENT_GATEWAY="wompi"
 *     WOMPI_PUBLIC_KEY="pub_prod_xxx"
 *     WOMPI_PRIVATE_KEY="prv_prod_xxx"
 *     WOMPI_INTEGRITY_SECRET="prod_integrity_xxx"
 *     WOMPI_EVENTS_SECRET="prod_events_xxx"
 *
 * Ni el caso de uso ni la UI del checkout cambian: ambos hablan con la
 * interfaz `PaymentGateway`, no con esta clase (Open/Closed en la práctica).
 *
 * Nota sobre montos: Wompi trabaja en centavos, y el dominio guarda pesos
 * enteros. La conversión ×100 vive aquí y en ningún otro lado.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import type { Order } from '@core/domain/ordering/order';
import type {
  PaymentEvent,
  PaymentGateway,
  PaymentInstruction,
  PaymentWebhookVerifier,
} from '@core/application/ports/payment-gateway';

export interface WompiConfig {
  readonly publicKey: string;
  readonly integritySecret: string;
  readonly eventsSecret: string;
  readonly environment: 'sandbox' | 'production';
  readonly siteUrl: string;
}

const CHECKOUT_URLS = {
  sandbox: 'https://checkout.wompi.co/p/',
  production: 'https://checkout.wompi.co/p/',
} as const;

/** Wompi cobra en centavos; el dominio guarda pesos enteros. */
const CENTS_PER_PESO = 100;

export class WompiGateway implements PaymentGateway, PaymentWebhookVerifier {
  readonly method = 'wompi' as const;

  constructor(private readonly settings: WompiConfig) {}

  async prepare(order: Order): Promise<PaymentInstruction> {
    const reference = order.code.value;
    const amountInCents = order.total.amount * CENTS_PER_PESO;
    const currency = order.total.currency.code;

    const params = new URLSearchParams({
      'public-key': this.settings.publicKey,
      currency,
      'amount-in-cents': String(amountInCents),
      reference,
      'signature:integrity': this.integritySignature(reference, amountInCents, currency),
      'redirect-url': `${this.settings.siteUrl}/pedido/${order.code.value}`,
      'customer-data:full-name': order.customer.name,
      'customer-data:phone-number': order.customer.phone.national,
      'customer-data:phone-number-prefix': '+57',
    });

    return {
      kind: 'redirect',
      url: `${CHECKOUT_URLS[this.settings.environment]}?${params.toString()}`,
      reference,
    };
  }

  /**
   * Firma de integridad exigida por Wompi:
   * SHA-256 de `<referencia><monto><moneda><secreto>`.
   * Sin ella, la pasarela rechaza la transacción — y es lo que impide que
   * alguien edite el monto en la URL antes de pagar.
   */
  private integritySignature(reference: string, amountInCents: number, currency: string): string {
    return createHash('sha256')
      .update(`${reference}${amountInCents}${currency}${this.settings.integritySecret}`)
      .digest('hex');
  }

  /**
   * Verifica un webhook. Wompi firma cada evento con SHA-256 sobre los
   * valores que él mismo indica en `signature.properties`, más el timestamp
   * y el secreto de eventos. Si la firma no cuadra, se descarta: cualquiera
   * puede hacer POST a nuestra URL pública.
   */
  verify(
    rawBody: string,
    _headers: Readonly<Record<string, string | undefined>>,
  ): PaymentEvent | null {
    let payload: WompiEventPayload;
    try {
      payload = JSON.parse(rawBody) as WompiEventPayload;
    } catch {
      return null;
    }

    const transaction = payload?.data?.transaction;
    const signature = payload?.signature;
    if (!transaction || !signature?.checksum || !Array.isArray(signature.properties)) {
      return null;
    }

    const concatenated = signature.properties
      .map((path) => String(readPath(payload.data, path.replace(/^transaction\./, 'transaction.'))))
      .join('');

    const expected = createHash('sha256')
      .update(`${concatenated}${payload.timestamp}${this.settings.eventsSecret}`)
      .digest('hex');

    if (!safeEquals(expected, signature.checksum.toLowerCase())) return null;

    return {
      reference: transaction.id,
      orderCode: transaction.reference,
      status: mapStatus(transaction.status),
      rawAmount: Math.round(transaction.amount_in_cents / CENTS_PER_PESO),
    };
  }
}

interface WompiEventPayload {
  readonly timestamp: number;
  readonly signature?: { readonly checksum?: string; readonly properties?: string[] };
  readonly data?: {
    readonly transaction?: {
      readonly id: string;
      readonly reference: string;
      readonly status: string;
      readonly amount_in_cents: number;
    };
  };
}

function readPath(source: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined,
      source,
    );
}

function mapStatus(status: string): PaymentEvent['status'] {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return 'approved';
    case 'DECLINED':
    case 'ERROR':
      return 'declined';
    case 'VOIDED':
      return 'voided';
    default:
      return 'pending';
  }
}

/** Comparación en tiempo constante: un `===` filtraría la firma byte a byte. */
function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
