/**
 * Contrato común de todos los casos de uso.
 *
 * Uno por operación de negocio, con un único método `execute`. Mantenerlos
 * pequeños es lo que hace que el SRP se sostenga: cuando un caso de uso
 * empieza a necesitar tres repositorios y un `if` de veinte ramas, casi
 * siempre había dos operaciones distintas escondidas ahí.
 */

import type { Result } from '@core/domain/shared/result';
import type { DomainError } from '@core/domain/shared/errors';

export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<Result<TOutput, DomainError>>;
}

/** Caso de uso sin parámetros de entrada. */
export interface Query<TOutput> {
  execute(): Promise<Result<TOutput, DomainError>>;
}
