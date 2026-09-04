/**
 * Traductores entre filas de Prisma y entidades del dominio.
 *
 * Esta es la frontera anticorrupción: si mañana cambia una columna, el daño
 * queda contenido en este archivo y ninguna entidad se entera.
 */

import type {
  Flavor as FlavorRow,
  Product as ProductRow,
  Order as OrderRow,
  OrderLine as OrderLineRow,
  AdminUser as AdminUserRow,
  Session as SessionRow,
} from '@prisma/client';

import { Product } from '@core/domain/catalog/product';
import { Flavor } from '@core/domain/catalog/flavor';
import { JarArt } from '@core/domain/catalog/jar-art';
import { parseCategory } from '@core/domain/catalog/category';
import { Money } from '@core/domain/shared/money';
import { Slug } from '@core/domain/shared/slug';
import { Quantity } from '@core/domain/shared/quantity';
import { Order } from '@core/domain/ordering/order';
import type { PaymentMethod } from '@core/domain/ordering/order';
import { OrderLine } from '@core/domain/ordering/order-line';
import { OrderCode } from '@core/domain/ordering/order-code';
import { Customer } from '@core/domain/ordering/customer';
import { parseOrderStatus } from '@core/domain/ordering/order-status';
import { parseFulfillmentMethod } from '@core/domain/ordering/fulfillment';
import { AdminUser } from '@core/domain/identity/admin-user';
import { Session } from '@core/domain/identity/session';

// ── Catálogo ────────────────────────────────────────────────────────────

export function toFlavorEntity(row: FlavorRow): Flavor {
  return Flavor.rehydrate({
    id: row.id,
    slug: Slug.of(row.slug),
    name: row.name,
    emoji: row.emoji,
    summary: row.summary,
    composition: row.composition,
    position: row.position,
  });
}

export function toFlavorRow(flavor: Flavor) {
  return {
    id: flavor.id,
    slug: flavor.slug.value,
    name: flavor.name,
    emoji: flavor.emoji,
    summary: flavor.summary,
    composition: flavor.composition,
    position: flavor.position,
  };
}

export function toProductEntity(row: ProductRow): Product {
  return Product.create({
    id: row.id,
    slug: Slug.of(row.slug),
    name: row.name,
    description: row.description,
    price: Money.of(row.price),
    previousPrice: row.previousPrice === null ? null : Money.of(row.previousPrice),
    category: parseCategory(row.category),
    flavorId: row.flavorId,
    badge: row.badge,
    art: JarArt.of(row.fillColor, row.pattern),
    imageUrl: row.imageUrl,
    sizeOz: row.sizeOz,
    units: row.units,
    active: row.active,
    stock: row.stock,
    position: row.position,
  });
}

export function toProductRow(product: Product) {
  return {
    id: product.id,
    slug: product.slug.value,
    name: product.name,
    description: product.description,
    price: product.price.amount,
    previousPrice: product.previousPrice?.amount ?? null,
    category: product.category,
    flavorId: product.flavorId,
    badge: product.badge,
    fillColor: product.art.fillColor,
    pattern: product.art.pattern,
    imageUrl: product.imageUrl,
    sizeOz: product.sizeOz,
    units: product.units,
    active: product.active,
    stock: product.stock,
    position: product.position,
  };
}

// ── Pedidos ─────────────────────────────────────────────────────────────

type OrderRowWithLines = OrderRow & { lines: OrderLineRow[] };

export function toOrderEntity(row: OrderRowWithLines): Order {
  const fulfillmentMethod = parseFulfillmentMethod(row.fulfillmentMethod);

  return Order.rehydrate({
    id: row.id,
    code: OrderCode.of(row.code),
    status: parseOrderStatus(row.status),
    customer: Customer.of(
      {
        name: row.customerName,
        phone: row.customerPhone,
        address: row.customerAddress,
        notes: row.customerNotes,
      },
      fulfillmentMethod,
    ),
    fulfillmentMethod,
    lines: row.lines.map((line) =>
      OrderLine.rehydrate({
        productId: line.productId,
        productName: line.productName,
        productSlug: line.productSlug,
        unitPrice: Money.of(line.unitPrice),
        quantity: Quantity.of(line.quantity),
        art: JarArt.of(line.fillColor, line.pattern),
      }),
    ),
    deliveryFee: Money.of(row.deliveryFee),
    paymentMethod: row.paymentMethod as PaymentMethod,
    paymentReference: row.paymentReference,
    placedAt: row.placedAt,
    updatedAt: row.updatedAt,
  });
}

export function toOrderRow(order: Order) {
  return {
    id: order.id,
    code: order.code.value,
    status: order.status,
    customerName: order.customer.name,
    customerPhone: order.customer.phone.e164,
    customerAddress: order.customer.address,
    customerNotes: order.customer.notes,
    fulfillmentMethod: order.fulfillmentMethod,
    deliveryFee: order.deliveryFee.amount,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    placedAt: order.placedAt,
  };
}

/**
 * Líneas de un pedido, sin `orderId`.
 *
 * Se omite a propósito: estas filas se insertan anidadas dentro del `create`
 * del pedido, y ahí Prisma deduce la relación — pasarle `orderId` explícito
 * es un error de argumento desconocido.
 *
 * El id es `<orderId>:<productId>`, que además garantiza que un producto no
 * pueda aparecer dos veces en el mismo pedido.
 */
export function toOrderLineRows(order: Order) {
  return order.lines.map((line) => ({
    id: `${order.id}:${line.productId}`,
    productId: line.productId,
    productName: line.productName,
    productSlug: line.productSlug,
    unitPrice: line.unitPrice.amount,
    quantity: line.quantity.value,
    fillColor: line.art.fillColor,
    pattern: line.art.pattern,
  }));
}

// ── Identidad ───────────────────────────────────────────────────────────

export function toAdminUserEntity(row: AdminUserRow): AdminUser {
  return AdminUser.rehydrate({
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
  });
}

export function toSessionEntity(row: SessionRow): Session {
  return Session.rehydrate({
    id: row.id,
    userId: row.userId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  });
}
