/**
 * WhatsAppOrderGateway — el flujo que usa Doce pote hoy.
 *
 * No cobra en línea: crea el pedido, arma un mensaje con el resumen y manda
 * al cliente a WhatsApp para cerrar por ahí (pago contra entrega o
 * transferencia). Implementa el mismo `PaymentGateway` que Wompi, así que el
 * caso de uso no distingue uno de otro.
 */

import type { Order } from '@core/domain/ordering/order';
import type {
  PaymentGateway,
  PaymentInstruction,
} from '@core/application/ports/payment-gateway';
import { FULFILLMENT_LABELS } from '@core/domain/ordering/fulfillment';

export class WhatsAppOrderGateway implements PaymentGateway {
  readonly method = 'whatsapp' as const;

  constructor(
    private readonly businessNumber: string,
    private readonly siteUrl: string,
  ) {}

  async prepare(order: Order): Promise<PaymentInstruction> {
    // Se enlaza a `api.whatsapp.com/send` y no al atajo `wa.me`: ese último
    // hace un redirect que vuelve a codificar la query y, en el camino,
    // convierte los emojis de 4 bytes (🐱, 📍…) en "?". Yendo directo al
    // endpoint final el mensaje llega intacto — y de paso se ahorra un salto.
    const params = new URLSearchParams({
      phone: this.businessNumber,
      text: this.composeMessage(order),
    });

    return {
      kind: 'redirect',
      url: `https://api.whatsapp.com/send?${params.toString()}`,
      reference: null,
    };
  }

  /**
   * El mensaje se arma para que el negocio lo lea de un vistazo en el celular:
   * código arriba, productos, total y datos de entrega.
   */
  private composeMessage(order: Order): string {
    const lines = order.lines
      .map((line) => `• ${line.quantity.value} × ${line.productName} — ${line.subtotal.format()}`)
      .join('\n');

    const delivery =
      order.fulfillmentMethod === 'delivery'
        ? `\n📍 Dirección: ${order.customer.address ?? '—'}` +
          `\n🛵 Domicilio: ${order.deliveryFee.isZero() ? 'Gratis' : order.deliveryFee.format()}`
        : '';

    const notes = order.customer.notes ? `\n📝 Nota: ${order.customer.notes}` : '';

    return [
      `¡Hola Doce pote! Quiero confirmar mi pedido *${order.code.value}* 🐱🍮`,
      '',
      lines,
      '',
      `Subtotal: ${order.subtotal.format()}`,
      `*Total: ${order.total.format()}*`,
      '',
      `👤 ${order.customer.name}`,
      `📱 ${order.customer.phone.format()}`,
      `🏠 ${FULFILLMENT_LABELS[order.fulfillmentMethod]}${delivery}${notes}`,
      '',
      `Seguimiento: ${this.siteUrl}/pedido/${order.code.value}`,
    ].join('\n');
  }
}
