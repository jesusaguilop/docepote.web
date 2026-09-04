import type { Metadata, Viewport } from 'next';
import { fontVariables } from '@/lib/fonts';
import './globals.css';

/**
 * Layout raíz.
 *
 * Solo monta el documento y las fuentes. El encabezado, el pie y el carrito
 * viven en el layout de la tienda `(tienda)`, porque el panel de
 * administración es otro mundo y no debe heredarlos.
 */

/**
 * URL base del sitio, tolerante a configuraciones a medias.
 *
 * Se usa `||` y no `??` a propósito: en Vercel es muy fácil crear la variable
 * y dejarla en blanco, y `'' ?? algo` devuelve la cadena vacía — con la que
 * `new URL('')` lanza y tumba el build entero. Si además viene con un valor
 * inválido, se cae al dominio local en vez de romper la compilación.
 */
function resolveSiteUrl(): URL {
  const fallback = 'http://localhost:3000';
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallback;

  try {
    return new URL(raw);
  } catch {
    console.warn(`[metadata] NEXT_PUBLIC_SITE_URL no es una URL válida ("${raw}"); se usa ${fallback}.`);
    return new URL(fallback);
  }
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: 'Doce pote — Postres artesanales en pote | Valledupar',
    template: '%s · Doce pote',
  },
  description:
    'Bolo no pote artesanal en Valledupar: capas de bizcocho y brigadeiro en un potecito. Seis sabores, versión individual, mini y kits para eventos.',
  keywords: [
    'bolo no pote',
    'brigadeiro',
    'postres artesanales',
    'Valledupar',
    'doceria brasileña',
    'postres en pote',
    'postres para eventos Valledupar',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'Doce pote',
    title: 'Doce pote — Un pedacito de Brasil en cada bocado',
    description:
      'Bolo no pote artesanal, hecho a mano en Valledupar. Seis sabores para llevar.',
    images: [{ url: '/brand/logo-mascot.jpg', width: 640, height: 640, alt: 'Doce pote' }],
  },
  icons: {
    icon: '/brand/logo-mascot.jpg',
    apple: '/brand/logo-mascot.jpg',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c9a34',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
