import { Space_Grotesk, Inter, Caveat } from 'next/font/google';

/**
 * Las tres tipografías de la marca, autoalojadas por next/font.
 *
 * Se sirven desde nuestro dominio en vez de Google Fonts: no hay petición a
 * un tercero, no hay salto de fuente al cargar y no se filtra la IP del
 * visitante a otro servidor.
 */

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-caveat',
  display: 'swap',
});

export const fontVariables = `${spaceGrotesk.variable} ${inter.variable} ${caveat.variable}`;
