/**
 * Semilla de la base de datos — catálogo real de DOCEPOTE.
 *
 * Carga los seis sabores de la casa, los productos vigentes y el usuario del
 * panel. Es idempotente: se puede correr las veces que haga falta sin duplicar
 * nada, y al re-sembrar respeta el stock y la visibilidad que el negocio haya
 * ajustado desde el panel.
 *
 *     npm run db:seed
 *
 * Se importa con rutas relativas a propósito: el seed corre fuera del bundler
 * de Next, donde los alias `@core/*` no están resueltos.
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ScryptPasswordHasher } from '../src/infrastructure/auth/scrypt-password-hasher';
import { Slug } from '../src/core/domain/shared/slug';

const prisma = new PrismaClient();
const hasher = new ScryptPasswordHasher();

// ─────────────────────────────────────────────────────────────────────────
//  Sabores
// ─────────────────────────────────────────────────────────────────────────

type Pattern = 'wave' | 'dots' | 'drop';

interface SeedFlavor {
  id: string;
  name: string;
  emoji: string;
  summary: string;
  composition: string | null;
  /** Cómo se pinta el pote de este sabor en la tienda. */
  fillColor: string;
  pattern: Pattern;
}

const FLAVORS: SeedFlavor[] = [
  {
    id: 'chocoklim',
    name: 'Chocoklim',
    emoji: '🤍',
    summary: 'Vainilla, chocolate y brigadeiro de leche Klim.',
    composition: null,
    fillColor: '#c8a878',
    pattern: 'wave',
  },
  {
    id: 'frutas-vermelhas',
    name: 'Frutas Vermelhas',
    emoji: '🍓',
    summary: 'Vainilla con crema artesanal de fresas y arándanos.',
    composition:
      'Mezcla de brigadeiro con mermelada artesanal 100% natural hecha con fresas y arándanos + capa de bizcocho pão de ló de vainilla + topping de fresas picadas.',
    fillColor: '#b6304a',
    pattern: 'drop',
  },
  {
    id: 'docepistache',
    name: 'DocePistache',
    emoji: '💚',
    summary: 'Cremoso, suave y con el delicioso sabor del pistache.',
    composition: null,
    fillColor: '#8fae4e',
    pattern: 'wave',
  },
  {
    id: 'chocolatudo',
    name: 'Chocolatudo',
    emoji: '🍫',
    summary:
      'Bizcocho de chocolate con una irresistible crema de brigadeiro artesanal de chocolate medio amargo.',
    composition: 'Brigadeiro de chocolate + torta de chocolate 100% cacao.',
    fillColor: '#4a2c18',
    pattern: 'wave',
  },
  {
    id: 'milo-cookies-sultana',
    name: 'Milo and Cookies Sultana',
    emoji: '🥜',
    summary: 'La combinación perfecta de crema de Milo y galletas sultana con chocolate blanco.',
    composition: null,
    fillColor: '#8a6a3f',
    pattern: 'dots',
  },
  {
    id: 'oreo',
    name: 'Oreo',
    emoji: '🖤',
    summary: 'Cremoso, chocolatoso y con el toque irresistible de Oreo.',
    composition:
      'Capa de brigadeiro de chocolate blanco con galleta Oreo triturada + bizcocho pão de ló de chocolate 100% cacao + topping de galleta Oreo pulverizada.',
    fillColor: '#2e2a2a',
    pattern: 'dots',
  },
];

// ─────────────────────────────────────────────────────────────────────────
//  Productos
// ─────────────────────────────────────────────────────────────────────────

interface SeedProduct {
  name: string;
  category: 'individual' | 'mini' | 'combo' | 'eventos';
  /** `null` en combos y kits, que llevan varios sabores. */
  flavorId: string | null;
  price: number;
  /** Precio anterior tachado. `null` si no hay oferta. */
  previousPrice: number | null;
  description: string;
  badge: string | null;
  sizeOz: number | null;
  units: number | null;
  /** Solo para combos: cómo se pinta su pote. */
  art?: { fillColor: string; pattern: Pattern };
}

const PRODUCTS: SeedProduct[] = [
  // ── Individuales ──────────────────────────────────────────────────────
  {
    name: 'Bolo no pote Chocolatudo',
    category: 'individual',
    flavorId: 'chocolatudo',
    price: 13000,
    previousPrice: 13600,
    description: 'Brigadeiro de chocolate + torta de chocolate 100% cacao. ¡Qué combinación!',
    badge: 'Más pedido',
    sizeOz: 8,
    units: null,
  },
  {
    name: 'Bolo no pote Oreo',
    category: 'individual',
    flavorId: 'oreo',
    price: 13000,
    previousPrice: 13500,
    description:
      'Brigadeiro de chocolate blanco con Oreo triturada sobre bizcocho de cacao, con topping de galleta.',
    badge: null,
    sizeOz: 8,
    units: null,
  },
  {
    name: 'Bolo no pote Chocoklim',
    category: 'individual',
    flavorId: 'chocoklim',
    price: 13000,
    previousPrice: 13500,
    description: 'Vainilla, chocolate y brigadeiro de leche Klim en capas.',
    badge: null,
    sizeOz: 8,
    units: null,
  },
  {
    name: 'Bolo no pote Frutas Vermelhas',
    category: 'individual',
    flavorId: 'frutas-vermelhas',
    price: 13000,
    previousPrice: 13500,
    description:
      'Vainilla con crema artesanal de fresas y arándanos, y topping de fresas picadas.',
    badge: null,
    sizeOz: 8,
    units: null,
  },
  {
    name: 'Bolo no pote Milo and Cookies Sultana',
    category: 'individual',
    flavorId: 'milo-cookies-sultana',
    price: 13000,
    previousPrice: 13500,
    description: 'Crema de Milo y galletas sultana con chocolate blanco.',
    badge: null,
    sizeOz: 8,
    units: null,
  },

  // ── Minis ─────────────────────────────────────────────────────────────
  {
    name: 'Mini bolo no pote DocePistache',
    category: 'mini',
    flavorId: 'docepistache',
    price: 5800,
    previousPrice: null,
    description: 'Cremoso, suave y con el delicioso sabor del pistache. En versión mini.',
    badge: null,
    sizeOz: null,
    units: null,
  },
  {
    name: 'Mini bolo no pote Chocoklim',
    category: 'mini',
    flavorId: 'chocoklim',
    price: 5800,
    previousPrice: null,
    description: 'Vainilla, chocolate y brigadeiro de leche Klim. En versión mini.',
    badge: null,
    sizeOz: null,
    units: null,
  },
  {
    name: 'Mini bolo no pote Chocolatudo',
    category: 'mini',
    flavorId: 'chocolatudo',
    price: 5800,
    previousPrice: null,
    description: 'Brigadeiro de chocolate y torta 100% cacao. En versión mini.',
    badge: null,
    sizeOz: null,
    units: null,
  },
  {
    name: 'Mini bolo no pote Frutas Vermelhas',
    category: 'mini',
    flavorId: 'frutas-vermelhas',
    price: 5800,
    previousPrice: null,
    description: 'Vainilla con crema artesanal de fresas y arándanos. En versión mini.',
    badge: null,
    sizeOz: null,
    units: null,
  },
  {
    name: 'Mini bolo no pote Oreo',
    category: 'mini',
    flavorId: 'oreo',
    price: 5800,
    previousPrice: null,
    description: 'Brigadeiro de chocolate blanco con Oreo. En versión mini.',
    badge: null,
    sizeOz: null,
    units: null,
  },

  // ── Para compartir ────────────────────────────────────────────────────
  {
    name: 'Minis X3 para compartir',
    category: 'combo',
    flavorId: null,
    price: 16000,
    previousPrice: 17500,
    description:
      '3 minis bolos no pote de sabores variados. Elige tus favoritos. Perfecto para compartir. Sabores en la foto: Chocoklim, DocePistache y Oreo.',
    badge: 'Para compartir',
    sizeOz: null,
    units: 3,
    art: { fillColor: '#b98f55', pattern: 'wave' },
  },

  // ── Eventos ───────────────────────────────────────────────────────────
  {
    name: 'Shots eventos kit 30',
    category: 'eventos',
    flavorId: null,
    price: 75000,
    previousPrice: 80000,
    description:
      'Una deliciosa degustación de nuestros 6 sabores para eventos, reuniones, cumpleaños y encuentros entre amigos. Versión mini shots para probar y compartir un poquito de cada uno.',
    badge: 'Eventos',
    sizeOz: null,
    units: 30,
    art: { fillColor: '#9c6405', pattern: 'dots' },
  },
];

// ─────────────────────────────────────────────────────────────────────────

async function seedFlavors(): Promise<void> {
  for (const [index, flavor] of FLAVORS.entries()) {
    const data = {
      slug: Slug.fromText(flavor.name).value,
      name: flavor.name,
      emoji: flavor.emoji,
      summary: flavor.summary,
      composition: flavor.composition,
      position: index,
    };

    await prisma.flavor.upsert({
      where: { id: flavor.id },
      update: data,
      create: { id: flavor.id, ...data },
    });
  }

  console.log(`  ✓ ${FLAVORS.length} sabores`);
}

async function seedProducts(): Promise<void> {
  const artByFlavor = new Map(
    FLAVORS.map((flavor) => [flavor.id, { fillColor: flavor.fillColor, pattern: flavor.pattern }]),
  );

  for (const [index, item] of PRODUCTS.entries()) {
    const slug = Slug.fromText(item.name).value;

    // El pote hereda el color del sabor; los combos traen el suyo.
    const art =
      item.art ?? (item.flavorId ? artByFlavor.get(item.flavorId) : undefined) ?? {
        fillColor: '#b98f55',
        pattern: 'wave' as Pattern,
      };

    const shared = {
      name: item.name,
      description: item.description,
      price: item.price,
      previousPrice: item.previousPrice,
      category: item.category,
      flavorId: item.flavorId,
      badge: item.badge,
      fillColor: art.fillColor,
      pattern: art.pattern,
      sizeOz: item.sizeOz,
      units: item.units,
      position: index,
    };

    await prisma.product.upsert({
      where: { slug },
      // Al re-sembrar no se pisan `stock` ni `active`: puede que el negocio
      // ya los haya ajustado desde el panel esta mañana.
      update: shared,
      create: {
        id: randomUUID(),
        slug,
        ...shared,
        imageUrl: null,
        active: true,
        // Sin control de inventario por defecto: el catálogo original no
        // declara existencias. Se activa por producto desde el panel.
        stock: null,
      },
    });
  }

  console.log(`  ✓ ${PRODUCTS.length} productos`);
}

async function seedAdmin(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? 'hola@docepote.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'docepote2026';
  const name = process.env.ADMIN_NAME ?? 'Equipo DOCEPOTE';

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`  · El administrador ${email} ya existía, no se toca`);
    return;
  }

  await prisma.adminUser.create({
    data: { id: randomUUID(), email, name, passwordHash: await hasher.hash(password) },
  });

  console.log(`  ✓ Administrador creado: ${email}`);
  console.log(`    Contraseña: ${password}  ← cámbiala en producción`);
}

async function main(): Promise<void> {
  console.log('\n🐱 Sembrando la base de datos de DOCEPOTE...\n');
  await seedFlavors();
  await seedProducts();
  await seedAdmin();
  console.log('\n✨ Listo.\n');
}

main()
  .catch((error: unknown) => {
    console.error('\n✖ Falló el seed:\n', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
