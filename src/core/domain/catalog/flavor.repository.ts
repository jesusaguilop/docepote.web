/** Puerto de sabores. Solo lectura: los sabores se administran desde el seed. */

import type { Flavor } from './flavor';
import type { Slug } from '../shared/slug';

export interface FlavorReader {
  findAll(): Promise<Flavor[]>;
  findById(id: string): Promise<Flavor | null>;
  findBySlug(slug: Slug): Promise<Flavor | null>;
  findManyByIds(ids: readonly string[]): Promise<Flavor[]>;
}

export interface FlavorWriter {
  save(flavor: Flavor): Promise<void>;
}

export interface FlavorRepository extends FlavorReader, FlavorWriter {}
