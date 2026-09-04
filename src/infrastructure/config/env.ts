/**
 * Configuración de la aplicación, validada al arrancar.
 *
 * Si falta una variable o viene mal, el proceso falla de inmediato con un
 * mensaje claro — mucho mejor que descubrirlo cuando un cliente intenta
 * pagar. Nada más en el código lee `process.env` directamente.
 */

import { z } from 'zod';

const intFromString = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === '' ? fallback : Number(value)))
    .pipe(z.number().int().nonnegative());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().min(1, 'Falta DATABASE_URL en el .env'),

  SITE_URL: z.string().url().default('http://localhost:3000'),
  WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d{10,15}$/, 'WHATSAPP_NUMBER debe ser solo dígitos en formato internacional'),
  INSTAGRAM: z.string().default('docepotevup'),

  PAYMENT_GATEWAY: z.enum(['whatsapp', 'wompi']).default('whatsapp'),

  WOMPI_PUBLIC_KEY: z.string().default(''),
  WOMPI_PRIVATE_KEY: z.string().default(''),
  WOMPI_INTEGRITY_SECRET: z.string().default(''),
  WOMPI_EVENTS_SECRET: z.string().default(''),
  WOMPI_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),

  DELIVERY_FEE_COP: intFromString(5000),
  FREE_DELIVERY_THRESHOLD_COP: intFromString(60000),

  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET debe tener al menos 16 caracteres'),
});

export type AppConfig = z.infer<typeof schema>;

function load(): AppConfig {
  const parsed = schema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    INSTAGRAM: process.env.NEXT_PUBLIC_INSTAGRAM,
    PAYMENT_GATEWAY: process.env.PAYMENT_GATEWAY,
    WOMPI_PUBLIC_KEY: process.env.WOMPI_PUBLIC_KEY,
    WOMPI_PRIVATE_KEY: process.env.WOMPI_PRIVATE_KEY,
    WOMPI_INTEGRITY_SECRET: process.env.WOMPI_INTEGRITY_SECRET,
    WOMPI_EVENTS_SECRET: process.env.WOMPI_EVENTS_SECRET,
    WOMPI_ENVIRONMENT: process.env.WOMPI_ENVIRONMENT,
    DELIVERY_FEE_COP: process.env.DELIVERY_FEE_COP,
    FREE_DELIVERY_THRESHOLD_COP: process.env.FREE_DELIVERY_THRESHOLD_COP,
    SESSION_SECRET: process.env.SESSION_SECRET,
  });

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración inválida — revisa tu archivo .env:\n${detail}`);
  }

  const config = parsed.data;

  if (config.PAYMENT_GATEWAY === 'wompi' && !config.WOMPI_PUBLIC_KEY) {
    throw new Error(
      'PAYMENT_GATEWAY=wompi requiere WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY y WOMPI_INTEGRITY_SECRET.',
    );
  }

  return config;
}

let cached: AppConfig | null = null;

export function config(): AppConfig {
  cached ??= load();
  return cached;
}
