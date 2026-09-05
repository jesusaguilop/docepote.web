/**
 * Product — entidad raíz del catálogo.
 *
 * Encapsula las reglas de venta de un pote: si se puede comprar hoy, cuántas
 * unidades quedan, cómo se descuenta el inventario y si de verdad está en
 * oferta. Nadie fuera de esta clase debería decidir "si stock > 0 entonces...":
 * esa pregunta se le hace al producto (`canFulfill`, `isPurchasable`).
 */

import { Money } from '../shared/money';
import { Slug } from '../shared/slug';
import { UnavailableError, ValidationError } from '../shared/errors';
import type { Category } from './category';
import { JarArt } from './jar-art';

/** `null` en stock significa "sin control de inventario" (se hace por encargo). */
export type Stock = number | null;

export interface ProductTranslation {
  readonly name: string | null;
  readonly description: string | null;
}

export interface ProductProps {
  readonly id: string;
  readonly slug: Slug;
  readonly name: string;
  readonly description: string;
  /** Traducción al portugués; `null` por campo significa "usa el español". */
  readonly translations: ProductTranslation | null;
  readonly price: Money;
  /**
   * Precio anterior, el que se muestra tachado. `null` cuando no hay oferta.
   * Debe ser mayor que el precio vigente: un "antes" más barato que el "ahora"
   * no es un descuento, es publicidad engañosa.
   */
  readonly previousPrice: Money | null;
  readonly category: Category;
  /** Sabor de la casa. `null` en combos y kits, que llevan varios. */
  readonly flavorId: string | null;
  readonly badge: string | null;
  readonly art: JarArt;
  readonly imageUrl: string | null;
  /** Tamaño del pote en onzas. `null` si no aplica o no está declarado. */
  readonly sizeOz: number | null;
  /** Cuántos potes trae. `null` para productos de una sola unidad. */
  readonly units: number | null;
  readonly active: boolean;
  readonly stock: Stock;
  readonly position: number;
}

const MAX_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 400;

export class Product {
  readonly id: string;
  readonly slug: Slug;
  readonly name: string;
  readonly description: string;
  readonly translations: ProductTranslation | null;
  readonly price: Money;
  readonly previousPrice: Money | null;
  readonly category: Category;
  readonly flavorId: string | null;
  readonly badge: string | null;
  readonly art: JarArt;
  readonly imageUrl: string | null;
  readonly sizeOz: number | null;
  readonly units: number | null;
  readonly active: boolean;
  readonly stock: Stock;
  readonly position: number;

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.slug = props.slug;
    this.name = props.name;
    this.description = props.description;
    this.translations = props.translations;
    this.price = props.price;
    this.previousPrice = props.previousPrice;
    this.category = props.category;
    this.flavorId = props.flavorId;
    this.badge = props.badge;
    this.art = props.art;
    this.imageUrl = props.imageUrl;
    this.sizeOz = props.sizeOz;
    this.units = props.units;
    this.active = props.active;
    this.stock = props.stock;
    this.position = props.position;
    Object.freeze(this);
  }

  static create(props: ProductProps): Product {
    const name = props.name.trim();
    if (name.length < 3) {
      throw new ValidationError('El nombre del producto debe tener al menos 3 caracteres.');
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(`El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`);
    }

    const description = props.description.trim();
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new ValidationError(
        `La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`,
      );
    }

    if (props.price.isZero()) {
      throw new ValidationError('El precio debe ser mayor que cero.');
    }

    if (props.previousPrice && !props.previousPrice.isGreaterThan(props.price)) {
      throw new ValidationError(
        'El precio anterior debe ser mayor que el precio actual; si no, no es una oferta.',
        { campo: 'previousPrice' },
      );
    }

    if (props.stock !== null && (!Number.isInteger(props.stock) || props.stock < 0)) {
      throw new ValidationError('El stock debe ser un entero no negativo, o vacío si no se controla.');
    }

    if (props.sizeOz !== null && (!Number.isFinite(props.sizeOz) || props.sizeOz <= 0)) {
      throw new ValidationError('El tamaño en onzas debe ser un número positivo.');
    }

    if (props.units !== null && (!Number.isInteger(props.units) || props.units < 1)) {
      throw new ValidationError('Las unidades deben ser un entero de al menos 1.');
    }

    const badge = props.badge?.trim() ?? null;

    return new Product({ ...props, name, description, badge: badge || null });
  }

  /** Nombre y descripción en el idioma pedido, cayendo al español por campo. */
  textFor(locale: string): { name: string; description: string } {
    if (locale !== 'pt' || !this.translations) {
      return { name: this.name, description: this.description };
    }

    return {
      name: this.translations.name ?? this.name,
      description: this.translations.description ?? this.description,
    };
  }

  // ── Venta ─────────────────────────────────────────────────────────────

  /** ¿Se puede agregar al carrito ahora mismo? */
  isPurchasable(): boolean {
    return this.active && (this.stock === null || this.stock > 0);
  }

  /** ¿Alcanza el inventario para esta cantidad? */
  canFulfill(quantity: number): boolean {
    if (!this.active) return false;
    if (this.stock === null) return true;
    return this.stock >= quantity;
  }

  /** Quedan pocas unidades: sirve para el aviso de "últimas unidades". */
  isLowStock(threshold = 3): boolean {
    return this.stock !== null && this.stock > 0 && this.stock <= threshold;
  }

  isSoldOut(): boolean {
    return this.stock === 0;
  }

  // ── Precio ────────────────────────────────────────────────────────────

  get isOnSale(): boolean {
    return this.previousPrice !== null;
  }

  /** Cuánto se ahorra el cliente. `null` si no hay oferta. */
  get savings(): Money | null {
    return this.previousPrice ? this.previousPrice.minus(this.price) : null;
  }

  /** Porcentaje de descuento redondeado. `null` si no hay oferta. */
  get discountPercent(): number | null {
    if (!this.previousPrice) return null;
    const saved = this.previousPrice.amount - this.price.amount;
    return Math.round((saved / this.previousPrice.amount) * 100);
  }

  /** Precio por unidad en un combo — lo que permite comparar contra el individual. */
  get pricePerUnit(): Money | null {
    if (this.units === null || this.units <= 1) return null;
    return Money.of(Math.round(this.price.amount / this.units), this.price.currency);
  }

  // ── Cambios (siempre devuelven una instancia nueva) ───────────────────

  withStockReduced(quantity: number): Product {
    if (!this.canFulfill(quantity)) {
      throw new UnavailableError(`"${this.name}" no tiene ${quantity} unidades disponibles.`, {
        disponible: String(this.stock ?? 'ilimitado'),
      });
    }
    if (this.stock === null) return this;
    return new Product({ ...this.toProps(), stock: this.stock - quantity });
  }

  withActive(active: boolean): Product {
    return new Product({ ...this.toProps(), active });
  }

  /** Aplica cambios parciales validando de nuevo todas las invariantes. */
  withChanges(changes: Partial<Omit<ProductProps, 'id'>>): Product {
    return Product.create({ ...this.toProps(), ...changes, id: this.id });
  }

  toProps(): ProductProps {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      description: this.description,
      translations: this.translations,
      price: this.price,
      previousPrice: this.previousPrice,
      category: this.category,
      flavorId: this.flavorId,
      badge: this.badge,
      art: this.art,
      imageUrl: this.imageUrl,
      sizeOz: this.sizeOz,
      units: this.units,
      active: this.active,
      stock: this.stock,
      position: this.position,
    };
  }
}
