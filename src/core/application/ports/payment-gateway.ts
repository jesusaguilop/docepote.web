/**
 * PaymentGateway — el puerto que hace que cambiar de medio de pago no toque
 * el dominio (Open/Closed + Dependency Inversion).
 *
 * Hoy la tienda cierra el pedido por WhatsApp (`WhatsAppOrderGateway`).
 * Cuando lleguen las llaves de Wompi basta con poner PAYMENT_GATEWAY=wompi
 * en el .env: `WompiGateway` implementa esta misma interfaz y nada más
 * cambia — ni el caso de uso, ni la UI del checkout, ni la base de datos.
 */

import type { Order } from '@core/domain/ordering/order';

/**
 * Qué debe hacer el navegador después de crear el pedido.
 *  - `redirect`: mandar al cliente a una URL externa (WhatsApp o el checkout
 *    de la pasarela).
 *  - `confirmed`: el pago ya quedó resuelto en el servidor, solo hay que
 *    mostrar la confirmación.
 */
export type PaymentInstruction =
  | { readonly kind: 'redirect'; readonly url: string; readonly reference: string | null }
  | { readonly kind: 'confirmed'; readonly reference: string };

export interface PaymentGateway {
  /** Identificador del método, tal como se persiste en el pedido. */
  readonly method: 'whatsapp' | 'wompi';

  /** Prepara el cobro de un pedido recién creado. */
  prepare(order: Order): Promise<PaymentInstruction>;
}

/** Evento normalizado que llega desde el webhook de una pasarela. */
export interface PaymentEvent {
  readonly reference: string;
  readonly orderCode: string;
  readonly status: 'approved' | 'declined' | 'voided' | 'pending';
  readonly rawAmount: number;
}

/** Las pasarelas que notifican por webhook implementan además esto. */
export interface PaymentWebhookVerifier {
  /** Valida la firma del evento y lo normaliza. Devuelve `null` si no es confiable. */
  verify(rawBody: string, headers: Readonly<Record<string, string | undefined>>): PaymentEvent | null;
}
