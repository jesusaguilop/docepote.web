/** Sesión del panel: token opaco con vencimiento, guardado en cookie httpOnly. */

import { ValidationError } from '../shared/errors';

export const SESSION_DURATION_MS = 1000 * 60 * 60 * 12; // 12 horas

export interface SessionProps {
  readonly id: string;
  readonly userId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
}

export class Session {
  readonly id: string;
  readonly userId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;

  private constructor(props: SessionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    Object.freeze(this);
  }

  static issue(id: string, userId: string, now: Date): Session {
    if (!id || !userId) {
      throw new ValidationError('La sesión necesita un identificador y un usuario.');
    }
    return new Session({
      id,
      userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
    });
  }

  static rehydrate(props: SessionProps): Session {
    return new Session(props);
  }

  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }
}
