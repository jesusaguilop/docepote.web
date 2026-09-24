import { DynaPuff } from 'next/font/google';

/**
 * DynaPuff, la tipografía original de la marca, autoalojada por next/font.
 *
 * Se sirve desde nuestro dominio en vez de Google Fonts: no hay petición a
 * un tercero, no hay salto de fuente al cargar y no se filtra la IP del
 * visitante a otro servidor.
 *
 * Es variable (400–700), así que un solo archivo cubre todos los pesos que
 * usa la página, de los títulos al texto corrido.
 */
export const dynaPuff = DynaPuff({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dynapuff',
  display: 'swap',
});

export const fontVariables = dynaPuff.variable;
