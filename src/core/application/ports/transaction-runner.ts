/**
 * TransactionRunner — ejecuta varias escrituras como una sola unidad.
 *
 * Crear un pedido toca dos agregados: se guarda la orden y se descuenta el
 * stock de cada producto. Sin transacción, un fallo a mitad de camino dejaría
 * inventario descontado sin pedido que lo respalde.
 *
 * El puerto no expone nada de Prisma: solo "corre esto de forma atómica".
 */
export interface TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T>;
}
