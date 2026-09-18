import type { Metadata, Viewport } from 'next';
import { fontVariables } from '@/lib/fonts';
import { resolveSiteUrl } from '@/lib/site-url';
import { activeSeason } from '@/lib/season';
import { SeasonStyle } from '@/components/brand/SeasonStyle';
import './globals.css';

/**
 * Layout raíz.
 *
 * Solo monta el documento y las fuentes. El encabezado, el pie y el carrito
 * viven en el layout de la tienda `(tienda)`, porque el panel de
 * administración es otro mundo y no debe heredarlos.
 */

/** Cae al dominio local si lo configurado no es una URL válida, en vez de romper el build. */
function metadataBaseUrl(): URL {
  const candidate = resolveSiteUrl();
  try {
    return new URL(candidate);
  } catch {
    console.warn(`[metadata] "${candidate}" no es una URL válida; se usa http://localhost:3000.`);
    return new URL('http://localhost:3000');
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
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

/** Color de fábrica de la barra del navegador, sin temporada puesta. */
const THEME_COLOR_POR_DEFECTO = '#7c9a34';

/**
 * El color de la barra del navegador también sigue a la temporada: en el
 * celular es un buen pedazo de pantalla, y dejarlo verde con la tienda en
 * rosado se ve como un error.
 */
export async function generateViewport(): Promise<Viewport> {
  const season = await activeSeason();

  return {
    themeColor: season?.colors.accentDeep ?? THEME_COLOR_POR_DEFECTO,
    width: 'device-width',
    initialScale: 1,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body>
        {/* Antes que nada: redefine los colores de la marca si hay una
            temporada puesta desde el panel. */}
        <SeasonStyle />
        {children}
      </body>
    </html>
  );
}
