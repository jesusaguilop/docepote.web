'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { logout } from '@/app/actions/admin';
import { cn } from '@/lib/cn';
import {
  DashboardIcon,
  JarMenuIcon,
  LogoutIcon,
  OrdersIcon,
  StoreIcon,
} from './icons';

const NAV = [
  { href: '/admin', label: 'Resumen', Icon: DashboardIcon },
  { href: '/admin/pedidos', label: 'Pedidos', Icon: OrdersIcon },
  { href: '/admin/productos', label: 'Catálogo', Icon: JarMenuIcon },
];

/**
 * Navegación del panel.
 *
 * En escritorio es una columna fija sobre fondo tinta — separa visualmente el
 * "detrás del mostrador" de la tienda, que es toda papel y verde. En móvil se
 * colapsa a una barra horizontal desplazable.
 */
export function Sidebar({ adminName, adminEmail }: { adminName: string; adminEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="z-20 flex shrink-0 flex-col bg-ink text-paper lg:h-dvh lg:w-64 lg:sticky lg:top-0">
      <div className="flex items-center gap-3 px-5 py-4 lg:px-6 lg:py-6">
        <Image
          src="/brand/logo-mascot.jpg"
          alt=""
          width={72}
          height={72}
          className="h-9 w-9 shrink-0 rounded-full ring-2 ring-paper/20"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[0.98rem] font-bold leading-tight">
            Doce pote
          </p>
          <p className="text-[0.74rem] uppercase tracking-wider text-paper/45">
            Panel de control
          </p>
        </div>

        {/* En móvil el pie de la barra no se muestra, así que salir y volver a
            la tienda tienen que estar aquí o no existen. */}
        <div className="flex items-center gap-1 lg:hidden">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full text-paper/60 transition-colors active:bg-paper/10"
            aria-label="Ver la tienda"
          >
            <StoreIcon className="h-[19px] w-[19px]" />
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-full text-paper/60 transition-colors active:bg-paper/10"
              aria-label="Cerrar sesión"
            >
              <LogoutIcon className="h-[19px] w-[19px]" />
            </button>
          </form>
        </div>
      </div>

      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-2 lg:flex-col lg:overflow-visible lg:px-3">
        {NAV.map(({ href, label, Icon }) => {
          // `/admin` solo se marca activo en coincidencia exacta; si no,
          // quedaría encendido también en sus subrutas.
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative shrink-0 rounded-md px-3.5 py-2.5 font-display text-[0.9rem] font-semibold transition-colors duration-200',
                active ? 'text-ink' : 'text-paper/65 hover:text-paper',
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-active"
                  className="absolute inset-0 rounded-md bg-paper"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative flex items-center gap-2.5">
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden px-3 pb-5 lg:block">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md px-3.5 py-2.5 font-display text-[0.86rem] font-semibold text-paper/55 transition-colors hover:text-paper"
        >
          <StoreIcon className="h-[18px] w-[18px] shrink-0" />
          Ver la tienda
        </Link>

        <div className="mt-3 border-t border-paper/12 px-3.5 pt-4">
          <p className="truncate font-display text-[0.88rem] font-semibold">{adminName}</p>
          <p className="truncate text-[0.76rem] text-paper/45">{adminEmail}</p>

          <form action={logout} className="mt-3">
            <button
              type="submit"
              className="flex items-center gap-2 text-[0.82rem] text-paper/55 transition-colors hover:text-paper"
            >
              <LogoutIcon className="h-4 w-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
