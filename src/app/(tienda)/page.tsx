import Image from 'next/image';
import Link from 'next/link';
import { container } from '@infra/container';
import { Hero } from '@/components/store/Hero';
import { FactsStrip } from '@/components/store/FactsStrip';
import { CatalogGrid } from '@/components/store/CatalogGrid';
import { FlavorsSection } from '@/components/store/FlavorsSection';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';

/**
 * Portada.
 *
 * Es un Server Component: el catálogo se lee en el servidor y llega al
 * navegador ya renderizado. Bueno para el SEO local — que es de donde vienen
 * los clientes de una doceria de barrio — y no obliga a esperar un fetch.
 */

/** Misma política que el catálogo: se regenera cada minuto y el panel la
    invalida al guardar cambios. */
export const revalidate = 60;

const SCHEDULE = [
  { day: 'Lunes a viernes', hours: '9:00 am – 7:00 pm' },
  { day: 'Sábados', hours: '9:00 am – 8:00 pm' },
  { day: 'Domingos', hours: '2:00 pm – 8:00 pm' },
];

export default async function HomePage() {
  const { catalog, config } = container();

  const [productsResult, flavorsResult] = await Promise.all([
    catalog.list.execute({ onlyActive: true }),
    catalog.listFlavors.execute(),
  ]);

  const products = productsResult.ok ? productsResult.value : [];
  const flavors = flavorsResult.ok ? flavorsResult.value : [];

  return (
    <>
      <Hero whatsappNumber={config.WHATSAPP_NUMBER} />
      <FactsStrip />

      {/* ── Historia y empaque ─────────────────────────────────────────── */}
      <section id="historia" className="wrap grid items-center gap-14 py-24 lg:grid-cols-2">
        <Reveal direction="left">
          <div className="relative">
            <span
              className="absolute -inset-3 -rotate-1 rounded-md bg-kraft/25"
              aria-hidden
            />
            <Image
              src="/brand/packaging-kraft.jpg"
              alt="Bolsa de papel kraft cerrada con el sticker del gato de Doce pote"
              width={602}
              height={430}
              className="relative h-auto w-full rounded-md"
              sizes="(max-width: 1024px) 92vw, 560px"
            />
          </div>
        </Reveal>

        <Reveal direction="right" delay={0.1}>
          <h2 className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight">
            ¿Qué es un bolo no pote?
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-ink-soft">
            Es la experiencia de llevar contigo, en un potecito, una deliciosa y típica
            sobremesa brasileña: una torta preparada con capas de bizcocho y brigadeiro,
            cuidadosamente montada dentro de un vasito para disfrutar cada cucharada.
          </p>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-ink-soft">
            Cada pote se empaca a mano en bolsa de papel kraft, cerrada con nuestro sticker —
            pensada para que el postre viaje bien y se vea igual de bien cuando la abres. Es
            nuestra manera más rica de hacerte sentir un pedacito de Brasil aquí contigo, en
            Valledupar.
          </p>
          <p className="mt-7 font-script text-3xl text-green-deep">— Equipo DOCEPOTE</p>
        </Reveal>
      </section>

      <FlavorsSection flavors={flavors} />

      {/* ── Catálogo ───────────────────────────────────────────────────── */}
      <section id="catalogo" className="wrap py-8 pb-24">
        <Reveal>
          <div className="mb-12 max-w-[52ch]">
            <h2 className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight">
              El catálogo de hoy
            </h2>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-ink-soft">
              Individuales de 8 oz, minis para probar de todo y kits para eventos.
              Preparados en tandas pequeñas — cuando se acaban, se acaban.
            </p>
          </div>
        </Reveal>

        {products.length > 0 ? (
          <CatalogGrid products={products} />
        ) : (
          <p className="py-16 text-center font-script text-3xl text-ink-soft">
            Estamos horneando... vuelve en un rato.
          </p>
        )}
      </section>

      {/* ── Frase de marca ─────────────────────────────────────────────── */}
      <section className="texture-cats relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-green-deep/85" aria-hidden />
        <Reveal className="wrap relative z-10 text-center">
          <p className="font-script text-[clamp(2.2rem,5vw,3.4rem)] leading-tight text-white">
            &ldquo;Un potecito de cariño a la vez.&rdquo;
          </p>
          <p className="mt-4 text-[0.98rem] text-paper/85">
            Sin fórmulas raras — solo buenos ingredientes y tiempo.
          </p>
        </Reveal>
      </section>

      {/* ── Horario ────────────────────────────────────────────────────── */}
      <section id="horario" className="wrap grid gap-12 py-24 lg:grid-cols-2 lg:items-center">
        <Reveal direction="left">
          <h2 className="text-[clamp(1.7rem,2.6vw,2.3rem)] font-bold">Nuestro horario</h2>
          <p className="mt-4 max-w-[42ch] text-[1.02rem] leading-relaxed text-ink-soft">
            Puedes pasar por tu pedido en el punto de entrega o coordinar domicilio dentro de
            estos horarios.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink href="/catalogo" variant="green">
              Hacer un pedido
            </ButtonLink>
            <Link
              href={`https://wa.me/${config.WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center self-center font-display font-semibold text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
            >
              Escríbenos
            </Link>
          </div>
        </Reveal>

        <Reveal direction="right" delay={0.1}>
          <dl className="rounded-md border border-kraft-line bg-white/70">
            {SCHEDULE.map((row, index) => (
              <div
                key={row.day}
                className={`flex items-center justify-between px-6 py-5 ${
                  index < SCHEDULE.length - 1 ? 'border-b border-kraft-line/60' : ''
                }`}
              >
                <dt className="font-display text-[0.98rem] font-semibold">{row.day}</dt>
                <dd className="text-[0.95rem] text-ink-soft">{row.hours}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>
    </>
  );
}
