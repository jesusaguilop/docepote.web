/**
 * Cart — entidad pura, sin dependencias de navegador ni de servidor.
 *
 * Decisión de seguridad importante: el carrito guarda SOLO `productId` y
 * `quantity`. Nunca precios. El navegador puede alterar su localStorage a
 * gusto, pero al confirmar el pedido el servidor vuelve a leer los precios
 * del catálogo (ver `PlaceOrderUseCase`), así que manipular el carrito no
 * cambia lo que se cobra.
 *
 * Es inmutable: cada operación devuelve un carrito nuevo, lo que hace trivial
 * conectarlo a un store de React sin efectos raros.
 */

import { Quantity, MAX_QUANTITY_PER_LINE } from '../shared/quantity';

export interface CartItem {
  readonly productId: string;
  readonly quantity: number;
}

export class Cart {
  private readonly items: ReadonlyMap<string, number>;

  private constructor(items: ReadonlyMap<string, number>) {
    this.items = items;
    Object.freeze(this);
  }

  static empty(): Cart {
    return new Cart(new Map());
  }

  /** Reconstruye desde datos crudos (localStorage), descartando lo que no sea válido. */
  static fromItems(items: readonly CartItem[]): Cart {
    const map = new Map<string, number>();
    for (const item of items) {
      if (typeof item?.productId !== 'string' || item.productId.length === 0) continue;
      const quantity = Math.trunc(Number(item.quantity));
      if (!Number.isFinite(quantity) || quantity < 1) continue;
      map.set(item.productId, Math.min(quantity, MAX_QUANTITY_PER_LINE));
    }
    return new Cart(map);
  }

  add(productId: string, amount = 1): Cart {
    const current = this.items.get(productId) ?? 0;
    return this.setQuantity(productId, current + amount);
  }

  /** Fijar la cantidad en 0 o menos equivale a eliminar la línea. */
  setQuantity(productId: string, quantity: number): Cart {
    const next = new Map(this.items);
    if (quantity <= 0) {
      next.delete(productId);
      return new Cart(next);
    }
    // `Quantity` valida el tope; el carrito se queda en el máximo permitido
    // en vez de reventar mientras el usuario aprieta "+".
    const capped = Math.min(Math.trunc(quantity), MAX_QUANTITY_PER_LINE);
    next.set(productId, Quantity.of(capped).value);
    return new Cart(next);
  }

  remove(productId: string): Cart {
    if (!this.items.has(productId)) return this;
    const next = new Map(this.items);
    next.delete(productId);
    return new Cart(next);
  }

  clear(): Cart {
    return Cart.empty();
  }

  quantityOf(productId: string): number {
    return this.items.get(productId) ?? 0;
  }

  has(productId: string): boolean {
    return this.items.has(productId);
  }

  get isEmpty(): boolean {
    return this.items.size === 0;
  }

  /** Número de unidades (no de líneas): es lo que muestra el globo del carrito. */
  get totalItems(): number {
    let total = 0;
    for (const quantity of this.items.values()) total += quantity;
    return total;
  }

  get lineCount(): number {
    return this.items.size;
  }

  get productIds(): string[] {
    return [...this.items.keys()];
  }

  toItems(): CartItem[] {
    return [...this.items.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  }
}
