'use client';

/**
 * Gestión del catálogo.
 *
 * Lo que más se usa a diario — ajustar el stock del día y ocultar lo que se
 * acabó — está a un clic en la lista. El formulario completo solo aparece al
 * crear o editar.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  deleteProduct,
  setProductStock,
  toggleProductAvailability,
} from '@/app/actions/admin';
import { useToast } from '@/components/ui/Toast';
import { JarIcon } from '@/components/brand/JarIcon';
import { ProductForm } from './ProductForm';
import { PlusIcon } from './icons';
import { CATEGORY_LABELS } from '@core/domain/catalog/category';
import { cn } from '@/lib/cn';
import type { FlavorDTO, ProductDTO } from '@core/application/dto/product.dto';

export function ProductManager({
  products,
  flavors,
}: {
  products: ProductDTO[];
  flavors: FlavorDTO[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();

  /** `null` = formulario cerrado; `'new'` = creando; un DTO = editando. */
  const [editing, setEditing] = useState<ProductDTO | 'new' | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const publishedCount = products.filter((p) => p.active).length;
  const soldOutCount = products.filter((p) => p.soldOut).length;

  const handleToggle = (product: ProductDTO) => {
    startTransition(async () => {
      const result = await toggleProductAvailability(product.id);
      if (!result.ok) {
        notify(result.error, 'error');
        return;
      }
      notify(result.data.active ? `${product.name} publicado` : `${product.name} oculto`);
      router.refresh();
    });
  };

  const handleStock = (product: ProductDTO, stock: number | null) => {
    startTransition(async () => {
      const result = await setProductStock(product.id, stock);
      if (!result.ok) {
        notify(result.error, 'error');
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = (product: ProductDTO) => {
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      setConfirmingDelete(null);

      if (!result.ok) {
        // Un producto con pedidos históricos no se puede borrar: la relación
        // en la base lo impide para no romper esos pedidos. Se sugiere ocultarlo.
        notify(
          result.code === 'UNEXPECTED'
            ? 'Ese producto ya tiene pedidos, así que no se puede borrar. Ocúltalo en su lugar.'
            : result.error,
          'error',
        );
        return;
      }

      notify(`${product.name} eliminado`);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.88rem] text-ink-soft">
          <b className="font-display text-ink">{products.length}</b> productos ·{' '}
          <b className="font-display text-ink">{publishedCount}</b> publicados
          {soldOutCount > 0 && (
            <>
              {' '}
              · <b className="font-display text-berry">{soldOutCount}</b> agotados
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2.5 font-display text-[0.88rem] font-semibold text-paper transition-colors hover:bg-[#100b06]"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      <ul className="space-y-3">
        {products.map((product) => (
          <motion.li
            key={product.id}
            layout
            className={cn(
              'rounded-lg border bg-white px-4 py-4 transition-shadow hover:shadow-sm',
              product.active
                ? 'border-kraft-line/70'
                : 'border-dashed border-kraft-line/70 bg-paper-2/30',
            )}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-12 w-12 shrink-0 rounded bg-paper-2 p-1">
                <JarIcon fillColor={product.art.fillColor} pattern={product.art.pattern} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-display text-[0.96rem] font-semibold">
                  <span className={cn(!product.active && 'text-ink-soft')}>{product.name}</span>
                  {product.badge && (
                    <span className="rounded-full bg-caramel/15 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-caramel">
                      {product.badge}
                    </span>
                  )}
                  {product.soldOut && (
                    <span className="rounded-full bg-berry/12 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-berry">
                      Agotado
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[0.8rem] text-ink-soft">
                  {CATEGORY_LABELS[product.category]}
                  {product.flavor && (
                    <>
                      <span className="mx-1.5 text-kraft-line">·</span>
                      {product.flavor.emoji} {product.flavor.name}
                    </>
                  )}
                  <span className="mx-1.5 text-kraft-line">·</span>
                  <b className="font-display font-semibold text-ink">{product.priceFormatted}</b>
                  {product.previousPriceFormatted && (
                    <s className="ml-1.5 text-ink-soft/60">{product.previousPriceFormatted}</s>
                  )}
                </p>
              </div>

              <StockControl product={product} onChange={handleStock} disabled={isPending} />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(product)}
                  disabled={isPending}
                  className={cn(
                    'rounded-full border px-3 py-1 font-display text-[0.78rem] font-semibold transition-colors disabled:opacity-50',
                    product.active
                      ? 'border-green-deep/40 text-green-deep hover:bg-green-deep hover:text-white'
                      : 'border-kraft-line text-ink-soft hover:border-ink hover:text-ink',
                  )}
                >
                  {product.active ? 'Publicado' : 'Oculto'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditing(product)}
                  className="rounded-full border border-kraft-line px-3 py-1 font-display text-[0.78rem] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmingDelete(product.id)}
                  className="rounded-full px-2 py-1 text-[0.78rem] text-ink-soft transition-colors hover:text-berry"
                  aria-label={`Eliminar ${product.name}`}
                >
                  ✕
                </button>
              </div>
            </div>

            <AnimatePresence>
              {confirmingDelete === product.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded bg-berry/8 px-4 py-3">
                    <p className="text-[0.86rem] text-berry">
                      ¿Eliminar &ldquo;{product.name}&rdquo;? No se puede deshacer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(null)}
                        className="rounded-full border border-kraft-line px-3 py-1 text-[0.8rem] font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={isPending}
                        className="rounded-full bg-berry px-3 py-1 text-[0.8rem] font-semibold text-white disabled:opacity-50"
                      >
                        Sí, eliminar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </ul>

      <AnimatePresence>
        {editing && (
          // La `key` es obligatoria para AnimatePresence: sin ella no puede
          // distinguir entre "el mismo panel que sigue abierto" y "un panel
          // nuevo", y cualquier re-render del padre reinicia la animación a
          // media transición, dejándola congelada.
          <ProductForm
            key={editing === 'new' ? 'nuevo' : editing.id}
            product={editing === 'new' ? null : editing}
            flavors={flavors}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Ajuste rápido del inventario del día, sin abrir el formulario completo. */
function StockControl({
  product,
  onChange,
  disabled,
}: {
  product: ProductDTO;
  onChange: (product: ProductDTO, stock: number | null) => void;
  disabled: boolean;
}) {
  if (product.stock === null) {
    return (
      <button
        type="button"
        onClick={() => onChange(product, 10)}
        disabled={disabled}
        className="rounded-full bg-paper-2 px-3 py-1 font-display text-[0.78rem] font-semibold text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
        title="Se hace por encargo. Haz clic para empezar a controlar inventario."
      >
        Por encargo
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(product, Math.max(0, product.stock! - 1))}
        disabled={disabled || product.stock === 0}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-2 text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
        aria-label="Quitar una unidad del stock"
      >
        &#8211;
      </button>

      <span
        className={cn(
          'min-w-11 rounded-full px-2 py-1 text-center font-display text-[0.8rem] font-bold tabular-nums',
          product.stock === 0
            ? 'bg-berry/12 text-berry'
            : product.lowStock
              ? 'bg-caramel/15 text-caramel'
              : 'bg-paper-2 text-ink',
        )}
      >
        {product.stock}
      </span>

      <button
        type="button"
        onClick={() => onChange(product, product.stock! + 1)}
        disabled={disabled}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-2 text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
        aria-label="Agregar una unidad al stock"
      >
        +
      </button>
    </div>
  );
}
