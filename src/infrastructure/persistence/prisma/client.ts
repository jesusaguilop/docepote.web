/**
 * Cliente de Prisma y contexto transaccional.
 *
 * El truco está en `AsyncLocalStorage`: cuando algo corre dentro de
 * `PrismaTransactionRunner.run()`, `db()` devuelve el cliente transaccional
 * en lugar del global. Los repositorios simplemente llaman a `db()` y no
 * necesitan recibir la transacción por parámetro — sus firmas quedan limpias
 * y el dominio nunca se entera de que Prisma existe.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaClient } from '@prisma/client';
import type { TransactionRunner } from '@core/application/ports/transaction-runner';

/** Cliente dentro de una transacción: el mismo API sin los métodos de nivel superior. */
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const transactionContext = new AsyncLocalStorage<TransactionClient>();

/**
 * En desarrollo, Next recarga los módulos en cada cambio. Sin este caché en
 * `globalThis` se abriría una conexión nueva por recarga hasta agotar el pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/** Cliente activo: el de la transacción en curso, o el global. */
export function db(): TransactionClient {
  return transactionContext.getStore() ?? prisma;
}

export class PrismaTransactionRunner implements TransactionRunner {
  async run<T>(work: () => Promise<T>): Promise<T> {
    // Si ya estamos dentro de una transacción, reusarla en vez de anidar:
    // SQLite no soporta transacciones anidadas.
    if (transactionContext.getStore()) return work();

    return prisma.$transaction((tx) => transactionContext.run(tx, work));
  }
}
