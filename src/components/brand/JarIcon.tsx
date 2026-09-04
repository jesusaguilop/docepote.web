/**
 * El pote de Doce pote.
 *
 * Portado del prototipo original manteniendo el trazo grueso del logo. El
 * dibujo vive aquí y no en la base de datos: allá solo se guardan el color
 * del contenido y el patrón, que es lo que de verdad distingue un sabor.
 */

import { cn } from '@/lib/cn';

export type JarPattern = 'wave' | 'dots' | 'drop';

const INK = '#251a10';
const LID = '#f2ecdd';
const CAP = '#eae1cb';
const HIGHLIGHT = '#f2ecdd';

/** Cada patrón describe la textura del relleno: cremoso, granulado o líquido. */
const PATTERNS: Record<JarPattern, React.ReactNode> = {
  wave: (
    <>
      <path d="M32 58 Q50 48 68 58" stroke={HIGHLIGHT} strokeWidth="2.5" fill="none" opacity="0.7" />
      <path d="M32 68 Q50 58 68 68" stroke={HIGHLIGHT} strokeWidth="2.5" fill="none" opacity="0.5" />
    </>
  ),
  dots: (
    <>
      <circle cx="38" cy="52" r="2.6" fill={INK} opacity="0.55" />
      <circle cx="50" cy="60" r="2.6" fill={INK} opacity="0.55" />
      <circle cx="62" cy="54" r="2.6" fill={INK} opacity="0.55" />
      <circle cx="44" cy="70" r="2.6" fill={INK} opacity="0.55" />
      <circle cx="58" cy="72" r="2.6" fill={INK} opacity="0.55" />
    </>
  ),
  drop: (
    <>
      <circle cx="42" cy="55" r="3.4" fill={HIGHLIGHT} opacity="0.6" />
      <circle cx="60" cy="66" r="4.2" fill={HIGHLIGHT} opacity="0.6" />
      <circle cx="52" cy="48" r="2.6" fill={HIGHLIGHT} opacity="0.6" />
    </>
  ),
};

interface JarIconProps {
  fillColor: string;
  pattern: JarPattern;
  className?: string;
  /** Texto alternativo; si se omite, el icono queda oculto para lectores de pantalla. */
  label?: string;
}

export function JarIcon({ fillColor, pattern, className, label }: JarIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('h-full w-full', className)}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* Cuerpo del pote */}
      <rect x="26" y="34" width="48" height="50" rx="4" fill={fillColor} stroke={INK} strokeWidth="3" />
      {/* Contenido del pote */}
      {PATTERNS[pattern]}
      {/* Tapa y anillo */}
      <rect x="23" y="26" width="54" height="12" rx="3" fill={LID} stroke={INK} strokeWidth="3" />
      <rect x="30" y="18" width="40" height="10" rx="3" fill={CAP} stroke={INK} strokeWidth="2.5" />
      {/* Brillo del vidrio */}
      <path
        d="M33 42 L33 76"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.22"
      />
    </svg>
  );
}
