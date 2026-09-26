/**
 * Pruebas del caso de uso que crea pedidos.
 *
 * Todas las dependencias se sustituyen por dobles en memoria — repositorios,
 * reloj, generador de ids y pasarela de pago. Que esto sea posible sin trucos
 * ni monkey-patching es la prueba de que la inversión de dependencias está
 * bien hecha: el caso de uso nunca supo qué había del otro lado.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { PlaceOrderUseCase } from '@core/application/ordering/place-order.use-case';
import { ChangeOrderStatusUseCase } from '@core/application/ordering/change-order-status.use-case';
import { startOfBusinessDay } from '@infra/persistence/prisma/order.repository';
import { fixedDeliveryPolicy } from '@core/application/ordering/delivery-settings.use-cases';
import { Product } from '@core/domain/catalog/product';
import { JarArt } from '@core/domain/catalog/jar-art';
import { Money } from '@core/domain/shared/money';
import { Slug } from '@core/domain/shared/slug';
import { DeliveryPolicy } from '@core/domain/ordering/fulfillment';
import type { Order } from '@core/domain/ordering/order';
import type {
  PaymentGateway,
  PaymentInstruction,
} from '@core/application/ports/payment-gateway';
import {
  ImmediateTransactionRunner,
  InMemoryOrderRepository,
  InMemoryProductRepository,
} from '@infra/persistence/in-memory/in-memory.repositories';
import { FixedClock } from '@infra/system/clock';
import { SequentialIdGenerator } from '@infra/system/id-generator';

// ── Dobles ──────────────────────────────────────────────────────────────

/** Pasarela falsa: registra qué pedidos recibió, sin salir a la red. */
class FakeGateway implements PaymentGateway {
  readonly method = 'whatsapp' as const;
  readonly prepared: Order[] = [];

  async prepare(order: Order): Promise<PaymentInstruction> {
    this.prepared.push(order);
    return { kind: 'redirect', url: `https://fake/${order.code.value}`, reference: null };
  }
}

const buildProduct = (id: string, price: number, stock: number | null) =>
  Product.create({
    id,
    slug: Slug.of(`producto-${id}`),
    name: `Producto ${id}`,
    description: 'Descripción de prueba.',
    translations: null,
    price: Money.of(price),
    previousPrice: null,
    category: 'individual',
    flavorId: null,
    badge: null,
    art: JarArt.of('#6b4226', 'wave'),
    imageUrl: null,
    sizeOz: null,
    units: null,
    active: true,
    stock,
    position: 0,
  });

const CUSTOMER = {
  name: 'Ana María',
  phone: '3180173770',
  address: 'Calle 16 #12-30, barrio Novalito',
  notes: null,
};

describe('PlaceOrderUseCase', () => {
  let products: InMemoryProductRepository;
  let orders: InMemoryOrderRepository;
  let gateway: FakeGateway;
  let useCase: PlaceOrderUseCase;

  beforeEach(() => {
    products = new InMemoryProductRepository([
      buildProduct('a', 9500, 10),
      buildProduct('b', 4500, 2),
      buildProduct('c', 24000, null),
    ]);
    orders = new InMemoryOrderRepository();
    gateway = new FakeGateway();

    useCase = new PlaceOrderUseCase(
      orders,
      products,
      fixedDeliveryPolicy(DeliveryPolicy.of(5000, 60000)),
      gateway,
      new ImmediateTransactionRunner(),
      new FixedClock(new Date('2026-09-04T15:00:00Z')),
      new SequentialIdGenerator('order'),
    );
  });

  it('crea el pedido y calcula los totales desde el catálogo', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'a', quantity: 2 }],
      customer: CUSTOMER,
      fulfillmentMethod: 'pickup',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { order } = result.value;
    expect(order.subtotal).toBe(19000);
    expect(order.deliveryFee).toBe(0);
    expect(order.total).toBe(19000);
    expect(order.status).toBe('pending');
    expect(order.code).toMatch(/^DP-/);
  });

  it('ignora los precios que mande el cliente y usa los del catálogo', async () => {
    // El carrito solo transporta ids y cantidades; aunque alguien inyecte un
    // precio en el payload, aquí no hay dónde meterlo.
    const result = await useCase.execute({
      items: [{ productId: 'a', quantity: 1, price: 1 } as never],
      customer: CUSTOMER,
      fulfillmentMethod: 'pickup',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order.total).toBe(9500);
  });

  it('cobra el domicilio según la política, no según el formulario', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'a', quantity: 1 }],
      customer: CUSTOMER,
      fulfillmentMethod: 'delivery',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order.deliveryFee).toBe(5000);
    expect(result.value.order.total).toBe(14500);
  });

  it('regala el domicilio al superar el umbral', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'a', quantity: 7 }], // 66.500
      customer: CUSTOMER,
      fulfillmentMethod: 'delivery',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order.deliveryFee).toBe(0);
    expect(result.value.order.hasFreeDelivery).toBe(true);
  });

  it('descuenta el inventario de lo vendido', async () => {
    await useCase.execute({
      items: [{ productId: 'b', quantity: 2 }],
      customer: CUSTOMER,
      fulfillmentMethod: 'pickup',
    });

    const product = await products.findById('b');
    expect(product?.stock).toBe(0);
  });

  it('no toca el inventario de los productos por encargo', async () => {
    await useCase.execute({
      items: [{ productId: 'c', quantity: 5 }],
      customer: CUSTOMER,
      fulfillmentMethod: 'pickup',
    });

    const product = await products.findById('c');
    expect(product?.stock).toBeNull();
  });

  it('rechaza el pedido si no alcanza el stock', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'b', quantity: 5 }],
      customer: CUSTOMER,
      fulfillmentMethod: 'pickup',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UNAVAILABLE');
    // Y nada se guardó a medias.
    expect(orders.items.size).toBe(0);
  });

  it('rechaza un carrito vacío', async () => {
    const result = await useCase.execute({
      items: [],
      customer: CUSTOMER,
      fulfillmentMethod: 'pickup',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  it('exige dirección cuando el pedido es a domicilio', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'a', quantity: 1 }],
      customer: { ...CUSTOMER, address: '' },
      fulfillmentMethod: 'delivery',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.details.campo).toBe('address');
  });

  it('no exige dirección si el cliente recoge', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'a', quantity: 1 }],
      customer: { ...CUSTOMER, address: '' },
      fulfillmentMethod: 'pickup',
    });

    expect(result.ok).toBe(true);
  });

  it('rechaza un celular inválido', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'a', quantity: 1 }],
      customer: { ...CUSTOMER, phone: '123' },
      fulfillmentMethod: 'pickup',
    });

    expect(result.ok).toBe(false);
  });

  it('delega el cobro en la pasarela inyectada', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'a', quantity: 1 }],
      customer: CUSTOMER,
      fulfillmentMethod: 'pickup',
    });

    expect(gateway.prepared).toHaveLength(1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.payment.kind).toBe('redirect');
  });

  it('genera un código distinto para cada pedido', async () => {
    const codes = new Set<string>();

    for (let i = 0; i < 12; i += 1) {
      const result = await useCase.execute({
        items: [{ productId: 'c', quantity: 1 }],
        customer: CUSTOMER,
        fulfillmentMethod: 'pickup',
      });
      if (result.ok) codes.add(result.value.order.code);
    }

    expect(codes.size).toBe(12);
  });
});

describe('PlaceOrderUseCase — precios y stock al confirmar', () => {
  let products: InMemoryProductRepository;
  let orders: InMemoryOrderRepository;
  let useCase: PlaceOrderUseCase;

  beforeEach(() => {
    products = new InMemoryProductRepository([buildProduct('b', 4500, 2)]);
    orders = new InMemoryOrderRepository();
    useCase = new PlaceOrderUseCase(
      orders,
      products,
      fixedDeliveryPolicy(DeliveryPolicy.of(5000, 60000)),
      new FakeGateway(),
      new ImmediateTransactionRunner(),
      new FixedClock(new Date('2026-09-04T15:00:00Z')),
      new SequentialIdGenerator('order'),
    );
  });

  it('no crea el pedido si el total cambió desde que el cliente lo vio', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'b', quantity: 1 }],
      customer: CUSTOMER,
      fulfillmentMethod: 'delivery',
      expectedTotal: 8500, // vio el domicilio a 4.000; ahora cuesta 5.000
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('CONFLICT');
    expect(result.error.details.motivo).toBe('precio');
    expect(orders.items.size).toBe(0);
    expect((await products.findById('b'))?.stock).toBe(2);
  });

  it('crea el pedido cuando el total coincide con el que vio', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'b', quantity: 1 }],
      customer: CUSTOMER,
      fulfillmentMethod: 'delivery',
      expectedTotal: 9500,
    });
    expect(result.ok).toBe(true);
  });

  it('si otro cliente se llevó las últimas unidades entretanto, no vende de más', async () => {
    // Otro pedido descuenta el stock entre la lectura del catálogo y el guardado.
    const reserve = products.reserveStock.bind(products);
    let first = true;
    products.reserveStock = async (id, quantity) => {
      if (first) {
        first = false;
        await reserve(id, 2);
      }
      return reserve(id, quantity);
    };

    const result = await useCase.execute({
      items: [{ productId: 'b', quantity: 2 }],
      customer: CUSTOMER,
      fulfillmentMethod: 'pickup',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UNAVAILABLE');
    expect(orders.items.size).toBe(0);
    expect((await products.findById('b'))?.stock).toBe(0);
  });

  it('marca el campo del celular cuando está mal escrito', async () => {
    const result = await useCase.execute({
      items: [{ productId: 'b', quantity: 1 }],
      customer: { ...CUSTOMER, phone: '12345' },
      fulfillmentMethod: 'pickup',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.details.campo).toBe('phone');
  });
});

describe('ChangeOrderStatusUseCase', () => {
  it('al cancelar devuelve al inventario lo que el pedido había descontado', async () => {
    const products = new InMemoryProductRepository([buildProduct('b', 4500, 5)]);
    const orders = new InMemoryOrderRepository();
    const transactions = new ImmediateTransactionRunner();
    const clock = new FixedClock(new Date('2026-09-04T15:00:00Z'));

    const placed = await new PlaceOrderUseCase(
      orders,
      products,
      fixedDeliveryPolicy(DeliveryPolicy.of(5000, 60000)),
      new FakeGateway(),
      transactions,
      clock,
      new SequentialIdGenerator('order'),
    ).execute({ items: [{ productId: 'b', quantity: 3 }], customer: CUSTOMER, fulfillmentMethod: 'pickup' });
    if (!placed.ok) throw placed.error;
    expect((await products.findById('b'))?.stock).toBe(2);

    const change = new ChangeOrderStatusUseCase(orders, products, transactions, clock);

    const cancelled = await change.execute({ orderId: placed.value.order.id, status: 'cancelled' });
    expect(cancelled.ok).toBe(true);
    expect((await products.findById('b'))?.stock).toBe(5);
  });

  it('explica el rechazo con los nombres de los estados, no con códigos', async () => {
    const products = new InMemoryProductRepository([buildProduct('b', 4500, null)]);
    const orders = new InMemoryOrderRepository();
    const transactions = new ImmediateTransactionRunner();
    const clock = new FixedClock(new Date('2026-09-04T15:00:00Z'));
    const placed = await new PlaceOrderUseCase(
      orders,
      products,
      fixedDeliveryPolicy(DeliveryPolicy.of(5000, 60000)),
      new FakeGateway(),
      transactions,
      clock,
      new SequentialIdGenerator('order'),
    ).execute({ items: [{ productId: 'b', quantity: 1 }], customer: CUSTOMER, fulfillmentMethod: 'pickup' });
    if (!placed.ok) throw placed.error;

    const change = new ChangeOrderStatusUseCase(orders, products, transactions, clock);
    const result = await change.execute({ orderId: placed.value.order.id, status: 'delivered' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('pendiente');
    expect(result.error.message).not.toContain('pending');
  });
});

describe('startOfBusinessDay', () => {
  it('el día empieza a medianoche de Colombia, no de UTC', () => {
    // 9 p. m. del 4 de septiembre en Valledupar = 02:00 UTC del 5.
    const night = new Date('2026-09-05T02:00:00Z');
    expect(startOfBusinessDay(night).toISOString()).toBe('2026-09-04T05:00:00.000Z');

    // 8 a. m. del 5 en Valledupar.
    const morning = new Date('2026-09-05T13:00:00Z');
    expect(startOfBusinessDay(morning).toISOString()).toBe('2026-09-05T05:00:00.000Z');
  });
});
