/**
 * Pruebas de las fotos de producto.
 *
 * Lo que se protege: que la URL cambie cuando cambia la foto (si no, la
 * caché de un año deja a los clientes viendo la foto vieja), que no entre
 * cualquier archivo, y que el orden —que decide cuál sale en la tarjeta del
 * catálogo— se mantenga consecutivo.
 */

import { describe, expect, it } from 'vitest';

import {
  MAX_IMAGE_BYTES,
  ProductImage,
  assertUploadable,
  parseImageMimeType,
} from '@core/domain/catalog/product-image';
import { ValidationError } from '@core/domain/shared/errors';

const base = {
  id: 'foto-1',
  productId: 'producto-1',
  position: 0,
  mimeType: 'image/jpeg' as const,
  alt: 'Bolo no pote Chocolatudo de Doce pote',
  updatedAt: new Date('2026-09-17T22:00:00.000Z'),
};

describe('ProductImage', () => {
  it('lleva la versión en la URL para que la caché eterna sea segura', () => {
    const image = ProductImage.of(base);

    expect(image.url).toContain('/api/productos/foto/foto-1');
    expect(image.url).toContain(`v=${base.updatedAt.getTime()}`);
  });

  it('una foto actualizada estrena URL', () => {
    const vieja = ProductImage.of(base);
    const nueva = ProductImage.of({ ...base, updatedAt: new Date('2026-09-18T10:00:00.000Z') });

    expect(nueva.url).not.toBe(vieja.url);
  });

  it('rechaza posiciones que no son enteros positivos', () => {
    expect(() => ProductImage.of({ ...base, position: -1 })).toThrow(ValidationError);
    expect(() => ProductImage.of({ ...base, position: 1.5 })).toThrow(ValidationError);
  });

  it('moverla no muta la original', () => {
    const image = ProductImage.of(base);
    const movida = image.movedTo(3);

    expect(image.position).toBe(0);
    expect(movida.position).toBe(3);
    expect(movida.id).toBe(image.id);
  });

  it('recorta los espacios de la descripción', () => {
    expect(ProductImage.of({ ...base, alt: '  Bolo no pote  ' }).alt).toBe('Bolo no pote');
  });

  it('acepta solo formatos que el navegador pinta', () => {
    expect(parseImageMimeType('IMAGE/JPEG')).toBe('image/jpeg');
    expect(parseImageMimeType('image/webp')).toBe('image/webp');
    expect(() => parseImageMimeType('image/heic')).toThrow(ValidationError);
    expect(() => parseImageMimeType('application/pdf')).toThrow(ValidationError);
  });
});

describe('assertUploadable', () => {
  const foto = {
    bytes: new Uint8Array([1, 2, 3]),
    mimeType: 'image/jpeg' as const,
    alt: 'Bolo no pote',
  };

  it('deja pasar una foto normal', () => {
    expect(() => assertUploadable(foto)).not.toThrow();
  });

  it('rechaza una foto vacía', () => {
    expect(() => assertUploadable({ ...foto, bytes: new Uint8Array() })).toThrow(ValidationError);
  });

  it('rechaza una foto que se pasa del tope', () => {
    expect(() =>
      assertUploadable({ ...foto, bytes: new Uint8Array(MAX_IMAGE_BYTES + 1) }),
    ).toThrow(ValidationError);
  });

  it('exige describirla: hay quien no puede verla', () => {
    expect(() => assertUploadable({ ...foto, alt: '  ' })).toThrow(ValidationError);
  });
});
