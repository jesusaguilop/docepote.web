'use client';

/**
 * Menú de navegación para celular.
 *
 * Existe porque debajo de `md` los enlaces del header se ocultan, y sin esto
 * el visitante de móvil — que es la mayoría, llega desde Instagram — perdía
 * el acceso a Sabores, Nosotros y Horario.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/lib/i18n/context';

export interface NavLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: readonly NavLink[];
  whatsappNumber: string;
}

export function MobileMenu({ open, onClose, links, whatsappNumber }: MobileMenuProps) {
  const { t } = useTranslation();
  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-ink/45 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            className="fixed inset-x-0 top-0 z-[90] flex flex-col bg-paper pb-8 shadow-xl md:hidden"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.abrirMenu}
          >
            <div className="flex h-[72px] items-center justify-between border-b border-kraft-line px-5">
              <span className="flex items-center gap-2.5">
                <Image
                  src="/brand/logo-mascot.jpg"
                  alt=""
                  width={64}
                  height={64}
                  className="h-8 w-8 rounded-full ring-2 ring-kraft-line/50"
                />
                <span className="font-display text-[1.05rem] font-bold">
                  Doce <span className="text-green-deep">pote</span>
                </span>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
                aria-label={t.nav.cerrarMenu}
              >
                &#10005;
              </button>
            </div>

            <nav className="px-5 pt-2">
              <ul>
                {links.map((link, index) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.05 }}
                    className="border-b border-kraft-line/40 last:border-b-0"
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      /* 56px de alto: objetivo táctil cómodo, muy por encima
                         del mínimo de 44px que recomienda Apple. */
                      className="flex h-14 items-center font-display text-[1.05rem] font-semibold transition-colors active:text-green-deep"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <motion.a
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + links.length * 0.05 }}
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="mt-5 flex h-13 items-center justify-center gap-2 rounded-sm bg-green-deep py-3.5 font-display font-semibold text-white"
              >
                {t.nav.pedirWhatsApp}
              </motion.a>

              {/* En móvil el conmutador del header se oculta por espacio,
                  así que su sitio es aquí dentro. */}
              <div className="mt-6 flex items-center justify-center gap-3 border-t border-kraft-line/40 pt-5 sm:hidden">
                <span className="text-[0.8rem] text-ink-soft">{t.nav.idioma}</span>
                <LanguageSwitcher />
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
