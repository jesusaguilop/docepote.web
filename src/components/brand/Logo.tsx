import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  /** Sobre fondos oscuros el texto va en papel en vez de tinta. */
  tone?: 'ink' | 'paper';
  size?: 'sm' | 'md';
  href?: string;
}

/** Marca gráfica: el gato con el pote, más el logotipo. */
export function Logo({ className, tone = 'ink', size = 'md', href = '/' }: LogoProps) {
  const dimension = size === 'sm' ? 32 : 40;

  return (
    <Link
      href={href}
      className={cn('group flex items-center gap-3', className)}
      aria-label="Doce pote — inicio"
    >
      <span
        className={cn(
          'relative shrink-0 overflow-hidden rounded-full ring-2 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6',
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
