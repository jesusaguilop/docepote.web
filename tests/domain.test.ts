/**
 * Pruebas del dominio.
 *
 * Corren sin base de datos, sin Next y sin red: el dominio no depende de
 * nada de eso. Si estos tests necesitaran arrancar un servidor, sería la
 * señal de que la separación de capas se rompió.
 */

import { describe, expect, it } from 'vitest';

import { Money, COP } from '@core/domain/shared/money';
import { Slug } from '@core/domain/shared/slug';
import { PhoneNumber } from '@core/domain/shared/phone-number';
import { Quantity, MAX_QUANTITY_PER_LINE } from '@core/domain/shared/quantity';
import { ValidationError } from '@core/domain/shared/errors';
import { Cart } from '@core/domain/ordering/cart';
import { DeliveryPolicy } from '@core/domain/ordering/fulfillment';
import { OrderCode } from '@core/domain/ordering/order-code';
import { canTransition, allowedTransitionsFrom } from '@core/domain/ordering/order-status';
import { Product } from '@core/domain/catalog/product';
import { JarArt } from '@core/domain/catalog/jar-art';

describe('Money', () => {
  it('formatea pesos colombianos sin decimales', () => {
    expect(Money.of(9500).format()).toBe('$9.500');
    expect(Money.of(24000).format()).toBe('$24.000');
  });

  it('rechaza montos con decimales', () => {
    // El COP no usa centavos: un precio de 9500.5 es un error de programación.
    expect(() => Money.of(9500.5)).toThrow(ValidationError);
  });

  it('rechaza montos negativos', () => {
    expect(() => Money.of(-100)).toThrow(ValidationError);
  });

  it('suma y multiplica sin perder precisión', () => {
    const price = Money.of(4900);
    expect(price.times(3).amount).toBe(14700);
    expect(price.plus(Money.of(100)).amount).toBe(5000);
  });

  it('es inmutable: operar devuelve un objeto nuevo', () => {
    const original = Money.of(1000);
    original.plus(Money.of(500));
    expect(original.amount).toBe(1000);
  });

  it('no permite restar por debajo de cero', () => {
    expect(() => Money.of(100).minus(Money.of(500))).toThrow(ValidationError);
  });
});

describe('Slug', () => {
  it('quita tildes y normaliza texto libre', () => {
    expect(Slug.fromText('Bolo no pote · Maracuyá').value).toBe('bolo-no-pote-maracuya');
    expect(Slug.fromText('Brigadeiro clásico').value).toBe('brigadeiro-clasico');
  });

  it('falla si no queda nada usable', () => {
    expect(() => Slug.fromText('!!!')).toThrow(ValidationError);
  });
});

describe('PhoneNumber', () => {
  it('normaliza lo que la gente realmente escribe', () => {
    const variants = ['3180173770', '318 017 3770', '+57 318-017-3770', '57 3180173770'];
    for (const raw of variants) {
      expect(PhoneNumber.of(raw).e164).toBe('573180173770');
    }
  });

  it('formatea para mostrar en pantalla', () => {
    expect(PhoneNumber.of('3180173770').format()).toBe('318 017 3770');
  });

  it('rechaza celulares que no son colombianos', () => {
    expect(() => PhoneNumber.of('1234567890')).toThrow(ValidationError);
    expect(() => PhoneNumber.of('31801737')).toThrow(ValidationError);
  });
});

describe('Cart', () => {
  it('acumula unidades del mismo producto', () => {
    const cart = Cart.empty().add('a').add('a').add('b', 3);
    expect(cart.quantityOf('a')).toBe(2);
    expect(cart.totalItems).toBe(5);
    expect(cart.lineCount).toBe(2);
  });

  it('elimina la línea al bajar a cero', () => {
    const cart = Cart.empty().add('a', 2).setQuantity('a', 0);
    expect(cart.has('a')).toBe(false);
    expect(cart.isEmpty).toBe(true);
  });

  it('es inmutable', () => {
    const original = Cart.empty().add('a');
    original.add('b');
    expect(original.lineCount).toBe(1);
  });

  it('descarta basura al rehidratar desde localStorage', () => {
    const cart = Cart.fromItems([
      { productId: 'ok', quantity: 2 },
      { productId: '', quantity: 5 },
      { productId: 'negativo', quantity: -3 },
      { productId: 'nan', quantity: Number.NaN },
    ] as never);

    expect(cart.lineCount).toBe(1);
    expect(cart.quantityOf('ok')).toBe(2);
  });

  it('topa la cantidad en el máximo permitido', () => {
    const cart = Cart.empty().setQuantity('a', 9999);
    expect(cart.quantityOf('a')).toBe(MAX_QUANTITY_PER_LINE);
  });
});

describe('Quantity', () => {
  it('exige al menos una unidad', () => {
    expect(() => Quantity.of(0)).toThrow(ValidationError);
  });

  it('rechaza cantidades absurdas', () => {
    expect(() => Quantity.of(MAX_QUANTITY_PER_LINE + 1)).toThrow(ValidationError);
  });
});

describe('DeliveryPolicy', () => {
  const policy = DeliveryPolicy.of(5000, 60000);

  it('no cobra domicilio cuando el cliente recoge', () => {
    expect(policy.feeFor('pickup', Money.of(9500)).amount).toBe(0);
  });

  it('cobra la tarifa por debajo del umbral', () => {
    expect(policy.feeFor('delivery', Money.of(20000)).amount).toBe(5000);
  });

  it('regala el domicilio al alcanzar el umbral exacto', () => {
    expect(policy.feeFor('delivery', Money.of(60000)).amount).toBe(0);
  });

  it('dice cuánto falta para el domicilio gratis', () => {
    expect(policy.amountMissingForFreeDelivery(Money.of(45000))?.amount).toBe(15000);
    expect(policy.amountMissingForFreeDelivery(Money.of(70000))).toBeNull();
  });

  it('desactiva la promoción si el umbral es cero', () => {
    const sinPromo = DeliveryPolicy.of(5000, 0);
    expect(sinPromo.feeFor('delivery', Money.of(999999)).amount).toBe(5000);
  });
});

describe('OrderCode', () => {
  it('genera códigos con el formato de la marca', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(OrderCode.generate().value).toMatch(/^DP-[ACDEFGHJKLMNPQRTUVWXY3479]{4}$/);
    }
  });

  it('no usa caracteres que se confunden al dictarlos', () => {
    const confusing = ['O', '0', 'I', '1', 'S', '5', 'B', '8', 'Z', '2'];
    for (let i = 0; i < 200; i += 1) {
      const suffix = OrderCode.generate().value.slice(3);
      for (const character of confusing) {
        expect(suffix).not.toContain(character);
      }
    }
  });

  it('acepta un código escrito en minúsculas', () => {
    expect(OrderCode.of('dp-7k4m').value).toBe('DP-7K4M');
  });

  it('rechaza códigos con formato inválido', () => {
    expect(() => OrderCode.of('XX-1234')).toThrow(ValidationError);
  });
});

describe('Máquina de estados del pedido', () => {
  it('permite el camino normal de la cocina', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
    expect(canTransition('confirmed', 'preparing')).toBe(true);
    expect(canTransition('preparing', 'ready')).toBe(true);
    expect(canTransition('ready', 'delivered')).toBe(true);
  });

  it('no deja saltarse pasos ni retroceder', () => {
    expect(canTransition('pending', 'delivered')).toBe(false);
    expect(canTransition('delivered', 'preparing')).toBe(false);
  });

  it('cierra los estados finales', () => {
    expect(allowedTransitionsFrom('delivered')).toHaveLength(0);
    expect(allowedTransitionsFrom('cancelled')).toHaveLength(0);
  });

  it('permite cancelar en cualquier punto antes de entregar', () => {
    for (const status of ['pending', 'confirmed', 'preparing', 'ready'] as const) {
      expect(canTransition(status, 'cancelled')).toBe(true);
    }
  });
});

describe('Product', () => {
  const build = (stock: number | null, active = true) =>
    Product.create({
      id: 'p1',
      slug: Slug.of('bolo-no-pote-chocolatudo'),
      name: 'Bolo no pote Chocolatudo',
      description: 'Brigadeiro de chocolate + torta de chocolate 100% cacao.',
      price: Money.of(13000, COP),
      previousPrice: null,
      category: 'individual',
      flavorId: 'chocolatudo',
      badge: null,
      art: JarArt.of('#6b4226', 'wave'),
      imageUrl: null,
      sizeOz: 8,
      units: null,
      active,
      stock,
      position: 0,
    });

  it('se puede comprar si está activo y hay inventario', () => {
    expect(build(5).isPurchasable()).toBe(true);
    expect(build(0).isPurchasable()).toBe(false);
    expect(build(5, false).isPurchasable()).toBe(false);
  });

  it('trata el stock nulo como disponibilidad ilimitada', () => {
    const porEncargo = build(null);
    expect(porEncargo.canFulfill(999)).toBe(true);
    expect(porEncargo.isSoldOut()).toBe(false);
  });

  it('avisa cuando quedan pocas unidades', () => {
    expect(build(2).isLowStock()).toBe(true);
    expect(build(10).isLowStock()).toBe(false);
  });

  it('descuenta inventario sin mutar el original', () => {
    const original = build(5);
    const reducido = original.withStockReduced(2);

    expect(reducido.stock).toBe(3);
    expect(original.stock).toBe(5);
  });

  it('no deja descontar más de lo que hay', () => {
    expect(() => build(2).withStockReduced(5)).toThrow();
  });

  it('exige un precio mayor que cero', () => {
    expect(() =>
      Product.create({ ...build(1).toProps(), price: Money.zero() }),
    ).toThrow(ValidationError);
  });
});

describe('Product — precios y ofertas', () => {
  const build = (price: number, previousPrice: number | null, units: number | null = null) =>
    Product.create({
      id: 'p2',
      slug: Slug.of('combo-minis-x3'),
      name: 'Minis X3 para compartir',
      description: '3 minis bolos no pote de sabores variados.',
      price: Money.of(price),
      previousPrice: previousPrice === null ? null : Money.of(previousPrice),
      category: 'combo',
      flavorId: null,
      badge: null,
      art: JarArt.of('#b98f55', 'wave'),
      imageUrl: null,
      sizeOz: null,
      units,
      active: true,
      stock: null,
      position: 0,
    });

  it('calcula el ahorro y el porcentaje de descuento', () => {
    const combo = build(16000, 17500);
    expect(combo.isOnSale).toBe(true);
    expect(combo.savings?.amount).toBe(1500);
    expect(combo.discountPercent).toBe(9);
  });

  it('no reporta oferta cuando no hay precio anterior', () => {
    const combo = build(16000, null);
    expect(combo.isOnSale).toBe(false);
    expect(combo.savings).toBeNull();
    expect(combo.discountPercent).toBeNull();
  });

  it('rechaza un precio anterior menor o igual al actual', () => {
    // Un "antes" más barato que el "ahora" no es un descuento.
    expect(() => build(16000, 15000)).toThrow(ValidationError);
    expect(() => build(16000, 16000)).toThrow(ValidationError);
  });

  it('calcula el precio por pote en los combos', () => {
    expect(build(16000, null, 3).pricePerUnit?.format()).toBe('$5.333');
  });

  it('no calcula precio por unidad si el producto es uno solo', () => {
    expect(build(13000, null, null).pricePerUnit).toBeNull();
    expect(build(13000, null, 1).pricePerUnit).toBeNull();
  });

  it('rechaza unidades inválidas', () => {
    expect(() => build(16000, null, 0)).toThrow(ValidationError);
  });
});
