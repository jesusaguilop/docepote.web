/** Autenticación del panel: iniciar sesión, validarla y cerrarla. */

import type {
  AdminUserRepository,
  SessionRepository,
} from '@core/domain/identity/identity.repository';
import { Session } from '@core/domain/identity/session';
import { UnauthorizedError, type DomainError } from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';
import type { Clock } from '../ports/clock';
import type { IdGenerator } from '../ports/id-generator';
import type { PasswordHasher } from '../ports/password-hasher';

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface LoginOutput {
  readonly sessionId: string;
  readonly expiresAt: Date;
  readonly user: { readonly id: string; readonly name: string; readonly email: string };
}

export class LoginUseCase {
  constructor(
    private readonly users: AdminUserRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: LoginInput): Promise<Result<LoginOutput, DomainError>> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    // Mismo mensaje para "no existe" y "clave incorrecta": no le regalamos a un
    // atacante la información de qué correos están registrados.
    const invalid = new UnauthorizedError('Correo o contraseña incorrectos.');
    if (!user) {
      // Se verifica igual contra un hash falso para que el tiempo de respuesta
      // no delate si el usuario existía.
      await this.hasher.verify(input.password, 'scrypt$0$0');
      return Err(invalid);
    }

    const matches = await this.hasher.verify(input.password, user.passwordHash);
    if (!matches) return Err(invalid);

    const now = this.clock.now();
    const session = Session.issue(this.ids.generate(), user.id, now);
    await this.sessions.save(session);
    await this.sessions.deleteExpired(now);

    return Ok({
      sessionId: session.id,
      expiresAt: session.expiresAt,
      user: { id: user.id, name: user.name, email: user.email },
    });
  }
}

export interface AuthenticatedAdmin {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

/** Resuelve la cookie de sesión al usuario que hay detrás. */
export class AuthenticateSessionUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly users: AdminUserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(sessionId: string | undefined): Promise<Result<AuthenticatedAdmin, DomainError>> {
    if (!sessionId) return Err(new UnauthorizedError('Inicia sesión para entrar al panel.'));

    const session = await this.sessions.findById(sessionId);
    if (!session) return Err(new UnauthorizedError('Tu sesión ya no es válida.'));

    if (session.isExpired(this.clock.now())) {
      await this.sessions.delete(session.id);
      return Err(new UnauthorizedError('Tu sesión expiró. Vuelve a iniciar sesión.'));
    }

    const user = await this.users.findById(session.userId);
    if (!user) return Err(new UnauthorizedError('Tu sesión ya no es válida.'));

    return Ok({ id: user.id, name: user.name, email: user.email });
  }
}

export class LogoutUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(sessionId: string | undefined): Promise<Result<null, DomainError>> {
    if (sessionId) await this.sessions.delete(sessionId);
    return Ok(null);
  }
}
