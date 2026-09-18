/**
 * Sirve una foto de producto.
 *
 * Misma idea que la mascota de temporada: los bytes viven en la base porque
 * el disco de Vercel es de solo lectura, y la URL lleva `?v=<updatedAt>`, así
 * que la respuesta puede cachearse para siempre sin miedo a servir una foto
 * vieja — cambiarla cambia la URL.
 */

import { container } from '@infra/container';

const UN_AÑO = 60 * 60 * 24 * 365;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const file = await container().catalog.images.findFile(id);
  if (!file) return new Response('No existe esa foto.', { status: 404 });

  return new Response(file.bytes.slice().buffer as ArrayBuffer, {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(file.bytes.byteLength),
      'Cache-Control': `public, max-age=${UN_AÑO}, immutable`,
    },
  });
}
