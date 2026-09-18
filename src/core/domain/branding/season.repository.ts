/** Puerto de temporadas. */

import type { Season } from './season';

export interface SeasonReader {
  findAll(): Promise<Season[]>;
  findById(id: string): Promise<Season | null>;
  /** La que viste la tienda ahora mismo. `null` = paleta de fábrica. */
  findActive(): Promise<Season | null>;
}

export interface SeasonWriter {
  save(season: Season): Promise<void>;
  delete(id: string): Promise<void>;
  /** Apaga todas menos la indicada. Va dentro de una transacción. */
  deactivateAllExcept(id: string): Promise<void>;
}

export interface SeasonRepository extends SeasonReader, SeasonWriter {}
