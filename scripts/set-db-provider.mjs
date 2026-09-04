/**
 * Cambia el motor de base de datos en prisma/schema.prisma.
 *
 *   node scripts/set-db-provider.mjs postgresql
 *   node scripts/set-db-provider.mjs sqlite
 *
 * Existe porque Prisma no acepta una variable de entorno en `provider`: tiene
 * que ser un literal en el esquema. Editarlo a mano antes de cada despliegue
 * es justo el tipo de paso que se olvida, así que se automatiza.
 *
 * Además de cambiar el motor, ajusta `directUrl`. Supabase (como cualquier
 * Postgres detrás de un pooler) necesita dos conexiones:
 *
 *   · DATABASE_URL → puerto 6543, con pgbouncer. La que usa la app en
 *     producción, porque las funciones serverless abren y cierran conexiones
 *     todo el tiempo y sin pooler se agota el límite.
 *   · DIRECT_URL   → puerto 5432, sin pooler. La que usa Prisma para crear y
 *     migrar tablas, que es algo que el pooler no soporta.
 *
 * En SQLite `directUrl` no es válido, así que se quita al volver atrás.
 *
 * El esquema está diseñado para ser compatible con ambos motores: no usa
 * enums nativos ni arrays, que SQLite no soporta.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SUPPORTED = ['sqlite', 'postgresql'];

const target = process.argv[2];

if (!SUPPORTED.includes(target)) {
  console.error(
    `\n✖ Motor no soportado: "${target ?? ''}"\n` +
      `  Usa uno de: ${SUPPORTED.join(', ')}\n\n` +
      `  Ejemplo: node scripts/set-db-provider.mjs postgresql\n`,
  );
  process.exit(1);
}

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
let schema = readFileSync(schemaPath, 'utf8');

const PROVIDER_LINE = /^(\s*provider\s*=\s*)"(sqlite|postgresql)"(\s*)$/m;
const DIRECT_URL_LINE = /^\s*directUrl\s*=\s*env\("DIRECT_URL"\)\s*\n/m;
const URL_LINE = /^(\s*url\s*=\s*env\("DATABASE_URL"\)\s*)\n/m;

const match = schema.match(PROVIDER_LINE);

if (!match) {
  console.error('\n✖ No se encontró la línea `provider` del datasource en el esquema.\n');
  process.exit(1);
}

const current = match[2];
const hasDirectUrl = DIRECT_URL_LINE.test(schema);
const needsDirectUrl = target === 'postgresql';

if (current === target && hasDirectUrl === needsDirectUrl) {
  console.log(`\n· El esquema ya está configurado para ${target}. Nada que hacer.\n`);
  process.exit(0);
}

schema = schema.replace(PROVIDER_LINE, `$1"${target}"$3`);

if (needsDirectUrl && !hasDirectUrl) {
  schema = schema.replace(URL_LINE, `$1\n  directUrl = env("DIRECT_URL")\n`);
} else if (!needsDirectUrl && hasDirectUrl) {
  schema = schema.replace(DIRECT_URL_LINE, '');
}

writeFileSync(schemaPath, schema);

console.log(`\n✓ Esquema configurado para ${target}` + (current !== target ? ` (antes: ${current})` : ''));

if (target === 'postgresql') {
  console.log('\n  Falta poner en el .env las dos conexiones de Supabase:');
  console.log('    DATABASE_URL  → Connection pooling  (puerto 6543)');
  console.log('    DIRECT_URL    → Direct connection   (puerto 5432)');
  console.log('\n  Luego:  npx prisma db push && npm run db:seed\n');
} else {
  console.log('\n  Luego:  npx prisma db push && npm run db:seed\n');
}
