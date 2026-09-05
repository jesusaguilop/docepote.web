'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * Contador de toques a nivel de módulo, no de componente.
 *
 * El primer toque en el logo navega al inicio, y esa navegación remonta el
 * componente — con `useState` la cuenta se perdería justo entre un toque y el
 * siguiente. Vive fuera para sobrevivir al remontaje.
 */
let tapCount = 0;
let lastTapAt = 0;

/**
 * Ventana entre toques: el umbral clásico del doble clic.
 *
 * Con dos toques el margen importa más que con tres. Alargarla haría que un
 * visitante que pulsa el logo dos veces con calma acabe en el login sin
 * entender por qué; 700 ms mantiene el gesto en "dos toques seguidos" y deja
 * aire para que el render entre toque y toque no cuente como pausa.
 */
const TAP_WINDOW_MS = 700;
const TAPS_REQUIRED = 2;

interface LogoProps {
  className?: string;
  /** Sobre fondos oscuros el texto va en papel en vez de tinta. */
  tone?: 'ink' | 'paper';
  size?: 'sm' | 'md';
  href?: string;
}

/**
 * Marca gráfica: el gato con el pote, más el logotipo.
 *
 * Lleva un atajo escondido: dos toques rápidos abren el panel de
 * administración. Está pensado para el celular, donde escribir "/admin" cada
 * vez es incómodo.
 *
 * El primer toque navega al inicio como siempre; solo el segundo desvía. Para
 * un visitante cualquiera el logo se comporta con normalidad, y si alguien lo
 * pulsa dos veces por costumbre acaba en una pantalla de acceso inofensiva.
 */
export function Logo({ className, tone = 'ink', size = 'md', href = '/' }: LogoProps) {
  const router = useRouter();
  const dimension = size === 'sm' ? 32 : 40;

  const handleTap = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const now = Date.now();

    tapCount = now - lastTapAt > TAP_WINDOW_MS ? 1 : tapCount + 1;
    lastTapAt = now;

    if (tapCount < TAPS_REQUIRED) return;

    // Solo en el toque que dispara el atajo se corta la navegación del
    // enlace. Si no, el propio Link viaja al inicio a la vez y gana la
    // carrera, dejando al usuario donde estaba. El primer toque sí navega
    // como siempre — ir al inicio estando en el inicio no se nota.
    event.preventDefault();
    tapCount = 0;
    router.push('/admin');
  };

  return (
    <Link
      href={href}
      onClick={handleTap}
      className={cn('group flex items-center gap-3', className)}
      aria-label="Doce pote — inicio"
    >
      <span
        className={cn(
          'relative shrink-0 overflow-hidden rounded-full ring-2 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6 group-active:scale-95',
          tone === 'paper' ? 'ring-paper/40' : 'ring-kraft-line/50',
        )}
        style={{ width: dimension, height: dimension }}
      >
        <Image
          src="/brand/logo-mascot.jpg"
          alt=""
          width={dimension * 2}
          height={dimension * 2}
          className="h-full w-full object-cover"
          priority
        />
      </span>
      <span
        className={cn(
          'font-display font-bold tracking-tight',
          size === 'sm' ? 'text-lg' : 'text-xl',
          tone === 'paper' ? 'text-paper' : 'text-ink',
        )}
      >
        Doce{' '}
        <span className={tone === 'paper' ? 'text-paper/75' : 'text-green-deep'}>pote</span>
      </span>
    </Link>
  );
}
