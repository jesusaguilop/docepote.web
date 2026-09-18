/**
 * Pruebas de la apariencia de temporada.
 *
 * Lo que se protege aquí no es que los colores sean bonitos —eso lo decide
 * el negocio— sino que no se pueda dejar la tienda inservible desde el
 * panel: un botón de "Confirmar pedido" que no se lee cuesta ventas, y quien
 * elige el color no tiene por qué saber de ratios de contraste.
 */

import { describe, expect, it } from 'vitest';

import { Palette, PALETTE_KEYS, CSS_VARIABLE_BY_KEY } from '@core/domain/branding/palette';
import { Season, MAX_MASCOT_BYTES, parseMascotMimeType } from '@core/domain/branding/season';
import { ValidationError } from '@core/domain/shared/errors';

/** Paleta válida de base; cada prueba cambia solo lo que le interesa. */
const COLORES = {
  ink: '#2a1113',
  inkSoft: '#6d444c',
  accent: '#ff7fb0',
  accentDeep: '#bc0045',
  accentDark: '#8f0034',
  kraft: '#e9c9b4',
  kraftDark: '#b4786f',
  kraftLine: '#dcaba0',
  caramel: '#c35a3a',
  paper: '#fdf3ec',
  paper2: '#fae4e0',
  berry: '#8c2e2e',
};

describe('Palette', () => {
  it('acepta la paleta de la campaña de Amor y Amistad', () => {
    const palette = Palette.of(COLORES);
    expect(palette.get('accentDeep')).toBe('#bc0045');
  });

  it('normaliza mayúsculas y el numeral que falta', () => {
    const palette = Palette.of({ ...COLORES, accentDeep: 'BC0045' });
    expect(palette.get('accentDeep')).toBe('#bc0045');
  });

  it('rechaza lo que no es un hexadecimal de seis dígitos', () => {
    expect(() => Palette.of({ ...COLORES, kraft: 'rosadito' })).toThrow(ValidationError);
    expect(() => Palette.of({ ...COLORES, kraft: '#fff' })).toThrow(ValidationError);
  });

  it('señala qué color vino mal', () => {
    try {
      Palette.of({ ...COLORES, caramel: 'nope' });
      expect.unreachable('debió lanzar');
    } catch (error) {
      expect((error as ValidationError).details.campo).toBe('caramel');
    }
  });

  it('no deja pasar un acento tan claro que borre el texto de los botones', () => {
    // Un rosa pastel: precioso en el selector, ilegible en "Confirmar pedido".
    expect(() => Palette.of({ ...COLORES, accentDeep: '#ffc0d8' })).toThrow(ValidationError);
  });

  it('no deja pasar un texto secundario que se pierda en el fondo', () => {
    expect(() => Palette.of({ ...COLORES, inkSoft: '#f7e9e2' })).toThrow(ValidationError);
  });

  it('mide el contraste como manda la WCAG', () => {
    expect(Palette.contrast('#ffffff', '#000000')).toBeCloseTo(21, 1);
    expect(Palette.contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('entrega una variable CSS por cada color, sin olvidar ninguno', () => {
    const variables = Palette.of(COLORES).toCssVariables();

    expect(variables).toHaveLength(PALETTE_KEYS.length);
    expect(Object.fromEntries(variables)).toMatchObject({
      [CSS_VARIABLE_BY_KEY.accentDeep]: '#bc0045',
      [CSS_VARIABLE_BY_KEY.paper]: '#fdf3ec',
    });
  });

  it('solo produce valores que no pueden romper la hoja de estilo', () => {
    for (const [, value] of Palette.of(COLORES).toCssVariables()) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('Season', () => {
  const nueva = (extra: Partial<Parameters<typeof Season.create>[0]> = {}) =>
    Season.create({
      id: 'temporada-1',
      name: 'Amor y Amistad',
      colors: COLORES,
      mascot: null,
      ...extra,
    });

  it('nace apagada: crearla no cambia la tienda', () => {
    expect(nueva().active).toBe(false);
  });

  it('exige un nombre con el que reconocerla', () => {
    expect(() => nueva({ name: ' ' })).toThrow(ValidationError);
  });

  it('activarla y desactivarla no muta la temporada original', () => {
    const season = nueva();
    const puesta = season.activated();

    expect(season.active).toBe(false);
    expect(puesta.active).toBe(true);
    expect(puesta.deactivated().active).toBe(false);
  });

  it('cambiar el nombre conserva los colores', () => {
    const renombrada = nueva().withName('Navidad');

    expect(renombrada.name).toBe('Navidad');
    expect(renombrada.palette.get('accentDeep')).toBe('#bc0045');
  });

  it('rechaza una mascota que pese más de lo que aguanta el hero', () => {
    expect(() =>
      nueva({
        mascot: {
          image: new Uint8Array(MAX_MASCOT_BYTES + 1),
          mimeType: 'image/png',
          alt: 'El gato con un brownie',
        },
      }),
    ).toThrow(ValidationError);
  });

  it('exige describir la mascota: hay quien no puede verla', () => {
    expect(() =>
      nueva({
        mascot: { image: new Uint8Array([1, 2, 3]), mimeType: 'image/png', alt: '   ' },
      }),
    ).toThrow(ValidationError);
  });

  it('acepta solo formatos que el navegador sabe pintar', () => {
    expect(parseMascotMimeType('image/webp')).toBe('image/webp');
    expect(() => parseMascotMimeType('image/heic')).toThrow(ValidationError);
    expect(() => parseMascotMimeType('application/pdf')).toThrow(ValidationError);
  });

  it('quitar la mascota devuelve el hero a la imagen de siempre', () => {
    const conGato = nueva({
      mascot: { image: new Uint8Array([1]), mimeType: 'image/png', alt: 'El gato' },
    });

    expect(conGato.mascot).not.toBeNull();
    expect(conGato.withMascot(null).mascot).toBeNull();
  });
});
