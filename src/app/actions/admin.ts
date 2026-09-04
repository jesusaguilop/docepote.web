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
import type { ProductDTO } from '@core/application/dto/product.dto';
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

  const result = await container().identity.login.execute({ email, password });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error.message,
      code: result.error.code,
      details: result.error.details,
    };
  }

  await setSessionCookie(result.value.sessionId, result.value.expiresAt);
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
