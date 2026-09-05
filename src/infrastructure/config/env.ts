/**
 * Configuración de la aplicación.
 *
 * Política de fallos, pensada para que un despliegue no se caiga por un dedazo
 * en el panel de Vercel:
 *
 *   · `DATABASE_URL` es lo único que puede detener la aplicación. Sin base de
 *     datos no hay tienda, y fallar en voz alta es mejor que servir un
 *     catálogo vacío como si nada pasara.
 *   · Todo lo demás degrada a un valor sensato y avisa por consola. Una
 *     variable en blanco, con espacios de más o mal escrita no debería dejar
 *     el negocio sin vender.
 *
 * Nada más en el código lee `process.env` directamente, salvo `resolveSiteUrl`.
 */

import { z } from 'zod';
import { firstPresent, resolveSiteUrl } from '@/lib/site-url';

// ── Valores por defecto del negocio ─────────────────────────────────────

const DEFAULT_WHATSAPP = '573180173770';
const DEFAULT_INSTAGRAM = 'docepotevup';
const DEFAULT_DELIVERY_FEE = 5000;
const DEFAULT_FREE_DELIVERY_THRESHOLD = 60000;
const COLOMBIA_CODE = '57';
const LOCALHOST = 'http://localhost:3000';

// ── Normalizadores ──────────────────────────────────────────────────────

/**
 * "+57 318 0173770" → "573180173770"; "3180173770" → "573180173770".
 *
 * Lo natural es pegar el número como se lee, y un par de espacios no debería
 * tumbar la tienda entera.
 */
function normalizeWhatsApp(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const digits = value.replace(/\D/g, '');
  if (!digits) return undefined;

  // Diez dígitos es un celular colombiano sin indicativo.
  return digits.length === 10 ? `${COLOMBIA_CODE}${digits}` : digits;
}

/**
 * "https://instagram.com/docepotevup?utm_source=..." → "docepotevup".
 *
 * El botón de compartir de Instagram copia la URL con parámetros de
 * seguimiento; pegarla tal cual rompería el enlace del pie de página.
 */
function normalizeInstagram(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const handle = value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/[?#].*$/, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '');

  return handle || undefined;
}

/** Entero desde texto: acepta "5000", "5.000" y "$ 5.000". */
function normalizeAmount(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : undefined;
}

/** Avisa cuándo se descartó un valor, para que el problema sea diagnosticable. */
function fallback<T>(name: string, value: T): T {
  console.warn(`[config] ${name} tiene un valor inválido; se usa el predeterminado.`);
  return value;
}

const amount = (name: string, byDefault: number) =>
  z
    .preprocess(normalizeAmount, z.number().int().nonnegative())
    .default(byDefault)
    .catch(() => fallback(name, byDefault));

// ── Esquema ─────────────────────────────────────────────────────────────

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development').catch('development'),

  // Lo único que puede detener la aplicación.
  DATABASE_URL: z
    .string()
    .min(1, 'Falta DATABASE_URL: la tienda no puede arrancar sin base de datos.'),

  SITE_URL: z
    .string()
    .url()
    .catch(() => fallback('SITE_URL', LOCALHOST)),

  /** Número que recibe los pedidos, en formato internacional sin "+". */
  WHATSAPP_NUMBER: z
    .preprocess(normalizeWhatsApp, z.string().regex(/^\d{10,15}$/))
    .default(DEFAULT_WHATSAPP)
    .catch(() => fallback('WHATSAPP_NUMBER', DEFAULT_WHATSAPP)),

  /** Usuario de Instagram, sin arroba ni URL. */
  INSTAGRAM: z
    .preprocess(normalizeInstagram, z.string().min(1))
    .default(DEFAULT_INSTAGRAM)
    .catch(() => fallback('INSTAGRAM', DEFAULT_INSTAGRAM)),

  // ── Pagos ─────────────────────────────────────────────────────────────
  // Wompi está escrito y listo, pero dormido: mientras no se elija
  // explícitamente y con sus llaves, la tienda cierra los pedidos por WhatsApp.
  PAYMENT_GATEWAY: z
    .enum(['whatsapp', 'wompi'])
    // `.default()` antes de `.catch()`: sin él, la ausencia del valor se
    // trataría como error y avisaría en cada arranque sin motivo.
    .default('whatsapp')
    .catch(() => fallback('PAYMENT_GATEWAY', 'whatsapp' as const)),

  WOMPI_PUBLIC_KEY: z.string().default('').catch(''),
  WOMPI_PRIVATE_KEY: z.string().default('').catch(''),
  WOMPI_INTEGRITY_SECRET: z.string().default('').catch(''),
  WOMPI_EVENTS_SECRET: z.string().default('').catch(''),
  WOMPI_ENVIRONMENT: z
    .enum(['sandbox', 'production'])
    .default('sandbox')
    .catch(() => fallback('WOMPI_ENVIRONMENT', 'sandbox' as const)),

  // ── Entrega ───────────────────────────────────────────────────────────
  DELIVERY_FEE_COP: amount('DELIVERY_FEE_COP', DEFAULT_DELIVERY_FEE),
  FREE_DELIVERY_THRESHOLD_COP: amount(
    'FREE_DELIVERY_THRESHOLD_COP',
    DEFAULT_FREE_DELIVERY_THRESHOLD,
  ),

  // Nota: aquí vivía SESSION_SECRET. Se quitó porque no se usaba en ninguna
  // parte: la sesión del panel es un identificador opaco y aleatorio guardado
  // en cookie httpOnly y validado contra la tabla `Session`, con vencimiento.
  // No hay nada firmado, así que no había secreto que aplicar — y mantenerlo
  // como obligatorio solo servía para tumbar despliegues.
});

export type AppConfig = z.infer<typeof schema>;

// ── Carga ───────────────────────────────────────────────────────────────

/**
 * Lee el entorno y valida.
 *
 * `firstPresent` trata el blanco como ausente: Zod aplica `.default()` solo
 * cuando el valor es `undefined`, nunca cuando es `""`, y en un panel como el
 * de Vercel es trivial crear una variable y dejarla vacía.
 *
 * Cada variable acepta también su nombre antiguo con prefijo `NEXT_PUBLIC_`,
 * para no romper despliegues que aún lo tengan configurado así.
 */
function load(): AppConfig {
  const parsed = schema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: firstPresent(process.env.DATABASE_URL),
    SITE_URL: resolveSiteUrl(),
    WHATSAPP_NUMBER: firstPresent(
      process.env.WHATSAPP_NUMBER,
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    ),
    INSTAGRAM: firstPresent(process.env.INSTAGRAM, process.env.NEXT_PUBLIC_INSTAGRAM),
    PAYMENT_GATEWAY: firstPresent(process.env.PAYMENT_GATEWAY),
    WOMPI_PUBLIC_KEY: firstPresent(process.env.WOMPI_PUBLIC_KEY),
    WOMPI_PRIVATE_KEY: firstPresent(process.env.WOMPI_PRIVATE_KEY),
    WOMPI_INTEGRITY_SECRET: firstPresent(process.env.WOMPI_INTEGRITY_SECRET),
    WOMPI_EVENTS_SECRET: firstPresent(process.env.WOMPI_EVENTS_SECRET),
    WOMPI_ENVIRONMENT: firstPresent(process.env.WOMPI_ENVIRONMENT),
    DELIVERY_FEE_COP: firstPresent(process.env.DELIVERY_FEE_COP),
    FREE_DELIVERY_THRESHOLD_COP: firstPresent(process.env.FREE_DELIVERY_THRESHOLD_COP),
  });

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración inválida — revisa tus variables de entorno:\n${detail}`);
  }

  return withPaymentGatewayResolved(parsed.data);
}

/**
 * Wompi solo se activa si además de elegirlo están sus llaves.
 *
 * Si se pide Wompi sin configurarlo, se vuelve a WhatsApp en vez de tumbar la
 * tienda: quedarse sin vender es peor que cobrar por el canal de siempre.
 */
function withPaymentGatewayResolved(settings: AppConfig): AppConfig {
  if (settings.PAYMENT_GATEWAY !== 'wompi') return settings;

  const configured =
    settings.WOMPI_PUBLIC_KEY && settings.WOMPI_INTEGRITY_SECRET && settings.WOMPI_EVENTS_SECRET;

  if (configured) return settings;

  console.warn(
    '[config] PAYMENT_GATEWAY=wompi pero faltan WOMPI_PUBLIC_KEY, ' +
      'WOMPI_INTEGRITY_SECRET o WOMPI_EVENTS_SECRET. Se sigue cobrando por WhatsApp.',
  );

  return { ...settings, PAYMENT_GATEWAY: 'whatsapp' };
}

let cached: AppConfig | null = null;

export function config(): AppConfig {
  cached ??= load();
  return cached;
}
