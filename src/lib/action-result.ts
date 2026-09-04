/**
 * Resultado de una Server Action.
 *
 * Los `Result` del dominio llevan instancias de `DomainError`, que son clases
 * y no cruzan la frontera servidor→cliente. Aquí se aplanan a un objeto
 * serializable, que es lo que el componente de React puede recibir.
 */

import { isDomainError, type DomainErrorCode } from '@core/domain/shared/errors';
import type { Result } from '@core/domain/shared/result';

export type ActionResult<T> =
  | { readonly ok: true; readonly data: T }
  | {
      readonly ok: false;
      readonly error: string;
      readonly code: DomainErrorCode | 'UNEXPECTED';
      readonly details: Readonly<Record<string, string>>;
    };

export function fromResult<T>(result: Result<T>): ActionResult<T> {
  if (result.ok) return { ok: true, data: result.value };
  return {
    ok: false,
    error: result.error.message,
    code: result.error.code,
    details: result.error.details,
  };
}

/**
 * Envuelve una acción para que nunca reviente contra el cliente.
 *
 * Los errores de dominio se devuelven con su mensaje (están escritos para que
 * el cliente los lea). Cualquier otra excepción se registra en el servidor y
 * al usuario le llega un mensaje genérico: un stack trace de la base de datos
 * no le sirve a nadie y sí le sirve a un atacante.
 */
export async function guard<T>(work: () => Promise<Result<T>>): Promise<ActionResult<T>> {
  try {
    return fromResult(await work());
  } catch (error) {
    if (isDomainError(error)) {
      return { ok: false, error: error.message, code: error.code, details: error.details };
    }
    console.error('[action] error inesperado:', error);
    return {
      ok: false,
      error: 'Algo se nos quemó en la cocina. Intenta de nuevo en un momento.',
      code: 'UNEXPECTED',
      details: {},
    };
  }
}
