'use server';

/**
 * Acciones de apariencia: crear temporadas, pintarlas y ponerlas.
 *
 * Igual que el resto del panel, cada una verifica la sesión por su cuenta:
 * una Server Action es un endpoint público y nadie debería poder repintar la
 * tienda entera sin haber entrado.
 */

import { revalidatePath } from 'next/cache';
import { container } from '@infra/container';
import { requireAdminForAction } from '@/lib/require-admin';
import { guard, type ActionResult } from '@/lib/action-result';
import { parseMascotMimeType, type Mascot } from '@core/domain/branding/season';
import type { PaletteProps } from '@core/domain/branding/palette';
import type { SeasonDTO } from '@core/application/dto/season.dto';

/**
 * Todas las páginas llevan los colores, así que al cambiarlos hay que
 * refrescarlas todas. `layout` y no `page`: los tokens se inyectan en el
 * layout raíz, y revalidar solo la página dejaría el estilo viejo puesto.
 */
function revalidateStore(): void {
  revalidatePath('/', 'layout');
}

/** Imagen tal como viaja desde el navegador: base64, sin los bytes crudos. */
export interface MascotUpload {
  readonly base64: string;
  readonly mimeType: string;
  readonly alt: string;
}

export interface SaveSeasonFormData {
  readonly id?: string;
  readonly name: string;
  readonly colors: PaletteProps;
  /**
   * `undefined` deja la mascota como está, `null` la quita, un objeto la
   * reemplaza. Se respeta la misma convención del caso de uso para que la
   * intención no se pierda en el camino.
   */
  readonly mascot?: MascotUpload | null;
}

export async function saveSeason(
  form: SaveSeasonFormData,
): Promise<ActionResult<SeasonDTO>> {
  return guard(async () => {
    await requireAdminForAction();

    const result = await container().branding.save.execute({
      ...(form.id ? { id: form.id } : {}),
      name: form.name,
      colors: form.colors,
      ...(form.mascot === undefined ? {} : { mascot: toMascot(form.mascot) }),
    });

    if (result.ok) revalidateStore();
    return result;
  });
}

export async function activateSeason(id: string): Promise<ActionResult<SeasonDTO>> {
  return guard(async () => {
    await requireAdminForAction();
    const result = await container().branding.activate.execute(id);
    if (result.ok) revalidateStore();
    return result;
  });
}

/** Devuelve la tienda a los colores de fábrica sin borrar la temporada. */
export async function deactivateSeasons(): Promise<ActionResult<null>> {
  return guard(async () => {
    await requireAdminForAction();
    const result = await container().branding.deactivate.execute();
    if (result.ok) revalidateStore();
    return result;
  });
}

export async function deleteSeason(id: string): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    await requireAdminForAction();
    const result = await container().branding.remove.execute(id);
    if (result.ok) revalidateStore();
    return result;
  });
}

/** base64 → bytes. El dominio valida tipo, peso y descripción. */
function toMascot(upload: MascotUpload | null): Mascot | null {
  if (!upload) return null;

  return {
    image: Uint8Array.from(Buffer.from(upload.base64, 'base64')),
    mimeType: parseMascotMimeType(upload.mimeType),
    alt: upload.alt.trim(),
  };
}
