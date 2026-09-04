/**
 * Hash de contraseñas con scrypt del módulo `crypto` de Node.
 *
 * scrypt es deliberadamente lento y costoso en memoria, que es justo lo que
 * se quiere contra fuerza bruta. Se usa el nativo para no sumar dependencias
 * y, sobre todo, la comparación es en tiempo constante (`timingSafeEqual`):
 * un `===` filtraría información por el tiempo de respuesta.
 *
 * Formato almacenado: `scrypt$<salt hex>$<hash hex>`.
 */

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PasswordHasher } from '@core/application/ports/password-hasher';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const PREFIX = 'scrypt';

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const derived = await scryptAsync(plain, salt, KEY_LENGTH);
    return `${PREFIX}$${salt.toString('hex')}$${derived.toString('hex')}`;
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [prefix, saltHex, hashHex] = stored.split('$');
    if (prefix !== PREFIX || !saltHex || !hashHex) return false;

    let expected: Buffer;
    try {
      expected = Buffer.from(hashHex, 'hex');
    } catch {
      return false;
    }
    if (expected.length !== KEY_LENGTH) {
      // Hash con formato inesperado (p. ej. el señuelo del login). Se gasta
      // igual el tiempo de derivación para no delatar nada por el reloj.
      await scryptAsync(plain, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
      return false;
    }

    const derived = await scryptAsync(plain, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
    return timingSafeEqual(derived, expected);
  }
}
