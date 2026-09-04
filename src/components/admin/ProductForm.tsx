'use client';

import { useState, useTransition } from 'react';
import { motion } from 'motion/react';
import { saveProduct } from '@/app/actions/admin';
import { useToast } from '@/components/ui/Toast';
import { JarIcon } from '@/components/brand/JarIcon';
import { CATEGORIES, CATEGORY_LABELS } from '@core/domain/catalog/category';
import { JAR_PATTERNS, type JarPattern } from '@core/domain/catalog/jar-art';
import { cn } from '@/lib/cn';
import type { FlavorDTO, ProductDTO } from '@core/application/dto/product.dto';

const PATTERN_LABELS: Record<JarPattern, string> = {
  wave: 'Cremoso',
  dots: 'Granulado',
  drop: 'Con gotas',
};

/** Paleta sugerida, tomada de los sabores que ya existen. */
const SUGGESTED_COLORS = [
  '#6b4226',
  '#e8dfc6',
  '#e0a62e',
  '#8c2e2e',
  '#3a2a1e',
  '#d8c7a0',
  '#4a3a2e',
  '#b98f55',
];

/**
 * El DTO solo trae el precio anterior formateado ("$13.600"); para precargar
 * el input hace falta el número. Se recupera quitando todo lo que no sea
 * dígito, que con el formato de COP (sin decimales) es exacto.
 */
function previousPriceAmount(product: ProductDTO): number {
  return Number((product.previousPriceFormatted ?? '').replace(/\D/g, ''));
}

interface ProductFormProps {
  /** `null` para crear uno nuevo. */
  product: ProductDTO | null;
  flavors: FlavorDTO[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductForm({ product, flavors, onClose, onSaved }: ProductFormProps) {
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [previousPrice, setPreviousPrice] = useState(
    product?.previousPriceFormatted ? String(previousPriceAmount(product)) : '',
  );
  const [flavorId, setFlavorId] = useState(product?.flavor?.id ?? '');
  const [sizeOz, setSizeOz] = useState(product?.sizeOz ? String(product.sizeOz) : '');
  const [units, setUnits] = useState(product?.units ? String(product.units) : '');
  const [category, setCategory] = useState(product?.category ?? 'bolo');
  const [badge, setBadge] = useState(product?.badge ?? '');
  const [fillColor, setFillColor] = useState(product?.art.fillColor ?? '#b98f55');
  const [pattern, setPattern] = useState<JarPattern>(product?.art.pattern ?? 'wave');
  const [active, setActive] = useState(product?.active ?? true);
  const [tracksStock, setTracksStock] = useState((product?.stock ?? null) !== null);
  const [stock, setStock] = useState(String(product?.stock ?? 10));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await saveProduct({
        id: product?.id ?? null,
        name,
        description,
        price: Number(price),
        previousPrice: previousPrice.trim() === '' ? null : Number(previousPrice),
        category,
        flavorId: flavorId || null,
        sizeOz: sizeOz.trim() === '' ? null : Number(sizeOz),
        units: units.trim() === '' ? null : Number(units),
        badge: badge.trim() || null,
        fillColor,
        pattern,
        active,
        stock: tracksStock ? Number(stock) : null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      notify(product ? `${result.data.name} actualizado` : `${result.data.name} creado`);
      onSaved();
    });
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[60] bg-ink/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden
      />

      {/* Entra deslizándose desde la derecha, igual que el carrito de la
          tienda. Antes era una hoja inferior en móvil y un panel lateral en
          escritorio, animada con `y: '100%'`: al cambiar el layout entre
          breakpoints, el porcentaje se resolvía contra una altura distinta a
          la esperada y el panel quedaba atascado a medio camino. Un solo
          layout y un desplazamiento horizontal quitan el problema de raíz. */}
      <motion.div
        className="fixed right-0 top-0 z-[70] flex h-dvh w-full max-w-lg flex-col overflow-y-auto bg-paper p-6 shadow-2xl sm:p-8"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        role="dialog"
        aria-modal="true"
        aria-label={product ? 'Editar producto' : 'Nuevo producto'}
      >
        <div className="mb-6 flex items-start justify-between">
          <h2 className="font-display text-xl font-bold">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Vista previa: se ve el pote exactamente como saldrá en la tienda. */}
        <div className="mb-7 flex items-center gap-5 rounded-md border border-kraft-line bg-white px-5 py-4">
          <div className="h-20 w-20 shrink-0">
            <JarIcon fillColor={fillColor} pattern={pattern} />
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold">{name || 'Nombre del producto'}</p>
            <p className="mt-1 line-clamp-2 text-[0.85rem] text-ink-soft">
              {description || 'Descripción corta del sabor.'}
            </p>
            <p className="mt-1.5 flex items-baseline gap-2 font-display font-bold">
              {price ? `$${Number(price).toLocaleString('es-CO')}` : '$0'}
              {previousPrice.trim() !== '' && (
                <s className="text-[0.82rem] font-normal text-ink-soft/70">
                  ${Number(previousPrice).toLocaleString('es-CO')}
                </s>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Nombre" htmlFor="p-name">
            <input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              className={inputClass}
            />
          </Field>

          <Field label="Descripción" htmlFor="p-desc">
            <textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={240}
              className={cn(inputClass, 'resize-none')}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio (COP)" htmlFor="p-price">
              <input
                id="p-price"
                type="number"
                min={1}
                step={100}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Precio anterior (opcional)" htmlFor="p-prev">
              <input
                id="p-prev"
                type="number"
                min={0}
                step={100}
                value={previousPrice}
                onChange={(e) => setPreviousPrice(e.target.value)}
                placeholder="Se muestra tachado"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" htmlFor="p-cat">
              <select
                id="p-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className={inputClass}
              >
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Sabor" htmlFor="p-flavor">
              <select
                id="p-flavor"
                value={flavorId}
                onChange={(e) => setFlavorId(e.target.value)}
                className={inputClass}
              >
                {/* Los combos y kits llevan varios sabores: van sin uno fijo. */}
                <option value="">Varios / no aplica</option>
                {flavors.map((flavor) => (
                  <option key={flavor.id} value={flavor.id}>
                    {flavor.emoji} {flavor.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tamaño en oz (opcional)" htmlFor="p-size">
              <input
                id="p-size"
                type="number"
                min={0}
                step={0.5}
                value={sizeOz}
                onChange={(e) => setSizeOz(e.target.value)}
                placeholder="8"
                className={inputClass}
              />
            </Field>

            <Field label="Unidades que trae (opcional)" htmlFor="p-units">
              <input
                id="p-units"
                type="number"
                min={1}
                step={1}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="3"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Etiqueta (opcional)" htmlFor="p-badge">
            <input
              id="p-badge"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Nuevo, Más pedido, Temporada..."
              maxLength={24}
              className={inputClass}
            />
          </Field>

          <div>
            <p className="mb-2 font-display text-[0.86rem] font-semibold">Color del pote</p>
            <div className="flex flex-wrap items-center gap-2">
              {SUGGESTED_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFillColor(color)}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                    fillColor === color ? 'border-ink' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Usar color ${color}`}
                />
              ))}
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-kraft-line bg-white"
                aria-label="Elegir otro color"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 font-display text-[0.86rem] font-semibold">Textura</p>
            <div className="flex gap-2">
              {JAR_PATTERNS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPattern(value)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 font-display text-[0.82rem] font-semibold transition-colors',
                    pattern === value
                      ? 'border-ink bg-ink text-paper'
                      : 'border-kraft-line text-ink-soft hover:border-ink hover:text-ink',
                  )}
                >
                  {PATTERN_LABELS[value]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-kraft-line bg-white px-4 py-4">
            <Checkbox
              id="p-active"
              checked={active}
              onChange={setActive}
              label="Visible en la tienda"
            />
            <Checkbox
              id="p-track"
              checked={tracksStock}
              onChange={setTracksStock}
              label="Controlar inventario"
              hint="Si lo desactivas, el producto se hace por encargo y nunca se agota."
            />

            {tracksStock && (
              <Field label="Unidades disponibles" htmlFor="p-stock">
                <input
                  id="p-stock"
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className={inputClass}
                />
              </Field>
            )}
          </div>

          {error && (
            <p className="rounded bg-berry/10 px-3 py-2.5 text-[0.86rem] text-berry" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-sm bg-green-deep py-3.5 font-display font-semibold text-white transition-colors hover:bg-green-dark disabled:opacity-60"
            >
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-kraft-line px-6 font-display font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

const inputClass =
  'w-full rounded-md border border-kraft-line bg-white px-4 py-2.5 text-[0.92rem] outline-none transition-colors focus:border-green-deep';

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block font-display text-[0.86rem] font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function Checkbox({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-green-deep"
        />
        <span className="font-display text-[0.88rem] font-semibold">{label}</span>
      </label>
      {hint && <p className="mt-1 pl-7 text-[0.8rem] text-ink-soft">{hint}</p>}
    </div>
  );
}
