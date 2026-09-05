import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locale';

interface FooterProps {
  whatsappNumber: string;
  instagram: string;
  locale: Locale;
}

export function Footer({ whatsappNumber, instagram, locale }: FooterProps) {
  const t = getDictionary(locale);
  const year = new Date().getFullYear();

  const exploreLinks = [
    { href: '/catalogo', label: t.nav.catalogo },
    { href: '/#sabores', label: t.nav.sabores },
    { href: '/#horario', label: t.nav.horario },
    { href: '/#historia', label: t.nav.nosotros },
  ];

  return (
    <footer className="mt-24 border-t border-kraft-line bg-paper-2/50">
      <div className="wrap py-16">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Logo size="sm" />
            <p className="mt-5 max-w-[46ch] text-[0.9rem] leading-relaxed text-ink-soft">
              {t.footer.descripcion}
            </p>
          </div>

          <nav aria-labelledby="footer-explorar">
            <h2
              id="footer-explorar"
              className="font-display text-[0.8rem] font-bold uppercase tracking-wider text-ink-soft"
            >
              {t.footer.explorar}
            </h2>
            <ul className="mt-2 text-[0.9rem]">
              {exploreLinks.map((link) => (
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
              {t.footer.contacto}
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
              <li className="flex min-h-9 items-center text-ink-soft">{t.footer.ubicacion}</li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-kraft-line/70 pt-6 text-[0.82rem] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {year} Doce pote</span>
          <span className="font-script text-xl">{t.footer.lema}</span>
        </div>

        {/* Firma del autor, en la manuscrita de la marca — como quien firma
            a mano el empaque antes de entregarlo. */}
        <p className="mt-7 flex items-center justify-center gap-2 text-[0.78rem] text-ink-soft/75">
          <span className="h-px w-8 bg-kraft-line/60" aria-hidden />
          {t.footer.hechoPor}
          <a
            href="https://instagram.com/jesu4.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-script text-[1.4rem] leading-none text-green-deep underline-offset-4 transition-colors hover:text-green-dark hover:underline"
          >
            jesu4.dev
          </a>
          <span className="h-px w-8 bg-kraft-line/60" aria-hidden />
        </p>
      </div>
    </footer>
  );
}
