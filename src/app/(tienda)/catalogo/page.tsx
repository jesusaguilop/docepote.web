import type { Metadata } from 'next';
import { container } from '@infra/container';
import { CatalogGrid } from '@/components/store/CatalogGrid';
import { Reveal } from '@/components/ui/Reveal';
import { getTranslations } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Catálogo',
  description:
    'Todos los bolo no pote de DOCEPOTE: individuales de 8 oz, minis y kits para eventos, hechos a mano en Valledupar.',
};

/**
 * Se renderiza por petición: el idioma está en una cookie y el inventario
 * cambia durante el día. La disponibilidad real se vuelve a verificar al
 * agregar al carrito y al confirmar, así que nadie compra lo que ya no hay.
 */
export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const { catalog } = container();
  const { locale, t } = await getTranslations();

  const result = await catalog.list.execute({ onlyActive: true, locale });
  const products = result.ok ? result.value : [];

  return (
    <div className="wrap py-16">
      <Reveal>
        <header className="mb-12 max-w-[54ch]">
          <p className="font-display text-[0.88rem] font-semibold uppercase tracking-wider text-green-deep">
            {t.catalogo.eyebrow}
          </p>
          <h1 className="mt-3 text-[clamp(2.1rem,4vw,3rem)] font-bold leading-tight">
            {t.catalogo.tituloPagina}
          </h1>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-ink-soft">
            {t.catalogo.leadPagina}
          </p>
        </header>
      </Reveal>

      {products.length > 0 ? (
        <CatalogGrid products={products} searchable />
      ) : (
        <p className="py-24 text-center font-script text-3xl text-ink-soft">
          {t.catalogo.horneando}
        </p>
      )}
    </div>
  );
}
