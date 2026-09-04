/** Generador de identificadores. Inyectado para poder hacerlo determinista en tests. */
export interface IdGenerator {
  generate(): string;
}
