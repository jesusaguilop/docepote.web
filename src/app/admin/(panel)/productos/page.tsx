import { container } from '@infra/container';
import { ProductManager } from '@/components/admin/ProductManager';
import { PageHeader } from '@/components/admin/PageHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Catálogo' };

export default async function AdminProductsPage() {
  const { catalog } = container();

  const [productsResult, flavorsResult] = await Promise.all([
    // `onlyActive: false` — el panel también debe ver lo que está oculto.
    catalog.list.execute({ onlyActive: false }),
    catalog.listFlavors.execute(),
  ]);

  const products = productsResult.ok ? productsResult.value : [];
  const flavors = flavorsResult.ok ? flavorsResult.value : [];

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Catálogo"
        description="Ajusta el inventario del día, oculta lo que se acabó o agrega un sabor nuevo. Los cambios salen a la tienda de inmediato."
      />

      <ProductManager products={products} flavors={flavors} />
    </>
  );
}
