'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import { CartButton } from './CartButton';
import { cn } from '@/lib/cn';

const NAV_LINKS = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/#sabores', label: 'Sabores' },
  { href: '/#historia', label: 'Nosotros' },
  { href: '/#horario', label: 'Horario' },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Barra de progreso de lectura, suavizada con un resorte.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300',
        scrolled
          ? 'border-kraft-line/70 bg-paper/85 shadow-[0_1px_20px_rgba(37,26,16,0.07)] backdrop-blur-md'
          : 'border-kraft-line bg-paper',
      )}
    >
      <nav className="wrap flex h-[84px] items-center justify-between">
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

        <div className="flex items-center gap-4">
          {/* En móvil el catálogo se alcanza desde aquí, sin menú hamburguesa. */}
          <Link
            href="/catalogo"
            className="font-display text-[0.92rem] font-semibold text-ink-soft transition-colors hover:text-ink md:hidden"
          >
            Catálogo
          </Link>
          <CartButton />
        </div>
      </nav>

      <motion.div
        className="h-[2px] origin-left bg-green-deep"
        style={{ scaleX: progress }}
        aria-hidden
      />
    </header>
  );
}
