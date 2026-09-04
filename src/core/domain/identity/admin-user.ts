/**
 * AdminUser — quien administra la tienda.
 *
 * La entidad nunca ve contraseñas en claro ni sabe cómo se cifran: solo
 * guarda el hash. El algoritmo vive detrás del puerto `PasswordHasher`,
 * así que cambiar de scrypt a argon2 no toca el dominio.
 */

import { ValidationError } from '../shared/errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface AdminUserProps {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
}

export class AdminUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string;
  readonly createdAt: Date;

  private constructor(props: AdminUserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.passwordHash = props.passwordHash;
    this.createdAt = props.createdAt;
    Object.freeze(this);
  }

  static create(props: AdminUserProps): AdminUser {
    const email = props.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      throw new ValidationError('El correo no tiene un formato válido.');
    }
    const name = props.name.trim();
    if (name.length < 2) {
      throw new ValidationError('El nombre debe tener al menos 2 caracteres.');
    }
    return new AdminUser({ ...props, email, name });
  }

  static rehydrate(props: AdminUserProps): AdminUser {
    return new AdminUser(props);
  }
}

/** Requisito mínimo de contraseña, validado antes de hashear. */
export function assertStrongEnough(password: string): void {
  if (password.length < 8) {
    throw new ValidationError('La contraseña debe tener al menos 8 caracteres.');
  }
}
