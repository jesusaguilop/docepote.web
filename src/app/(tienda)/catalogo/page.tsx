import type { Metadata } from 'next';
import { container } from '@infra/container';
import { CatalogGrid } from '@/components/store/CatalogGrid';
import { Reveal } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Catálogo',
  description:
    'Todos los bolo no pote de DOCEPOTE: individuales de 8 oz, minis y kits para eventos, hechos a mano en Valledupar.',
};

/**
 * El catálogo se regenera cada minuto. El stock que se muestra puede quedar
 * un momento desactualizado, pero la disponibilidad real se vuelve a
 * verificar al agregar al carrito y al confirmar el pedido, así que nadie
 * termina comprando algo que ya no existe. Además, el panel invalida esta
 * ruta al guardar cambios (ver `revalidatePath` en las acciones de admin).
 */
export const revalidate = 60;

export default async function CatalogPage() {
  const { catalog } = container();

  const result = await catalog.list.execute({ onlyActive: true });
  const products = result.ok ? result.value : [];

  return (
    <div className="wrap py-16">
      <Reveal>
        <header className="mb-12 max-w-[54ch]">
          <p className="font-display text-[0.88rem] font-semibold uppercase tracking-wider text-green-deep">
            Todo lo que hay hoy
          </p>
          <h1 className="mt-3 text-[clamp(2.1rem,4vw,3rem)] font-bold leading-tight">
            El catálogo completo
          </h1>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-ink-soft">
            Preparamos en tandas cortas, así que el inventario cambia todos los días. Lo que
            ves aquí es lo que hay ahora mismo.
          </p>
        </header>
      </Reveal>

      {products.length > 0 ? (
        <CatalogGrid products={products} searchable />
      ) : (
        <p className="py-24 text-center font-script text-3xl text-ink-soft">
          Estamos horneando... vuelve en un rato.
        </p>
      )}
    </div>
  );
}
