import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'prisma/config';

/**
 * Configuración de Prisma (reemplaza al bloque `prisma` del package.json,
 * deprecado desde la v6).
 *
 * Al existir este archivo, Prisma deja de cargar el .env por su cuenta, así
 * que lo hacemos aquí con la API nativa de Node.
 */
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
