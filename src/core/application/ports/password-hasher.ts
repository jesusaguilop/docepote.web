/**
 * PasswordHasher — puerto de cifrado de contraseñas.
 *
 * Cambiar de scrypt a argon2/bcrypt es sustituir la implementación en el
 * composition root; ni el dominio ni los casos de uso se enteran (DIP).
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
