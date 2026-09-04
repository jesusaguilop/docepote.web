/**
 * Composition Root — el único punto de la aplicación donde se decide qué
 * implementación concreta cumple cada puerto.
 *
 * Todo lo demás (dominio, casos de uso, páginas) depende de interfaces. Si
 * mañana la persistencia pasa a Postgres, el pago a Wompi o el hash a argon2,
 * se cambia aquí y en ningún otro archivo. Eso es Dependency Inversion con
 * consecuencias reales, no un diagrama bonito.
 *
 * ⚠️ Solo servidor: importa Prisma y `node:crypto`. Nunca lo importes desde
 * un componente marcado con "use client".
 */

import 'server-only';

import { config } from './config/env';

import { PrismaProductRepository } from './persistence/prisma/product.repository';
import { PrismaFlavorRepository } from './persistence/prisma/flavor.repository';
import { PrismaOrderRepository } from './persistence/prisma/order.repository';
import {
  PrismaAdminUserRepository,
  PrismaSessionRepository,
} from './persistence/prisma/identity.repository';
import { PrismaTransactionRunner } from './persistence/prisma/client';

import { SystemClock } from './system/clock';
import { UuidGenerator } from './system/id-generator';
import { ScryptPasswordHasher } from './auth/scrypt-password-hasher';

import { WhatsAppOrderGateway } from './payments/whatsapp.gateway';
import { WompiGateway } from './payments/wompi.gateway';
import type { PaymentGateway } from '@core/application/ports/payment-gateway';

import { DeliveryPolicy } from '@core/domain/ordering/fulfillment';

import {
  ListFlavorsUseCase,
  ListProductsUseCase,
} from '@core/application/catalog/list-products.use-case';
import {
  GetProductBySlugUseCase,
  GetRelatedProductsUseCase,
} from '@core/application/catalog/get-product.use-case';
import { SaveProductUseCase } from '@core/application/catalog/save-product.use-case';
import {
  DeleteProductUseCase,
  SetProductStockUseCase,
  ToggleProductAvailabilityUseCase,
} from '@core/application/catalog/manage-product.use-case';

import { PlaceOrderUseCase } from '@core/application/ordering/place-order.use-case';
import { GetCartSummaryUseCase } from '@core/application/ordering/get-cart-summary.use-case';
import { ChangeOrderStatusUseCase } from '@core/application/ordering/change-order-status.use-case';
import {
  GetOrderByCodeUseCase,
  GetSalesSummaryUseCase,
  ListOrdersUseCase,
} from '@core/application/ordering/order-queries.use-case';
import {
  AuthenticateSessionUseCase,
  LoginUseCase,
  LogoutUseCase,
} from '@core/application/identity/authenticate.use-case';

/** Elige la pasarela según la configuración (Open/Closed: agregar una más no toca este switch más que con un caso). */
function createPaymentGateway(): PaymentGateway {
  const settings = config();

  if (settings.PAYMENT_GATEWAY === 'wompi') {
    return new WompiGateway({
      publicKey: settings.WOMPI_PUBLIC_KEY,
      integritySecret: settings.WOMPI_INTEGRITY_SECRET,
      eventsSecret: settings.WOMPI_EVENTS_SECRET,
      environment: settings.WOMPI_ENVIRONMENT,
      siteUrl: settings.SITE_URL,
    });
  }

  return new WhatsAppOrderGateway(settings.WHATSAPP_NUMBER, settings.SITE_URL);
}

function build() {
  const settings = config();

  // ── Adaptadores ──────────────────────────────────────────────────────
  const products = new PrismaProductRepository();
  const flavors = new PrismaFlavorRepository();
  const orders = new PrismaOrderRepository();
  const adminUsers = new PrismaAdminUserRepository();
  const sessions = new PrismaSessionRepository();
  const transactions = new PrismaTransactionRunner();

  const clock = new SystemClock();
  const ids = new UuidGenerator();
  const hasher = new ScryptPasswordHasher();
  const payments = createPaymentGateway();

  const deliveryPolicy = DeliveryPolicy.of(
    settings.DELIVERY_FEE_COP,
    settings.FREE_DELIVERY_THRESHOLD_COP,
  );

  // ── Casos de uso ─────────────────────────────────────────────────────
  return {
    config: settings,
    deliveryPolicy,
    paymentMethod: payments.method,

    catalog: {
      list: new ListProductsUseCase(products, flavors),
      listFlavors: new ListFlavorsUseCase(flavors),
      getBySlug: new GetProductBySlugUseCase(products, flavors),
      getRelated: new GetRelatedProductsUseCase(products, flavors),
      save: new SaveProductUseCase(products, flavors, ids),
      toggleAvailability: new ToggleProductAvailabilityUseCase(products, flavors),
      setStock: new SetProductStockUseCase(products, flavors),
      remove: new DeleteProductUseCase(products),
    },

    ordering: {
      placeOrder: new PlaceOrderUseCase(
        orders,
        products,
        deliveryPolicy,
        payments,
        transactions,
        clock,
        ids,
      ),
      cartSummary: new GetCartSummaryUseCase(products, flavors, deliveryPolicy),
      getByCode: new GetOrderByCodeUseCase(orders),
      list: new ListOrdersUseCase(orders),
      changeStatus: new ChangeOrderStatusUseCase(orders, clock),
      salesSummary: new GetSalesSummaryUseCase(orders, clock),
    },

    identity: {
      login: new LoginUseCase(adminUsers, sessions, hasher, clock, ids),
      authenticate: new AuthenticateSessionUseCase(sessions, adminUsers, clock),
      logout: new LogoutUseCase(sessions),
    },
  };
}

export type Container = ReturnType<typeof build>;

let instance: Container | null = null;

/**
 * Contenedor perezoso y cacheado: se construye la primera vez que alguien lo
 * pide, no al importar el módulo. Así `next build` no intenta conectarse a la
 * base de datos mientras analiza las rutas.
 */
export function container(): Container {
  instance ??= build();
  return instance;
}
