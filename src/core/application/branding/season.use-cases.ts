/**
 * Casos de uso de temporadas.
 *
 * Son cinco operaciones pequeñas alrededor de la misma entidad, así que
 * viven juntas: separarlas en cinco archivos de veinte líneas no aclara
 * nada. La única con enjundia es `ActivateSeasonUseCase`, que es la dueña de
 * la invariante "solo una activa".
 */

import { Palette, type PaletteProps } from '@core/domain/branding/palette';
import { Season, type Mascot } from '@core/domain/branding/season';
import type { SeasonRepository } from '@core/domain/branding/season.repository';
import type { TransactionRunner } from '../ports/transaction-runner';
import type { IdGenerator } from '../ports/id-generator';
import { ConflictError, NotFoundError, isDomainError, type DomainError } from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';
import { toSeasonDTO, type SeasonDTO } from '../dto/season.dto';

/** Ejecuta el trabajo traduciendo los errores del dominio a `Result`. */
async function attempt<T>(work: () => Promise<T>): Promise<Result<T, DomainError>> {
  try {
    return Ok(await work());
  } catch (error) {
    if (isDomainError(error)) return Err(error);
    throw error;
  }
}

// ── Lectura ────────────────────────────────────────────────────────────

/**
 * La temporada que viste la tienda ahora.
 *
 * Devuelve `null` en vez de error cuando no hay ninguna: no tener campaña
 * activa es lo normal once meses al año, no una falla. La tienda se queda
 * entonces con la paleta de fábrica de globals.css.
 */
export class GetActiveSeasonUseCase {
  constructor(private readonly seasons: SeasonRepository) {}

  async execute(): Promise<Result<SeasonDTO | null, DomainError>> {
    return attempt(async () => {
      const season = await this.seasons.findActive();
      return season ? toSeasonDTO(season) : null;
    });
  }
}

export class ListSeasonsUseCase {
  constructor(private readonly seasons: SeasonRepository) {}

  async execute(): Promise<Result<SeasonDTO[], DomainError>> {
    return attempt(async () => {
      const seasons = await this.seasons.findAll();
      return seasons.map(toSeasonDTO);
    });
  }
}

// ── Escritura ──────────────────────────────────────────────────────────

export interface SaveSeasonInput {
  /** `undefined` crea una temporada nueva. */
  readonly id?: string;
  readonly name: string;
  readonly colors: PaletteProps;
  /**
   * Qué hacer con la mascota:
   *   - `undefined` → dejarla como está (el caso normal: solo se tocó un color)
   *   - `null`      → quitarla y volver a la imagen de siempre
   *   - un `Mascot` → reemplazarla
   */
  readonly mascot?: Mascot | null;
}

export class SaveSeasonUseCase {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: SaveSeasonInput): Promise<Result<SeasonDTO, DomainError>> {
    return attempt(async () => {
      const existing = input.id ? await this.seasons.findById(input.id) : null;

      if (input.id && !existing) throw new NotFoundError('la temporada', input.id);

      const season = existing
        ? existing
            .withName(input.name)
            .withPalette(Palette.of(input.colors))
            // `undefined` significa "no se tocó", y por eso no se puede usar
            // `?? null`: convertiría "déjala igual" en "bórrala".
            .withMascot(input.mascot === undefined ? existing.mascot : input.mascot)
        : Season.create({
            id: this.ids.generate(),
            name: input.name,
            colors: input.colors,
            mascot: input.mascot ?? null,
          });

      await this.seasons.save(season);
      return toSeasonDTO(season);
    });
  }
}

/**
 * Pone una temporada a vestir la tienda y apaga la anterior.
 *
 * Las dos escrituras van en una transacción: si se apagara la vieja y
 * fallara el encendido de la nueva, la tienda quedaría sin temporada y el
 * negocio vería su campaña desaparecer sin haber tocado nada.
 */
export class ActivateSeasonUseCase {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly transactions: TransactionRunner,
  ) {}

  async execute(id: string): Promise<Result<SeasonDTO, DomainError>> {
    return attempt(async () => {
      const season = await this.seasons.findById(id);
      if (!season) throw new NotFoundError('la temporada', id);

      const activated = season.activated();

      await this.transactions.run(async () => {
        await this.seasons.save(activated);
        await this.seasons.deactivateAllExcept(activated.id);
      });

      return toSeasonDTO(activated);
    });
  }
}

/** Devuelve la tienda a la paleta de fábrica sin borrar nada. */
export class DeactivateSeasonsUseCase {
  constructor(private readonly seasons: SeasonRepository) {}

  async execute(): Promise<Result<null, DomainError>> {
    return attempt(async () => {
      const active = await this.seasons.findActive();
      if (active) await this.seasons.save(active.deactivated());
      return null;
    });
  }
}

export class DeleteSeasonUseCase {
  constructor(private readonly seasons: SeasonRepository) {}

  async execute(id: string): Promise<Result<{ id: string }, DomainError>> {
    return attempt(async () => {
      const season = await this.seasons.findById(id);
      if (!season) throw new NotFoundError('la temporada', id);

      // Borrar la que está puesta dejaría la tienda cambiando de color sin
      // que nadie lo haya pedido. Primero se desactiva a conciencia.
      if (season.active) {
        throw new ConflictError(
          'Esta temporada es la que está puesta. Desactívala primero y luego bórrala.',
          { campo: 'active' },
        );
      }

      await this.seasons.delete(id);
      return { id };
    });
  }
}
