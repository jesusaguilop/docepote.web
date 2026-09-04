/** Puertos de identidad. */

import type { AdminUser } from './admin-user';
import type { Session } from './session';

export interface AdminUserRepository {
  findByEmail(email: string): Promise<AdminUser | null>;
  findById(id: string): Promise<AdminUser | null>;
  save(user: AdminUser): Promise<void>;
}

export interface SessionRepository {
  findById(id: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  delete(id: string): Promise<void>;
  /** Higiene: borra sesiones vencidas. */
  deleteExpired(now: Date): Promise<void>;
}
