'use client';

/**
 * Rescate del enlace de pago cuando el navegador bloquea la ventana.
 *
 * El checkout abre WhatsApp con `window.open` después de crear el pedido,
 * pero para entonces ya hubo un `await`: Chrome y Safari consideran que el
 * gesto del usuario caducó y bloquean la ventana emergente sin avisar. El
 * pedido quedaba guardado y el negocio nunca recibía el mensaje.
 *
 * Cuando eso pasa, el checkout deja el enlace aquí guardado y esta tarjeta lo
 * ofrece como un botón normal: un clic directo del usuario nunca se bloquea.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

const STORAGE_PREFIX = 'docepote.pago.';

/** Guarda el enlace para que la página del pedido pueda ofrecerlo. */
export function rememberPaymentHandoff(orderCode: string, url: string): void {
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${orderCode}`, url);
  } catch {
    // Almacenamiento bloqueado (modo privado): no hay rescate posible, pero
    // el pedido ya está creado y visible en el panel.
  }
}

export function PaymentHandoff({ orderCode }: { orderCode: string }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);

  // Se lee después del montaje: sessionStorage no existe en el servidor.
  useEffect(() => {
    try {
      setUrl(window.sessionStorage.getItem(`${STORAGE_PREFIX}${orderCode}`));
    } catch {
      setUrl(null);
    }
  }, [orderCode]);

  if (!url) return null;

  return (
    <div className="mt-8 rounded-md border border-berry/30 bg-berry/8 px-6 py-5 text-center">
      <p className="text-[0.9rem] text-ink-soft">{t.pedido.enviarWhatsAppLead}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          try {
            window.sessionStorage.removeItem(`${STORAGE_PREFIX}${orderCode}`);
          } catch {
            // Da igual: el enlace ya se abrió.
          }
        }}
        className="mt-4 inline-flex items-center rounded-sm bg-green-deep px-6 py-3 font-display font-semibold text-white transition-colors hover:bg-green-dark"
      >
        {t.pedido.enviarWhatsApp}
      </a>
    </div>
  );
}
