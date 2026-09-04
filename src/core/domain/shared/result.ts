/**
 * Result: resultado explícito en lugar de excepciones para flujos esperables.
 *
 * Los casos de uso lo devuelven para que el llamador tenga que decidir
 * conscientemente qué hacer con el error, en vez de olvidar un try/catch.
 */

import type { DomainError } from './errors';

export type Result<T, E extends Error = DomainError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const Err = <E extends Error>(error: E): Result<never, E> => ({ ok: false, error });

/** Desempaqueta el valor o lanza. Úsalo solo donde el error sea irrecuperable. */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}
