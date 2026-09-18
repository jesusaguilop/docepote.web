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
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
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
  /** Traducción al portugués. `null` en un campo = se muestra el español. */
  pt: { name: string | null; summary: string; composition: string | null };
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
        pt: { name: null, summary: 'Baunilha, chocolate e brigadeiro de leite Klim.', composition: null },
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
        pt: { name: null, summary: 'Baunilha com creme artesanal de morango e mirtilo.', composition: 'Mistura de brigadeiro com geleia artesanal 100% natural de morango e mirtilo + camada de pão de ló de baunilha + cobertura de morangos picados.' },
    fillColor: '#b6304a',
    pattern: 'drop',
  },
  {
    id: 'docepistache',
    name: 'DocePistache',
    emoji: '💚',
    summary: 'Cremoso, suave y con el delicioso sabor del pistache.',
    composition: null,
        pt: { name: null, summary: 'Cremoso, suave e com o delicioso sabor de pistache.', composition: null },
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
        pt: { name: null, summary: 'Pão de ló de chocolate com um irresistível creme de brigadeiro artesanal de chocolate meio amargo.', composition: 'Brigadeiro de chocolate + bolo de chocolate 100% cacau.' },
    fillColor: '#4a2c18',
    pattern: 'wave',
  },
  {
    id: 'milo-cookies-sultana',
    name: 'Milo and Cookies Sultana',
    emoji: '🥜',
    summary: 'La combinación perfecta de crema de Milo y galletas sultana con chocolate blanco.',
    composition: null,
        pt: { name: null, summary: 'A combinação perfeita de creme de Milo e biscoitos sultana com chocolate branco.', composition: null },
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
        pt: { name: null, summary: 'Cremoso, chocolatudo e com o toque irresistível de Oreo.', composition: 'Camada de brigadeiro de chocolate branco com biscoito Oreo triturado + pão de ló de chocolate 100% cacau + cobertura de Oreo em pó.' },
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
  /** Traducción al portugués. El nombre suele servir igual en ambos idiomas
      — "bolo no pote" ya es portugués —, así que a menudo solo cambia la
      descripción. `null` en un campo = se muestra el español. */
  pt: { name: string | null; description: string };
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
    pt: { name: null, description: 'Brigadeiro de chocolate + bolo de chocolate 100% cacau. Que combinação!' },
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
    pt: { name: null, description: 'Brigadeiro de chocolate branco com Oreo triturado sobre pão de ló de cacau, com cobertura de biscoito.' },
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
    pt: { name: null, description: 'Baunilha, chocolate e brigadeiro de leite Klim em camadas.' },
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
    pt: { name: null, description: 'Baunilha com creme artesanal de morango e mirtilo, e cobertura de morangos picados.' },
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
    pt: { name: null, description: 'Creme de Milo e biscoitos sultana com chocolate branco.' },
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
    pt: { name: null, description: 'Cremoso, suave e com o delicioso sabor de pistache. Na versão mini.' },
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
    pt: { name: null, description: 'Baunilha, chocolate e brigadeiro de leite Klim. Na versão mini.' },
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
    pt: { name: null, description: 'Brigadeiro de chocolate e bolo 100% cacau. Na versão mini.' },
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
    pt: { name: null, description: 'Baunilha com creme artesanal de morango e mirtilo. Na versão mini.' },
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
    pt: { name: null, description: 'Brigadeiro de chocolate branco com Oreo. Na versão mini.' },
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
    pt: { name: 'Minis X3 para compartilhar', description: '3 minis bolos no pote de sabores variados. Escolha os seus favoritos. Perfeito para dividir. Sabores da foto: Chocoklim, DocePistache e Oreo.' },
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
    pt: { name: 'Shots eventos kit 30', description: 'Uma deliciosa degustação dos nossos 6 sabores para eventos, encontros, aniversários e reuniões com amigos. Versão mini shots para provar e dividir um pouquinho de cada um.' },
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
      namePt: flavor.pt.name,
      summaryPt: flavor.pt.summary,
      compositionPt: flavor.pt.composition,
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
      namePt: item.pt.name,
      descriptionPt: item.pt.description,
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

// ─────────────────────────────────────────────────────────────────────────
//  Temporadas
// ─────────────────────────────────────────────────────────────────────────

/**
 * Las dos temporadas de arranque.
 *
 * "Como siempre" existe aunque sea idéntica a la paleta de fábrica: sin ella,
 * volver del rosado al kraft obligaría a saberse los doce hexadecimales. Con
 * ella es un clic.
 *
 * Los colores de Amor y Amistad están muestreados de la pieza de la campaña
 * ("Edición especial · Brownies artesanales"), no inventados a ojo: el rosa
 * del fondo (#f28db0), la crema de los títulos (#fddeb5), el vino del
 * lettering (#52010d) y la frambuesa de los corazones del sticker (#bc0045).
 *
 * El papel es una versión lavada de ese rosa y no el rosa a secas: el fondo
 * de la pieza carga cuatro palabras, el de la tienda carga párrafos, fichas
 * de producto y un formulario de pedido.
 */
const SEASONS = [
  {
    id: 'temporada-kraft',
    name: 'Como siempre',
    active: false,
    colors: {
      ink: '#251a10',
      inkSoft: '#5b4a38',
      accent: '#7c9a34',
      accentDeep: '#4c6420',
      accentDark: '#38480f',
      kraft: '#c7ae85',
      kraftDark: '#8c6f45',
      kraftLine: '#a98c5e',
      caramel: '#9c6405',
      paper: '#f2ecdd',
      paper2: '#eae1cb',
      berry: '#8c2e2e',
    },
    mascot: null,
  },
  {
    id: 'temporada-amor-y-amistad',
    name: 'Amor y Amistad',
    active: true,
    colors: {
      ink: '#52010d',
      inkSoft: '#7d3a48',
      accent: '#f28db0',
      accentDeep: '#bc0045',
      accentDark: '#8f0034',
      kraft: '#fddeb5',
      kraftDark: '#c98fa4',
      kraftLine: '#eab4c7',
      caramel: '#c35a3a',
      paper: '#fdeef3',
      paper2: '#fbdfe9',
      berry: '#8c2e2e',
    },
    mascot: {
      file: 'public/brand/amor-mascot.png',
      mimeType: 'image/png',
      alt: 'El gato de Doce pote abrazando un brownie lleno de corazones',
    },
  },
] as const;

async function seedSeasons(): Promise<void> {
  for (const season of SEASONS) {
    // Si ya existe se respeta tal cual: puede que el negocio le haya movido
    // los colores desde el panel, y el seed no está para deshacer eso.
    const existing = await prisma.season.findUnique({ where: { id: season.id } });
    if (existing) {
      console.log(`  · La temporada "${season.name}" ya existía, no se toca`);
      continue;
    }

    // Prisma tipa las columnas de bytes como `Uint8Array<ArrayBuffer>`, y
    // tanto el `Buffer` de Node como `Uint8Array.from` prometen menos que
    // eso (`ArrayBufferLike`, que incluye memoria compartida). Copiar los
    // bytes a un array nuevo da exactamente el tipo que la columna pide.
    let mascotImage: Uint8Array<ArrayBuffer> | null = null;
    if (season.mascot) {
      try {
        const bytes = await readFile(path.join(process.cwd(), season.mascot.file));
        mascotImage = new Uint8Array(bytes.byteLength);
        mascotImage.set(bytes);
      } catch {
        // Sin la imagen la temporada sigue siendo válida: se queda con los
        // colores y el hero usa el gato de siempre.
        console.log(`  ! No se encontró ${season.mascot.file}; la temporada va sin mascota`);
      }
    }

    await prisma.season.create({
      data: {
        id: season.id,
        name: season.name,
        active: season.active,
        ...season.colors,
        mascotImage,
        mascotMimeType: mascotImage ? (season.mascot?.mimeType ?? null) : null,
        mascotAlt: mascotImage ? (season.mascot?.alt ?? null) : null,
      },
    });

    console.log(`  ✓ Temporada "${season.name}"${season.active ? ' (puesta)' : ''}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
//  Especiales de Amor y Amistad
// ─────────────────────────────────────────────────────────────────────────

/**
 * Los tres productos de la campaña de brownies.
 *
 * Precios, nombres y descripciones son los que pasó el negocio, no
 * invenciones de este archivo. Salen publicados.
 *
 * Llevan el chocolate del brownie como color de pote —no son potes, y con el
 * color de un sabor de la casa se confundirían— y su propia etiqueta.
 */
const CHOCOLATE_BROWNIE = '#5d160f';

const SPECIALS = [
  {
    slug: 'brigabrownie',
    name: 'Brigabrownie',
    description:
      'Delicioso brownie de chocolate de capa doble, con brigadeiro de chocolate semiamargo en la mitad y trocitos de galleta Oreo. 🤤',
    descriptionPt:
      'Delicioso brownie de chocolate de camada dupla, com brigadeiro de chocolate meio amargo no meio e pedacinhos de biscoito Oreo. 🤤',
    price: 10000,
    /** Estaba en 12.000: la tienda lo pinta tachado y calcula el descuento. */
    previousPrice: 12000,
    category: 'individual',
    badge: 'Edición especial',
    units: null,
    position: 90,
  },
  {
    slug: 'minibrownies-personalizados',
    name: 'Minibrownies personalizados',
    description:
      '12 minibrownies de tu preferencia, con los sabores favoritos disponibles en DOCEPOTE. 💚 Cuéntanos tu idea y sorprende en esas fechas especiales. 🤎',
    descriptionPt:
      '12 minibrownies do seu jeito, com os sabores favoritos disponíveis na DOCEPOTE. 💚 Conte sua ideia e surpreenda nessas datas especiais. 🤎',
    price: 25000,
    previousPrice: null,
    category: 'combo',
    badge: '2 X 18.000',
    units: 12,
    position: 91,
  },
  {
    slug: 'degustacion-shots',
    name: 'Degustación shots',
    description:
      'Degusta nuestros sabores de minishots de bolo no pote. 💚 Fórmula secreta con el toque perfecto de cariño y dedicación, inspirada en los postres brasileños. 100% artesanal, hecho con amor.',
    descriptionPt:
      'Prove nossos sabores de minishots de bolo no pote. 💚 Fórmula secreta com o toque perfeito de carinho e dedicação, inspirada nos doces brasileiros. 100% artesanal, feito com amor.',
    price: 15000,
    previousPrice: null,
    category: 'combo',
    badge: 'Edición especial',
    units: null,
    position: 92,
  },
] as const;

async function seedSpecials(): Promise<void> {
  for (const special of SPECIALS) {
    const existing = await prisma.product.findUnique({ where: { slug: special.slug } });
    if (existing) {
      console.log(`  · "${special.name}" ya existía, no se toca`);
      continue;
    }

    await prisma.product.create({
      data: {
        id: randomUUID(),
        slug: Slug.of(special.slug).value,
        name: special.name,
        description: special.description,
        descriptionPt: special.descriptionPt,
        price: special.price,
        previousPrice: special.previousPrice,
        category: special.category,
        flavorId: null,
        badge: special.badge,
        fillColor: CHOCOLATE_BROWNIE,
        pattern: 'drop',
        units: special.units,
        sizeOz: null,
        active: true,
        stock: null,
        position: special.position,
      },
    });

    console.log(`  ✓ "${special.name}" · $${special.price.toLocaleString('es-CO')}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
//  Fotos de producto
// ─────────────────────────────────────────────────────────────────────────

/**
 * Sube las fotos de `prisma/fotos` a la base.
 *
 * El nombre del archivo es el contrato: `<slug>-<orden>.jpg`. El orden
 * importa porque la 1 es la que sale en la tarjeta del catálogo.
 *
 * Solo toca productos que no tengan ninguna foto todavía. Así re-sembrar no
 * pisa lo que el negocio haya subido o reordenado desde el panel, que es
 * exactamente el tipo de trabajo que duele perder.
 */
const CARPETA_FOTOS = 'prisma/fotos';

async function seedProductImages(): Promise<void> {
  let carpeta: string[];

  try {
    carpeta = await readdir(path.join(process.cwd(), CARPETA_FOTOS));
  } catch {
    console.log(`  · No hay carpeta ${CARPETA_FOTOS}; me salto las fotos`);
    return;
  }

  // Agrupadas por slug y ordenadas por el número del nombre.
  const porSlug = new Map<string, { archivo: string; orden: number }[]>();

  for (const archivo of carpeta) {
    const match = /^(.+)-(\d+)\.jpe?g$/i.exec(archivo);
    if (!match?.[1] || !match[2]) continue;

    const slug = match[1];
    const lista = porSlug.get(slug) ?? [];
    lista.push({ archivo, orden: Number(match[2]) });
    porSlug.set(slug, lista);
  }

  let subidas = 0;

  for (const [slug, archivos] of porSlug) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      console.log(`  ! No hay producto con slug "${slug}"; sus fotos se quedan sin subir`);
      continue;
    }

    const yaTiene = await prisma.productImage.count({ where: { productId: product.id } });
    if (yaTiene > 0) {
      console.log(`  · "${product.name}" ya tiene ${yaTiene} foto(s), no se toca`);
      continue;
    }

    archivos.sort((a, b) => a.orden - b.orden);

    for (const [index, { archivo }] of archivos.entries()) {
      const bytes = await readFile(path.join(process.cwd(), CARPETA_FOTOS, archivo));
      const image = new Uint8Array(bytes.byteLength);
      image.set(bytes);

      await prisma.productImage.create({
        data: {
          id: randomUUID(),
          productId: product.id,
          position: index,
          image,
          mimeType: 'image/jpeg',
          alt: `${product.name} de Doce pote`,
        },
      });

      subidas += 1;
    }

    console.log(`  ✓ "${product.name}": ${archivos.length} foto(s)`);
  }

  console.log(`  ✓ ${subidas} fotos en total`);
}

async function main(): Promise<void> {
  console.log('\n🐱 Sembrando la base de datos de DOCEPOTE...\n');
  await seedFlavors();
  await seedProducts();
  await seedSpecials();
  await seedAdmin();
  await seedSeasons();
  await seedProductImages();
  console.log('\n✨ Listo.\n');
}

main()
  .catch((error: unknown) => {
    console.error('\n✖ Falló el seed:\n', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
