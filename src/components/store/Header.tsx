'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import { CartButton } from './CartButton';
import { MobileMenu, type NavLink } from './MobileMenu';
import { cn } from '@/lib/cn';

const NAV_LINKS: readonly NavLink[] = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/#sabores', label: 'Sabores' },
  { href: '/#historia', label: 'Nosotros' },
  { href: '/#horario', label: 'Horario' },
];

export function Header({ whatsappNumber }: { whatsappNumber: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Barra de progreso de lectura, suavizada con un resorte.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Si el menú quedó abierto y se cambia de página, se cierra.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300',
          scrolled
            ? 'border-kraft-line/70 bg-paper/85 shadow-[0_1px_20px_rgba(37,26,16,0.07)] backdrop-blur-md'
            : 'border-kraft-line bg-paper',
        )}
      >
        {/* Más compacto en móvil: 84px de header se comen la pantalla. */}
        <nav className="wrap flex h-[68px] items-center justify-between md:h-[84px]">
          <Logo />

          <ul className="hidden items-center gap-9 font-display text-[0.94rem] font-semibold text-ink-soft md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  data-active={pathname === link.href}
                  className="link-underline py-1 transition-colors duration-200 hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5 md:gap-4">
            <CartButton />

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              // 44px de lado: el mínimo cómodo para un dedo.
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors active:bg-paper-2 md:hidden"
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[22px] w-[22px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>

        <motion.div
          className="h-[2px] origin-left bg-green-deep"
          style={{ scaleX: progress }}
          aria-hidden
        />
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={NAV_LINKS}
        whatsappNumber={whatsappNumber}
      />
    </>
  );
}
