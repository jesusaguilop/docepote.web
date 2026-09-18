/**
 * ProductImage — una foto del producto.
 *
 * Se modela aparte del producto por una razón muy concreta: el catálogo pinta
 * doce tarjetas y solo necesita saber *qué* fotos hay y en qué orden, no los
 * megabytes que pesan. Teniéndolas como una lista dentro de `Product`, cada
 * consulta al catálogo arrastraría todas las fotos de todos los productos
 * aunque la página solo vaya a mostrar una miniatura de cada uno.
 *
 * Por eso esta clase es solo la ficha: id, orden y descripción. Los bytes se
 * piden por separado, uno a uno, y únicamente cuando el navegador los pide.
 */

import { ValidationError } from '../shared/errors';

/** Lo que el navegador sabe pintar y la tienda necesita. */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ImageMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Tope por foto, ya redimensionada en el navegador.
 *
 * El panel encoge las fotos antes de subirlas, así que 400 KB es un techo
 * generoso: las de la sesión de fotos entran en 60–90 KB. Está aquí y no en
 * la pantalla porque también protege a quien suba por otro camino.
 */
export const MAX_IMAGE_BYTES = 400 * 1024;

/** Cuántas caben en el carrusel de una ficha. */
export const MAX_IMAGES_PER_PRODUCT = 8;

export interface ProductImageProps {
  readonly id: string;
  readonly productId: string;
  readonly position: number;
  readonly mimeType: ImageMimeType;
  readonly alt: string;
  readonly updatedAt: Date;
}

export class ProductImage {
  readonly id: string;
  readonly productId: string;
  readonly position: number;
  readonly mimeType: ImageMimeType;
  readonly alt: string;
  readonly updatedAt: Date;

  private constructor(props: ProductImageProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.position = props.position;
    this.mimeType = props.mimeType;
    this.alt = props.alt;
    this.updatedAt = props.updatedAt;
    Object.freeze(this);
  }

  static of(props: ProductImageProps): ProductImage {
    if (!Number.isInteger(props.position) || props.position < 0) {
      throw new ValidationError('El orden de la foto debe ser un entero positivo.');
    }

    return new ProductImage({ ...props, alt: props.alt.trim() });
  }

  /**
   * La URL con la que el navegador la pide.
   *
   * Lleva la fecha de modificación porque la respuesta se cachea para
   * siempre: sin ese sufijo, reemplazar una foto dejaría a los clientes
   * viendo la vieja durante un año.
   */
  get url(): string {
    return `/api/productos/foto/${this.id}?v=${this.updatedAt.getTime()}`;
  }

  movedTo(position: number): ProductImage {
    return ProductImage.of({ ...this.toProps(), position });
  }

  private toProps(): ProductImageProps {
    return {
      id: this.id,
      productId: this.productId,
      position: this.position,
      mimeType: this.mimeType,
      alt: this.alt,
      updatedAt: this.updatedAt,
    };
  }
}

/** Los bytes de una foto. Solo los toca quien la sirve. */
export interface ImageFile {
  readonly bytes: Uint8Array;
  readonly mimeType: ImageMimeType;
}

/** Foto recién subida, antes de tener id. */
export interface NewProductImage {
  readonly bytes: Uint8Array;
  readonly mimeType: ImageMimeType;
  readonly alt: string;
}

export function parseImageMimeType(raw: string): ImageMimeType {
  const value = raw.trim().toLowerCase();
  const match = ALLOWED_MIME_TYPES.find((allowed) => allowed === value);

  if (!match) {
    throw new ValidationError('La foto debe ser JPG, PNG o WebP.', { campo: 'foto' });
  }

  return match;
}

/** Valida una foto recién subida antes de que llegue a la base. */
export function assertUploadable(image: NewProductImage): void {
  if (image.bytes.byteLength === 0) {
    throw new ValidationError('La foto llegó vacía.', { campo: 'foto' });
  }

  if (image.bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ValidationError(
      `La foto pesa ${Math.round(image.bytes.byteLength / 1024)} KB y el tope son ` +
        `${Math.round(MAX_IMAGE_BYTES / 1024)} KB.`,
      { campo: 'foto' },
    );
  }

  if (!image.alt.trim()) {
    throw new ValidationError('Describe la foto en una línea.', { campo: 'alt' });
  }
}
