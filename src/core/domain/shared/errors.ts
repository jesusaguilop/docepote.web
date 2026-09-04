/**
 * Errores del dominio.
 *
 * Son deliberadamente agnósticos del transporte: no conocen HTTP ni Next.
 * La capa de presentación es la única responsable de traducirlos a un
 * status code (ver `src/lib/http.ts`).
 */

export type DomainErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'UNAVAILABLE'
  | 'GATEWAY';

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details: Readonly<Record<string, string>>;

  constructor(code: DomainErrorCode, message: string, details: Record<string, string> = {}) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details: Record<string, string> = {}) {
    super('VALIDATION', message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, identifier: string) {
    super('NOT_FOUND', `No encontramos ${resource} con identificador "${identifier}".`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details: Record<string, string> = {}) {
    super('CONFLICT', message, details);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'No tienes permiso para hacer esto.') {
    super('UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

/** El producto existe pero no se puede vender ahora (agotado o desactivado). */
export class UnavailableError extends DomainError {
  constructor(message: string, details: Record<string, string> = {}) {
    super('UNAVAILABLE', message, details);
    this.name = 'UnavailableError';
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
