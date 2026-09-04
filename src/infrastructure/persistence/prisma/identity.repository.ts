/** Usuarios y sesiones del panel, sobre Prisma. */

import type {
  AdminUserRepository,
  SessionRepository,
} from '@core/domain/identity/identity.repository';
import type { AdminUser } from '@core/domain/identity/admin-user';
import type { Session } from '@core/domain/identity/session';
import { db } from './client';
import { toAdminUserEntity, toSessionEntity } from './mappers';

export class PrismaAdminUserRepository implements AdminUserRepository {
  async findByEmail(email: string): Promise<AdminUser | null> {
    const row = await db().adminUser.findUnique({ where: { email: email.toLowerCase() } });
    return row ? toAdminUserEntity(row) : null;
  }

  async findById(id: string): Promise<AdminUser | null> {
    const row = await db().adminUser.findUnique({ where: { id } });
    return row ? toAdminUserEntity(row) : null;
  }

  async save(user: AdminUser): Promise<void> {
    const data = {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
    };
    await db().adminUser.upsert({ where: { id: user.id }, create: data, update: data });
  }
}

export class PrismaSessionRepository implements SessionRepository {
  async findById(id: string): Promise<Session | null> {
    const row = await db().session.findUnique({ where: { id } });
    return row ? toSessionEntity(row) : null;
  }

  async save(session: Session): Promise<void> {
    await db().session.create({
      data: { id: session.id, userId: session.userId, expiresAt: session.expiresAt },
    });
  }

  async delete(id: string): Promise<void> {
    // `deleteMany` no falla si la sesión ya no existe (cerrar sesión dos veces).
    await db().session.deleteMany({ where: { id } });
  }

  async deleteExpired(now: Date): Promise<void> {
    await db().session.deleteMany({ where: { expiresAt: { lte: now } } });
  }
}
