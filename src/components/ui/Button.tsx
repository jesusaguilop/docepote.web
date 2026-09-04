import Link from 'next/link';
import { cn } from '@/lib/cn';

type Variant = 'solid' | 'outline' | 'ghost' | 'line' | 'green';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  solid:
    'bg-ink text-paper hover:bg-[#100b06] hover:-translate-y-0.5 active:translate-y-0 shadow-sm',
  green:
    'bg-green-deep text-white hover:bg-green-dark hover:-translate-y-0.5 active:translate-y-0 shadow-sm',
  outline:
    'border border-ink text-ink hover:bg-ink hover:text-paper',
  ghost:
    'text-ink-soft hover:text-ink hover:bg-paper-2',
  line:
    'text-current border-b border-current/55 hover:border-current rounded-none px-0',
};

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-3.5 text-[0.98rem] gap-2',
  lg: 'px-8 py-4 text-base gap-2.5',
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

const baseClasses =
  'inline-flex items-center justify-center rounded-sm font-display font-semibold ' +
  'transition-[background-color,color,transform,border-color] duration-200 ' +
  'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0';

function classesFor(variant: Variant, size: Size, className?: string): string {
  return cn(baseClasses, VARIANTS[variant], SIZES[size], className);
}

type ButtonProps = BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = 'solid',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={classesFor(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

type ButtonLinkProps = BaseProps &
  Omit<React.ComponentProps<typeof Link>, 'className' | 'children'>;

export function ButtonLink({
  variant = 'solid',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={classesFor(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
