import type { Metadata } from 'next';

/**
 * Raíz del área de administración.
 *
 * No valida sesión: el login vive aquí dentro y quedaría bloqueado. La
 * autenticación la impone el layout del grupo `(panel)`, que envuelve solo a
 * las páginas protegidas.
 */
export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel Doce pote' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
