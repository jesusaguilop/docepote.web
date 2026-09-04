/**
 * Línea de pedido.
 *
 * Guarda una *foto* del producto al momento de la compra (nombre y precio
 * copiados). Si mañana sube el precio del bolo, los pedidos viejos siguen
 * mostrando lo que el cliente realmente pagó.
 */

import { Money } from '../shared/money';
import { Quantity } from '../shared/quantity';
import type { Product } from '../catalog/product';
import type { JarArt } from '../catalog/jar-art';

export interface OrderLineProps {
  readonly productId: string;
  readonly productName: string;
  readonly productSlug: string;
  readonly unitPrice: Money;
  readonly quantity: Quantity;
  readonly art: JarArt;
}

export class OrderLine {
  readonly productId: string;
  readonly productName: string;
  readonly productSlug: string;
  readonly unitPrice: Money;
  readonly quantity: Quantity;
  readonly art: JarArt;

  private constructor(props: OrderLineProps) {
    this.productId = props.productId;
    this.productName = props.productName;
    this.productSlug = props.productSlug;
    this.unitPrice = props.unitPrice;
    this.quantity = props.quantity;
    this.art = props.art;
    Object.freeze(this);
  }

  static fromProduct(product: Product, quantity: Quantity): OrderLine {
    return new OrderLine({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug.value,
      unitPrice: product.price,
      quantity,
      art: product.art,
    });
  }

  static rehydrate(props: OrderLineProps): OrderLine {
    return new OrderLine(props);
  }

  get subtotal(): Money {
    return this.unitPrice.times(this.quantity.value);
  }
}
