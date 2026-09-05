import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { container } from '@infra/container';
import { ProductDetail } from '@/components/store/ProductDetail';
import { ProductCard } from '@/components/store/ProductCard';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { getTranslations } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Título y descripción propios de cada producto, para que se comparta bien. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await container().catalog.getBySlug.execute(slug);

  if (!result.ok) return { title: 'Producto no encontrado' };

  const product = result.value;
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} — ${product.priceFormatted}`,
      description: product.description,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const { catalog } = container();
  const { locale, t } = await getTranslations();

  const result = await catalog.getBySlug.execute(slug, locale);
  if (!result.ok) notFound();

  const product = result.value;
  const relatedResult = await catalog.getRelated.execute(slug, 3, locale);
  const related = relatedResult.ok ? relatedResult.value : [];

  return (
    <div className="wrap py-12">
      <nav aria-label="Ruta de navegación" className="mb-10 text-[0.86rem] text-ink-soft">
        <Link href="/" className="transition-colors hover:text-ink">
          {t.nav.inicio}
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <Link href="/catalogo" className="transition-colors hover:text-ink">
          {t.nav.catalogo}
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="mt-24 border-t border-kraft-line/60 pt-16">
          <Reveal>
            <h2 className="mb-10 text-[clamp(1.5rem,2.4vw,2rem)] font-bold">
              {t.producto.tambienTeGusta}
            </h2>
          </Reveal>

          <RevealGroup className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <RevealItem key={item.id} className="h-full">
                <ProductCard product={item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}
    </div>
  );
}
