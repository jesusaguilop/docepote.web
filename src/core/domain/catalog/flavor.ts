/**
 * Flavor — un sabor de la casa.
 *
 * Es una entidad aparte y no un campo del producto porque el mismo sabor vive
 * en varios productos: Chocolatudo existe como pote individual y como mini, y
 * el kit de eventos los lleva todos. Si la descripción del sabor estuviera
 * copiada dentro de cada producto, corregir una receta obligaría a editarla en
 * cinco sitios y tarde o temprano quedarían distintas.
 */

import { ValidationError } from '../shared/errors';
import { Slug } from '../shared/slug';

export interface FlavorProps {
  readonly id: string;
  readonly slug: Slug;
  readonly name: string;
  /** Emoji con el que la marca identifica el sabor en redes: 🍫, 💚, 🖤… */
  readonly emoji: string;
  /** Una línea, la que se muestra en la tarjeta. */
  readonly summary: string;
  /** Qué lleva por dentro, capa por capa. `null` si aún no está documentado. */
  readonly composition: string | null;
  readonly position: number;
}

const MAX_SUMMARY_LENGTH = 200;
const MAX_COMPOSITION_LENGTH = 500;

export class Flavor {
  readonly id: string;
  readonly slug: Slug;
  readonly name: string;
  readonly emoji: string;
  readonly summary: string;
  readonly composition: string | null;
  readonly position: number;

  private constructor(props: FlavorProps) {
    this.id = props.id;
    this.slug = props.slug;
    this.name = props.name;
    this.emoji = props.emoji;
    this.summary = props.summary;
    this.composition = props.composition;
    this.position = props.position;
    Object.freeze(this);
  }

  static create(props: FlavorProps): Flavor {
    const name = props.name.trim();
    if (name.length < 2) {
      throw new ValidationError('El nombre del sabor debe tener al menos 2 caracteres.');
    }

    const summary = props.summary.trim();
    if (summary.length > MAX_SUMMARY_LENGTH) {
      throw new ValidationError(`El resumen no puede superar ${MAX_SUMMARY_LENGTH} caracteres.`);
    }

    const composition = props.composition?.trim() || null;
    if (composition && composition.length > MAX_COMPOSITION_LENGTH) {
      throw new ValidationError(
        `La composición no puede superar ${MAX_COMPOSITION_LENGTH} caracteres.`,
      );
    }

    return new Flavor({ ...props, name, summary, composition });
  }

  static rehydrate(props: FlavorProps): Flavor {
    return new Flavor(props);
  }

  /** "🍫 Chocolatudo" — para listados compactos. */
  get displayName(): string {
    return this.emoji ? `${this.emoji} ${this.name}` : this.name;
  }
}
