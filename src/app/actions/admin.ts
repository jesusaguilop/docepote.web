'use server';

/**
 * Acciones del panel de administración.
 *
 * Cada una verifica la sesión por su cuenta con `requireAdminForAction()`. Es
 * a propósito: una Server Action es un endpoint público: el navegador puede
 * llamarla directamente sin haber cargado el layout protegido. Confiar en que
 * "solo se invoca desde una página con sesión" es exactamente cómo se filtra
 * un panel.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { container } from '@infra/container';
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from '@infra/auth/session-cookie';
import { requireAdminForAction } from '@/lib/require-admin';
import { guard, type ActionResult } from '@/lib/action-result';
import type { ProductDTO, ProductImageDTO } from '@core/application/dto/product.dto';
import { parseImageMimeType } from '@core/domain/catalog/product-image';
import type { OrderDTO } from '@core/application/dto/order.dto';
import type { SaveProductInput } from '@core/application/catalog/save-product.use-case';

/** Rutas públicas que dependen del catálogo y hay que refrescar tras un cambio. */
const PUBLIC_CATALOG_PATHS = ['/', '/catalogo'];

function revalidateCatalog(slug?: string): void {
  for (const path of PUBLIC_CATALOG_PATHS) revalidatePath(path);
  if (slug) revalidatePath(`/producto/${slug}`);
  revalidatePath('/admin/productos');
}

// ── Sesión ─────────────────────────────────────────────────────────────

export async function login(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  /*
   * El `try` cubre la infraestructura, no la credencial.
   *
   * Si la base no responde —variable de entorno mal puesta en el despliegue,
   * Neon dormida, red caída— aquí volaba una excepción sin atrapar. En
   * producción Next se queda el mensaje para sí y el formulario no hace nada
   * visible: se pulsa "Entrar" y no pasa absolutamente nada, que es la peor
   * forma de fallar. Ahora sale un aviso en pantalla y el motivo real queda en
   * los logs del servidor.
   *
   * `redirect()` va fuera a propósito: lanza para navegar, y atraparlo aquí
   * dejaría al administrador en el login con la sesión ya iniciada.
   */
  let session: { sessionId: string; expiresAt: Date };

  try {
    const result = await container().identity.login.execute({ email, password });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error.message,
        code: result.error.code,
        details: result.error.details,
      };
    }

    session = result.value;
  } catch (error) {
    console.error('[login] no se pudo verificar la credencial:', error);
    return {
      ok: false,
      error: 'No pudimos conectar con la base de datos. Intenta de nuevo en un momento.',
      code: 'UNEXPECTED',
      details: {},
    };
  }

  await setSessionCookie(session.sessionId, session.expiresAt);
  redirect('/admin');
}

export async function logout(): Promise<void> {
  await container().identity.logout.execute(await readSessionCookie());
  await clearSessionCookie();
  redirect('/admin/login');
}

// ── Catálogo ───────────────────────────────────────────────────────────

export async function saveProduct(
  input: SaveProductInput,
): Promise<ActionResult<ProductDTO>> {
  return guard(async () => {
    await requireAdminForAction();
    const result = await container().catalog.save.execute(input);
    if (result.ok) revalidateCatalog(result.value.slug);
    return result;
  });
}

export async function toggleProductAvailability(
  id: string,
): Promise<ActionResult<ProductDTO>> {
  return guard(async () => {
    await requireAdminForAction();
    const result = await container().catalog.toggleAvailability.execute(id);
    if (result.ok) revalidateCatalog(result.value.slug);
    return result;
  });
}

export async function setProductStock(
  id: string,
  stock: number | null,
): Promise<ActionResult<ProductDTO>> {
  return guard(async () => {
    await requireAdminForAction();
    const result = await container().catalog.setStock.execute(id, stock);
    if (result.ok) revalidateCatalog(result.value.slug);
    return result;
  });
}

export async function deleteProduct(id: string): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    await requireAdminForAction();
    const result = await container().catalog.remove.execute(id);
    if (result.ok) revalidateCatalog();
    return result;
  });
}

// ── Pedidos ────────────────────────────────────────────────────────────

export async function changeOrderStatus(
  orderId: string,
  status: string,
): Promise<ActionResult<OrderDTO>> {
  return guard(async () => {
    await requireAdminForAction();
    const result = await container().ordering.changeStatus.execute({ orderId, status });

    if (result.ok) {
      revalidatePath('/admin');
      revalidatePath('/admin/pedidos');
      // La página pública de seguimiento debe reflejar el nuevo estado.
      revalidatePath(`/pedido/${result.value.code}`);
    }

    return result;
  });
}

// ── Fotos de producto ──────────────────────────────────────────────────

/** Foto tal como viaja desde el navegador: base64, ya redimensionada allá. */
export interface ProductImageUpload {
  readonly base64: string;
  readonly mimeType: string;
  readonly alt: string;
}

export async function addProductImage(
  productId: string,
  upload: ProductImageUpload,
): Promise<ActionResult<ProductImageDTO[]>> {
  return guard(async () => {
    await requireAdminForAction();

    const result = await container().catalog.addImage.execute({
      productId,
      image: {
        bytes: Uint8Array.from(Buffer.from(upload.base64, 'base64')),
        mimeType: parseImageMimeType(upload.mimeType),
        alt: upload.alt,
      },
    });

    if (result.ok) revalidateCatalog();
    return result;
  });
}

export async function deleteProductImage(
  imageId: string,
): Promise<ActionResult<ProductImageDTO[]>> {
  return guard(async () => {
    await requireAdminForAction();
    const result = await container().catalog.removeImage.execute(imageId);
    if (result.ok) revalidateCatalog();
    return result;
  });
}

export async function reorderProductImages(
  productId: string,
  orderedIds: string[],
): Promise<ActionResult<ProductImageDTO[]>> {
  return guard(async () => {
    await requireAdminForAction();
    const result = await container().catalog.reorderImages.execute({ productId, orderedIds });
    if (result.ok) revalidateCatalog();
    return result;
  });
}
