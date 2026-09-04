/**
 * Webhook de Wompi.
 *
 * Esta URL es pública: cualquiera puede hacerle POST. Por eso lo primero que
 * ocurre es verificar la firma del evento; si no cuadra, se descarta sin
 * tocar nada. Sin esa verificación, alguien podría marcar pedidos como
 * pagados con un simple `curl`.
 *
 * Solo hace algo cuando `PAYMENT_GATEWAY=wompi`. Con el flujo de WhatsApp
 * activo responde 404, como cualquier ruta que no existe.
 */

import { NextResponse } from 'next/server';
import { container } from '@infra/container';
import { config } from '@infra/config/env';
import { WompiGateway } from '@infra/payments/wompi.gateway';
import { isDomainError } from '@core/domain/shared/errors';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const settings = config();

  if (settings.PAYMENT_GATEWAY !== 'wompi') {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const gateway = new WompiGateway({
    publicKey: settings.WOMPI_PUBLIC_KEY,
    integritySecret: settings.WOMPI_INTEGRITY_SECRET,
    eventsSecret: settings.WOMPI_EVENTS_SECRET,
    environment: settings.WOMPI_ENVIRONMENT,
    siteUrl: settings.SITE_URL,
  });

  // El cuerpo se lee crudo: la firma se calcula sobre el texto exacto que
  // envió Wompi, y volver a serializar el JSON lo alteraría.
  const rawBody = await request.text();

  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const event = gateway.verify(rawBody, headers);
  if (!event) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  const { ordering } = container();

  const orderResult = await ordering.getByCode.execute(event.orderCode);
  if (!orderResult.ok) {
    // Se responde 200 igual: si devolviéramos error, Wompi reintentaría en
    // bucle un evento que nunca vamos a poder procesar.
    console.warn(`[wompi] evento para un pedido desconocido: ${event.orderCode}`);
    return NextResponse.json({ received: true });
  }

  const order = orderResult.value;

  try {
    if (event.status === 'approved' && order.status === 'pending') {
      await ordering.changeStatus.execute({ orderId: order.id, status: 'confirmed' });
    } else if (event.status === 'declined' || event.status === 'voided') {
      await ordering.changeStatus.execute({ orderId: order.id, status: 'cancelled' });
    }
  } catch (error) {
    // Una transición ilegal (el pedido ya avanzó por otro lado) no es motivo
    // para pedirle a Wompi que reintente.
    if (!isDomainError(error)) throw error;
    console.warn(`[wompi] transición ignorada para ${order.code}:`, error.message);
  }

  return NextResponse.json({ received: true });
}
