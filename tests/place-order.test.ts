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
      DeliveryPolicy.of(5000, 60000),
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
