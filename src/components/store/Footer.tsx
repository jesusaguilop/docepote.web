import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

interface FooterProps {
  whatsappNumber: string;
  instagram: string;
}

const EXPLORE_LINKS = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/#sabores', label: 'Sabores' },
  { href: '/#horario', label: 'Horario' },
  { href: '/#historia', label: 'Nosotros' },
];

export function Footer({ whatsappNumber, instagram }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-kraft-line bg-paper-2/50">
      <div className="wrap py-16">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Logo size="sm" />
            <p className="mt-5 max-w-[46ch] text-[0.9rem] leading-relaxed text-ink-soft">
              Un pedacito de Brasil en cada bocado — bolo no pote artesanal, capas de
              bizcocho y brigadeiro montadas a mano en Valledupar. Kits para eventos y
              fechas especiales.
            </p>
          </div>

          <nav aria-labelledby="footer-explorar">
            <h2
              id="footer-explorar"
              className="font-display text-[0.8rem] font-bold uppercase tracking-wider text-ink-soft"
            >
              Explorar
            </h2>
            <ul className="mt-2 text-[0.9rem]">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-ink-soft transition-colors hover:text-green-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-contacto">
            <h2
              id="footer-contacto"
              className="font-display text-[0.8rem] font-bold uppercase tracking-wider text-ink-soft"
            >
              Contacto
            </h2>
            <ul className="mt-2 text-[0.9rem]">
              <li>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center text-ink-soft transition-colors hover:text-green-deep"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center text-ink-soft transition-colors hover:text-green-deep"
                >
                  @{instagram}
                </a>
              </li>
              <li className="flex min-h-9 items-center text-ink-soft">Valledupar, Colombia</li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-kraft-line/70 pt-6 text-[0.82rem] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {year} Doce pote</span>
          <span className="font-script text-xl">Un potecito de cariño a la vez</span>
        </div>

        {/* Firma del autor, en la manuscrita de la marca — como quien firma
            a mano el empaque antes de entregarlo. */}
        <p className="mt-7 flex items-center justify-center gap-2 text-[0.78rem] text-ink-soft/75">
          <span className="h-px w-8 bg-kraft-line/60" aria-hidden />
          Hecho por
          <span className="font-script text-[1.4rem] leading-none text-green-deep">
            jesu.dev
          </span>
          <span className="h-px w-8 bg-kraft-line/60" aria-hidden />
        </p>
      </div>
    </footer>
  );
}
