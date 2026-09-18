/** Implementación de temporadas sobre Prisma. */

import type { Season as SeasonRow } from '@prisma/client';
import { Season, parseMascotMimeType } from '@core/domain/branding/season';
import { Palette } from '@core/domain/branding/palette';
import type { SeasonRepository } from '@core/domain/branding/season.repository';
import { db } from './client';

export class PrismaSeasonRepository implements SeasonRepository {
  async findAll(): Promise<Season[]> {
    const rows = await db().season.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return rows.map(toSeasonEntity);
  }

  async findById(id: string): Promise<Season | null> {
    const row = await db().season.findUnique({ where: { id } });
    return row ? toSeasonEntity(row) : null;
  }

  async findActive(): Promise<Season | null> {
    // `findFirst` y no `findUnique`: la unicidad de la activa la sostiene el
    // caso de uso, no un índice, así que la base podría devolver varias si
    // algo fuera mal. Quedarse con una es mejor que reventar la portada.
    const row = await db().season.findFirst({ where: { active: true } });
    return row ? toSeasonEntity(row) : null;
  }

  async save(season: Season): Promise<void> {
    const data = toSeasonRow(season);
    await db().season.upsert({ where: { id: season.id }, create: data, update: data });
  }

  async delete(id: string): Promise<void> {
    await db().season.delete({ where: { id } });
  }

  async deactivateAllExcept(id: string): Promise<void> {
    await db().season.updateMany({
      where: { id: { not: id }, active: true },
      data: { active: false },
    });
  }
}

function toSeasonEntity(row: SeasonRow): Season {
  return Season.of({
    id: row.id,
    name: row.name,
    active: row.active,
    palette: Palette.of({
      ink: row.ink,
      inkSoft: row.inkSoft,
      accent: row.accent,
      accentDeep: row.accentDeep,
      accentDark: row.accentDark,
      kraft: row.kraft,
      kraftDark: row.kraftDark,
      kraftLine: row.kraftLine,
      caramel: row.caramel,
      paper: row.paper,
      paper2: row.paper2,
      berry: row.berry,
    }),
    // Las tres columnas de la mascota viajan juntas o no viaja ninguna: una
    // imagen sin su tipo MIME no se puede servir.
    mascot:
      row.mascotImage && row.mascotMimeType
        ? {
            image: Uint8Array.from(row.mascotImage),
            mimeType: parseMascotMimeType(row.mascotMimeType),
            alt: row.mascotAlt ?? '',
          }
        : null,
    updatedAt: row.updatedAt,
  });
}

function toSeasonRow(season: Season) {
  const colors = season.palette.toObject();

  return {
    id: season.id,
    name: season.name,
    active: season.active,
    ...colors,
    mascotImage: season.mascot ? Buffer.from(season.mascot.image) : null,
    mascotMimeType: season.mascot?.mimeType ?? null,
    mascotAlt: season.mascot?.alt ?? null,
  };
}
