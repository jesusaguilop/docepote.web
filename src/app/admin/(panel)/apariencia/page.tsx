import { container } from '@infra/container';
import { PageHeader } from '@/components/admin/PageHeader';
import { SeasonManager } from '@/components/admin/SeasonManager';
import type { SeasonDTO } from '@core/application/dto/season.dto';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Apariencia' };

/**
 * Lee las temporadas sin poder tumbar la pantalla.
 *
 * Un fallo de infraestructura aquí —la base dormida, la tabla todavía sin
 * crear tras un despliegue— dejaría el panel en un 500 sin explicación. Es
 * mejor entrar y ver que no se pudo leer: desde esta misma pantalla se
 * arregla la apariencia, y no se arregla nada si no se puede abrir.
 */
async function loadSeasons(): Promise<{ seasons: SeasonDTO[]; failed: boolean }> {
  try {
    const result = await container().branding.list.execute();
    return { seasons: result.ok ? result.value : [], failed: !result.ok };
  } catch (error) {
    console.error('[apariencia] no se pudieron leer las temporadas:', error);
    return { seasons: [], failed: true };
  }
}

export default async function AdminAppearancePage() {
  const { seasons, failed } = await loadSeasons();

  return (
    <>
      <PageHeader
        eyebrow="Marca"
        title="Apariencia"
        description="Viste la tienda para una fecha especial: sus colores y la mascota del inicio. Guarda cuantas temporadas quieras y cámbialas con un clic, sin tocar el código."
      />

      {failed && (
        <p
          className="mb-6 rounded-md bg-berry/10 px-4 py-3 text-[0.88rem] text-berry"
          role="alert"
        >
          No pudimos leer las temporadas guardadas. Recarga en un momento; si sigue igual,
          avísale a quien lleva el sitio.
        </p>
      )}

      <SeasonManager seasons={seasons} />
    </>
  );
}
