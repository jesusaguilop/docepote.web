/**
 * Iconos del panel.
 *
 * Trazo propio en lugar de emojis: los emojis los dibuja el sistema operativo,
 * así que se ven distintos en cada máquina, no heredan el color de la marca y
 * desentonan con el resto de la interfaz. Estos son SVG de línea, alineados al
 * grosor del logotipo y coloreados con `currentColor`.
 */

interface IconProps {
  className?: string;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
      <rect x="3" y="15" width="7.5" height="6" rx="1.5" />
      <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.5" />
    </svg>
  );
}

export function OrdersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 3.5h11.5L20 7v13.5H5z" />
      <path d="M16 3.5V7h4" />
      <path d="M8.5 12h8M8.5 16h5" />
    </svg>
  );
}

export function JarMenuIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="6" y="8.5" width="12" height="12" rx="2" />
      <rect x="5" y="5" width="14" height="3.5" rx="1.2" />
      <path d="M9 3h6" />
      <path d="M8.5 13.5q3.5-2 7 0" />
    </svg>
  );
}

export function MoneyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3s5 4.2 5 8.8a5 5 0 0 1-10 0C7 9.5 8.6 7.8 9.5 7c0 1.7.8 2.6 1.6 2.6.9 0 1.4-.9.9-6.6Z" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14.5 20H6a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 6 4h8.5" />
      <path d="M16 15.5 19.5 12 16 8.5M19.5 12H9.5" />
    </svg>
  );
}

export function StoreIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9.5V20h16V9.5" />
      <path d="M3 9.5 4.8 4h14.4L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}

export function TrendIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 16.5 9 11l3.5 3.5L20.5 6.5" />
      <path d="M15.5 6.5h5v5" />
    </svg>
  );
}
