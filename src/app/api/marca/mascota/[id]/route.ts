/**
 * Sirve la mascota de una temporada.
 *
 * Existe porque el sistema de archivos de Vercel es de solo lectura: una
 * imagen subida desde el panel no puede terminar en /public, así que se
 * guarda en la base y se entrega por aquí.
 *
 * La caché es agresiva —un año, inmutable— y eso es correcto: la URL lleva
 * `?v=<updatedAt>`, así que cambiar la imagen cambia la URL. La respuesta
 * vieja puede quedarse guardada para siempre porque nadie va a volver a
 * pedirla.
 */

import { container } from '@infra/container';

const UN_AÑO = 60 * 60 * 24 * 365;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const season = await container().branding.seasons.findById(id);
  const mascot = season?.mascot;

  if (!mascot) {
    return new Response('No hay mascota para esta temporada.', { status: 404 });
  }

  // `Uint8Array` → `ArrayBuffer` limpio: pasar el buffer de Node directo
  // puede arrastrar el resto del pool de memoria si la vista es parcial.
  const body = mascot.image.slice().buffer as ArrayBuffer;

  return new Response(body, {
    headers: {
      'Content-Type': mascot.mimeType,
      'Content-Length': String(mascot.image.byteLength),
      'Cache-Control': `public, max-age=${UN_AÑO}, immutable`,
    },
  });
}
