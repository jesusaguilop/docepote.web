import { CSS_VARIABLE_BY_KEY, PALETTE_KEYS } from '@core/domain/branding/palette';
import { activeSeason } from '@/lib/season';

/**
 * Pinta la tienda con los colores de la temporada activa.
 *
 * Es una hoja de estilo de doce renglones que redefine los tokens de
 * `globals.css`. Como cada componente de la tienda se pinta con esos tokens y
 * ninguno escribe hexadecimales sueltos, redefinirlos aquí tiñe el sitio
 * entero: botones, bordes, fondos, textura y foco.
 *
 * Que gane esta hoja y no la de Tailwind no es cuestión de suerte ni de
 * orden: Tailwind declara sus variables dentro de `@layer theme`, y el CSS
 * sin capa —como este— siempre pesa más que el que está en una capa. Por eso
 * bastan doce declaraciones sin un solo `!important`.
 *
 * Sin temporada activa no renderiza nada y mandan los valores de fábrica.
 */
export async function SeasonStyle() {
  const season = await activeSeason();
  if (!season) return null;

  // Los valores vienen de `Palette`, que ya los validó contra /^#[0-9a-f]{6}$/.
  // Por eso se pueden meter en una hoja de estilo sin escapar nada más: no
  // existe un hexadecimal que pase ese filtro y a la vez cierre el bloque.
  const declarations = PALETTE_KEYS.map(
    (key) => `${CSS_VARIABLE_BY_KEY[key]}:${season.colors[key]}`,
  ).join(';');

  return (
    <style
      // El contenido es una cadena armada aquí con valores ya validados;
      // React escaparía las llaves y rompería el CSS.
      dangerouslySetInnerHTML={{ __html: `:root{${declarations}}` }}
      data-temporada={season.name}
    />
  );
}
