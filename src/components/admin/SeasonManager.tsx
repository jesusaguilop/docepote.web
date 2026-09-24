'use client';

/**
 * Apariencia de la tienda.
 *
 * Aquí se arma una campaña —Amor y Amistad, Navidad, lo que venga— con sus
 * colores y su mascota, y se pone con un clic. La idea es que cambiar de
 * vestido no vuelva a ser un commit.
 *
 * La pantalla se pinta con sus propios colores mientras se edita: los doce
 * valores se aplican en vivo a un bloque de vista previa, porque elegir un
 * rosa mirando un cuadrito de 24 píxeles no dice nada de cómo se va a ver un
 * botón encima del papel.
 */

import { useMemo, useRef, useState, useTransition } from 'react';
import { motion } from 'motion/react';
import {
  activateSeason,
  deactivateSeasons,
  deleteSeason,
  saveSeason,
  type MascotUpload,
} from '@/app/actions/branding';
import { useToast } from '@/components/ui/Toast';
import { Palette, PALETTE_KEYS, type PaletteKey, type PaletteProps } from '@core/domain/branding/palette';
import { MAX_MASCOT_BYTES } from '@core/domain/branding/season';
import type { SeasonDTO } from '@core/application/dto/season.dto';
import { cn } from '@/lib/cn';

/** Cómo se llama cada color en cristiano, y qué pinta. */
const ETIQUETAS: Record<PaletteKey, { label: string; hint: string }> = {
  ink: { label: 'Tinta', hint: 'Títulos y texto principal' },
  inkSoft: { label: 'Tinta suave', hint: 'Textos secundarios' },
  accent: { label: 'Acento claro', hint: 'Fondos suaves y detalles' },
  accentDeep: { label: 'Acento principal', hint: 'Botones — lleva texto blanco' },
  accentDark: { label: 'Acento oscuro', hint: 'Los botones al pasar el mouse' },
  kraft: { label: 'Kraft', hint: 'Bloques de papel' },
  kraftDark: { label: 'Kraft oscuro', hint: 'Bordes marcados' },
  kraftLine: { label: 'Líneas', hint: 'Bordes de tarjetas y separadores' },
  caramel: { label: 'Caramelo', hint: 'Avisos de "pendiente" en el panel' },
  paper: { label: 'Papel', hint: 'Fondo de toda la tienda' },
  paper2: { label: 'Papel hundido', hint: 'Fondo de bloques y resúmenes' },
  berry: { label: 'Rojo de error', hint: 'Mensajes de algo salió mal' },
};

/** Paleta de fábrica: el punto de partida de una temporada nueva. */
const COLORES_DE_FABRICA: PaletteProps = {
  ink: '#251a10',
  inkSoft: '#5b4a38',
  accent: '#7c9a34',
  accentDeep: '#4c6420',
  accentDark: '#38480f',
  kraft: '#c7ae85',
  kraftDark: '#8c6f45',
  kraftLine: '#a98c5e',
  caramel: '#9c6405',
  paper: '#f2ecdd',
  paper2: '#eae1cb',
  berry: '#8c2e2e',
};

interface Borrador {
  id?: string;
  name: string;
  colors: PaletteProps;
  /** `undefined` = no se tocó la mascota. */
  mascot?: MascotUpload | null;
  /** Lo que se ve en la vista previa: la subida nueva o la ya guardada. */
  mascotPreview: string | null;
  mascotAlt: string;
}

function borradorDe(season: SeasonDTO): Borrador {
  return {
    id: season.id,
    name: season.name,
    colors: season.colors,
    mascotPreview: season.mascotUrl,
    mascotAlt: season.mascotAlt ?? '',
  };
}

function borradorNuevo(): Borrador {
  return {
    name: '',
    colors: COLORES_DE_FABRICA,
    mascotPreview: null,
    mascotAlt: '',
  };
}

export function SeasonManager({ seasons }: { seasons: SeasonDTO[] }) {
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Borrador | null>(null);

  const activa = seasons.find((season) => season.active) ?? null;

  const run = (
    work: () => Promise<{ ok: boolean; error?: string }>,
    exito: string,
  ) => {
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        notify(result.error ?? 'No se pudo completar.', 'error');
        return;
      }
      notify(exito);
      setDraft(null);
    });
  };

  return (
    <div className="space-y-8">
      {/* ── Qué tiene puesto la tienda ahora ───────────────────────────── */}
      <section className="rounded-md border border-kraft-line bg-white px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-[0.76rem] font-bold uppercase tracking-[0.12em] text-ink-soft">
              Ahora mismo la tienda está
            </p>
            <p className="mt-1 font-display text-[1.25rem] font-bold">
              {activa ? activa.name : 'Con los colores de siempre'}
            </p>
          </div>

          {activa && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(deactivateSeasons, 'La tienda volvió a sus colores de siempre.')}
              className="rounded-sm border border-kraft-line px-4 py-2.5 font-display text-[0.86rem] font-semibold transition-colors hover:border-ink disabled:opacity-60"
            >
              Volver a los de siempre
            </button>
          )}
        </div>
      </section>

      {/* ── Las temporadas guardadas ───────────────────────────────────── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[1.1rem] font-bold">Temporadas</h2>
          <button
            type="button"
            onClick={() => setDraft(borradorNuevo())}
            className="rounded-md bg-ink px-4 py-2.5 font-display text-[0.88rem] font-semibold text-paper transition-colors hover:bg-[#100b06]"
          >
            Crear temporada
          </button>
        </div>

        {seasons.length === 0 ? (
          <p className="rounded-md border border-dashed border-kraft-line px-6 py-10 text-center text-[0.92rem] text-ink-soft">
            Todavía no hay ninguna. Crea una para vestir la tienda en la próxima fecha.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {seasons.map((season) => (
              <li
                key={season.id}
                className={cn(
                  'rounded-md border bg-white p-5 transition-colors',
                  season.active ? 'border-green-deep' : 'border-kraft-line',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-[1rem] font-bold">{season.name}</p>
                    {season.active && (
                      <p className="mt-0.5 text-[0.76rem] font-semibold uppercase tracking-wide text-green-deep">
                        Puesta
                      </p>
                    )}
                  </div>
                  <MuestraDeColores colors={season.colors} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {!season.active && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        run(() => activateSeason(season.id), `La tienda ya está de ${season.name}.`)
                      }
                      className="rounded-sm bg-green-deep px-3.5 py-2 font-display text-[0.82rem] font-semibold text-white transition-colors hover:bg-green-dark disabled:opacity-60"
                    >
                      Poner esta
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDraft(borradorDe(season))}
                    className="rounded-sm border border-kraft-line px-3.5 py-2 font-display text-[0.82rem] font-semibold transition-colors hover:border-ink"
                  >
                    Editar
                  </button>
                  {!season.active && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        run(() => deleteSeason(season.id), `Se borró ${season.name}.`)
                      }
                      className="rounded-sm px-3.5 py-2 font-display text-[0.82rem] font-semibold text-ink-soft transition-colors hover:text-berry disabled:opacity-60"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {draft && (
        <EditorDeTemporada
          draft={draft}
          isPending={isPending}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={() =>
            run(
              () =>
                saveSeason({
                  ...(draft.id ? { id: draft.id } : {}),
                  name: draft.name,
                  colors: draft.colors,
                  ...(draft.mascot === undefined ? {} : { mascot: draft.mascot }),
                }),
              draft.id ? 'Temporada actualizada.' : 'Temporada creada.',
            )
          }
        />
      )}
    </div>
  );
}

/** Los colores de una temporada en miniatura, para reconocerla de un vistazo. */
function MuestraDeColores({ colors }: { colors: PaletteProps }) {
  const muestra: PaletteKey[] = ['paper', 'accent', 'accentDeep', 'ink'];

  return (
    <span className="flex shrink-0 gap-1" aria-hidden>
      {muestra.map((key) => (
        <span
          key={key}
          className="h-6 w-6 rounded-full border border-black/10"
          style={{ backgroundColor: colors[key] }}
        />
      ))}
    </span>
  );
}

function EditorDeTemporada({
  draft,
  isPending,
  onChange,
  onCancel,
  onSave,
}: {
  draft: Borrador;
  isPending: boolean;
  onChange: (next: Borrador) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * El aviso de contraste se calcula aquí, con la misma clase del dominio que
   * va a validar al guardar. Mejor enterarse mientras se elige el color que
   * después de darle a guardar.
   */
  const avisoDeContraste = useMemo(() => {
    const ratio = Palette.contrast(draft.colors.accentDeep, '#ffffff');
    return ratio < 4.5
      ? `Ojo: el texto blanco sobre el acento principal queda en ${ratio.toFixed(1)}:1 y hace falta 4.5:1. Oscurécelo.`
      : null;
  }, [draft.colors.accentDeep]);

  const setColor = (key: PaletteKey, value: string) =>
    onChange({ ...draft, colors: { ...draft.colors, [key]: value } });

  const onPickFile = (file: File | undefined) => {
    if (!file) return;

    if (file.size > MAX_MASCOT_BYTES) {
      notify(
        `La imagen pesa ${Math.round(file.size / 1024)} KB y el tope son ${Math.round(MAX_MASCOT_BYTES / 1024)} KB.`,
        'error',
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      // "data:image/png;base64,AAAA…" → solo la parte de después de la coma,
      // que es lo que el servidor sabe decodificar.
      const base64 = result.slice(result.indexOf(',') + 1);

      onChange({
        ...draft,
        mascot: { base64, mimeType: file.type, alt: draft.mascotAlt },
        mascotPreview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border border-kraft-line bg-white"
    >
      <h2 className="border-b border-kraft-line/60 px-6 py-4 font-display text-[1.05rem] font-bold">
        {draft.id ? `Editar ${draft.name || 'temporada'}` : 'Nueva temporada'}
      </h2>

      <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="season-name"
              className="mb-1.5 block font-display text-[0.86rem] font-semibold"
            >
              Nombre
            </label>
            <input
              id="season-name"
              value={draft.name}
              onChange={(event) => onChange({ ...draft, name: event.target.value })}
              placeholder="Amor y Amistad"
              className="w-full rounded-md border border-kraft-line bg-white px-4 py-3 text-[0.94rem] outline-none transition-colors focus:border-green-deep"
            />
          </div>

          {/* ── Colores ──────────────────────────────────────────────── */}
          <fieldset>
            <legend className="font-display text-[0.86rem] font-semibold">Colores</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {PALETTE_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-3 rounded-md border border-kraft-line/70 px-3 py-2.5">
                  <input
                    type="color"
                    value={draft.colors[key]}
                    onChange={(event) => setColor(key, event.target.value)}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded border border-kraft-line bg-white"
                    aria-label={ETIQUETAS[key].label}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[0.84rem] font-semibold">
                      {ETIQUETAS[key].label}
                    </span>
                    <span className="block text-[0.74rem] leading-snug text-ink-soft">
                      {ETIQUETAS[key].hint}
                    </span>
                  </span>
                  {/* El hexadecimal escrito a mano: pegar un color de la
                      identidad de marca es más rápido que cazarlo en la rueda. */}
                  <input
                    value={draft.colors[key]}
                    onChange={(event) => setColor(key, event.target.value)}
                    spellCheck={false}
                    className="w-[5.5rem] shrink-0 rounded border border-kraft-line px-2 py-1 text-[0.76rem] outline-none focus:border-green-deep"
                    aria-label={`${ETIQUETAS[key].label} en hexadecimal`}
                  />
                </label>
              ))}
            </div>

            {avisoDeContraste && (
              <p className="mt-3 rounded bg-berry/10 px-3 py-2.5 text-[0.84rem] text-berry" role="alert">
                {avisoDeContraste}
              </p>
            )}
          </fieldset>

          {/* ── Mascota ──────────────────────────────────────────────── */}
          <fieldset>
            <legend className="font-display text-[0.86rem] font-semibold">
              Mascota del inicio
            </legend>
            <p className="mt-1 text-[0.82rem] text-ink-soft">
              PNG, JPG o WebP, hasta {Math.round(MAX_MASCOT_BYTES / 1024)} KB. Si no subes
              ninguna, se usa el gato de siempre.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => onPickFile(event.target.files?.[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-sm border border-kraft-line px-4 py-2.5 font-display text-[0.86rem] font-semibold transition-colors hover:border-ink"
              >
                Elegir imagen
              </button>

              {draft.mascotPreview && (
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...draft, mascot: null, mascotPreview: null, mascotAlt: '' })
                  }
                  className="font-display text-[0.84rem] font-semibold text-ink-soft underline-offset-2 transition-colors hover:text-berry hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>

            {draft.mascotPreview && (
              <div className="mt-4">
                <label
                  htmlFor="mascot-alt"
                  className="mb-1.5 block font-display text-[0.84rem] font-semibold"
                >
                  Descripción de la imagen
                </label>
                <input
                  id="mascot-alt"
                  value={draft.mascotAlt}
                  onChange={(event) => {
                    const mascotAlt = event.target.value;
                    onChange({
                      ...draft,
                      mascotAlt,
                      // La descripción viaja dentro de la mascota, así que
                      // editarla tiene que actualizar también lo que se manda.
                      ...(draft.mascot ? { mascot: { ...draft.mascot, alt: mascotAlt } } : {}),
                    });
                  }}
                  placeholder="El gato de Doce pote abrazando un brownie de corazones"
                  className="w-full rounded-md border border-kraft-line bg-white px-4 py-3 text-[0.9rem] outline-none transition-colors focus:border-green-deep"
                />
              </div>
            )}
          </fieldset>
        </div>

        {/* ── Vista previa ───────────────────────────────────────────── */}
        <VistaPrevia draft={draft} />
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-kraft-line/60 px-6 py-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-kraft-line px-5 py-2.5 font-display text-[0.88rem] font-semibold transition-colors hover:border-ink"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onSave}
          className="rounded-sm bg-ink px-5 py-2.5 font-display text-[0.88rem] font-semibold text-paper transition-colors hover:bg-[#100b06] disabled:opacity-60"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </motion.section>
  );
}

/**
 * Un pedacito de tienda con los colores del borrador.
 *
 * Es deliberadamente una miniatura de lo real —papel, tarjeta, borde, botón,
 * texto secundario— y no una fila de cuadritos: lo que hay que juzgar es si
 * el botón se lee sobre el papel, no si el rosa es bonito aislado.
 */
function VistaPrevia({ draft }: { draft: Borrador }) {
  const c = draft.colors;

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <p className="mb-2 font-display text-[0.76rem] font-bold uppercase tracking-[0.12em] text-ink-soft">
        Así se va a ver
      </p>

      <div
        className="overflow-hidden rounded-md border"
        style={{ backgroundColor: c.paper, borderColor: c.kraftLine }}
      >
        <div className="px-5 py-5" style={{ backgroundColor: c.accentDeep }}>
          <p className="font-display text-[1.05rem] font-bold text-white">
            Un pedacito de Brasil
          </p>
          <p className="mt-1 text-[0.82rem] text-white/85">en cada bocado.</p>
        </div>

        {draft.mascotPreview && (
          <div className="flex justify-center px-5 pt-5" style={{ backgroundColor: c.paper2 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- es un
                data: URL recién elegido en el navegador; next/image no lo sirve. */}
            <img
              src={draft.mascotPreview}
              alt=""
              className="h-28 w-auto object-contain"
            />
          </div>
        )}

        <div className="space-y-3 px-5 py-5">
          <div
            className="rounded-md border p-4"
            style={{ backgroundColor: '#ffffff', borderColor: c.kraftLine }}
          >
            <p className="font-display text-[0.94rem] font-bold" style={{ color: c.ink }}>
              Bolo no pote Chocolatudo
            </p>
            <p className="mt-1 text-[0.8rem]" style={{ color: c.inkSoft }}>
              Bizcocho de chocolate con brigadeiro.
            </p>
            <p className="mt-3 font-display text-[1.1rem] font-bold" style={{ color: c.ink }}>
              $13.000
            </p>
          </div>

          <button
            type="button"
            tabIndex={-1}
            className="w-full rounded-sm py-3 font-display text-[0.9rem] font-semibold text-white"
            style={{ backgroundColor: c.accentDeep }}
          >
            Confirmar pedido
          </button>

          <p className="text-center text-[0.78rem]" style={{ color: c.inkSoft }}>
            El domicilio se calcula en el siguiente paso.
          </p>

          <p
            className="rounded px-3 py-2 text-[0.78rem]"
            style={{ backgroundColor: `${c.berry}1a`, color: c.berry }}
          >
            Así se ven los errores.
          </p>
        </div>
      </div>
    </aside>
  );
}
