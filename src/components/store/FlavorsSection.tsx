import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import type { FlavorDTO } from '@core/application/dto/product.dto';

/**
 * Los seis sabores de la casa.
 *
 * Es un Server Component puro: no hay interacción, solo contenido. Los
 * sabores son el activo de marca de DOCEPOTE, así que tienen su propia
 * sección en vez de quedar escondidos dentro de cada ficha de producto.
 */
export function FlavorsSection({ flavors }: { flavors: readonly FlavorDTO[] }) {
  if (flavors.length === 0) return null;

  return (
    <section id="sabores" className="wrap py-24">
      <Reveal>
        <div className="mb-12 max-w-[54ch]">
          <p className="font-display text-[0.82rem] font-bold uppercase tracking-[0.12em] text-green-deep">
            Nuestros sabores
          </p>
          <h2 className="mt-3 text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight">
            Seis recetas, una sola obsesión
          </h2>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-ink-soft">
            Cada pote se monta capa por capa: bizcocho, brigadeiro y el topping que le da
            carácter. Estos son los sabores que hacemos siempre.
          </p>
        </div>
      </Reveal>

      <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {flavors.map((flavor) => (
          <RevealItem key={flavor.id}>
            <article className="group h-full rounded-md border border-kraft-line/70 bg-white p-6 transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(37,26,16,0.1)]">
              <span
                className="block text-3xl transition-transform duration-300 group-hover:scale-110"
                aria-hidden
              >
                {flavor.emoji}
              </span>

              <h3 className="mt-3 font-display text-[1.1rem] font-bold">{flavor.name}</h3>

              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
                {flavor.summary}
              </p>

              {flavor.composition && (
                <p className="mt-4 border-t border-kraft-line/50 pt-4 text-[0.84rem] leading-relaxed text-ink-soft/85">
                  {flavor.composition}
                </p>
              )}
            </article>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
