'use client';

/**
 * Grilla del catálogo con filtro por categoría.
 *
 * El filtrado es en cliente y sobre datos ya cargados: son ocho productos, no
 * un catálogo de miles. Ir al servidor por cada pestaña sería más lento y
 * mucho menos fluido — y la animación de reacomodo se perdería.
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ProductCard } from './ProductCard';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  CATEGORY_SHORT_LABELS,
  type Category,
} from '@core/domain/catalog/category';
import type { ProductDTO } from '@core/application/dto/product.dto';
import { cn } from '@/lib/cn';

type Filter = Category | 'todos';

interface CatalogGridProps {
  products: readonly ProductDTO[];
  /** Muestra el buscador. Se usa en /catalogo, no en la portada. */
  searchable?: boolean;
}

export function CatalogGrid({ products, searchable = false }: CatalogGridProps) {
  const [filter, setFilter] = useState<Filter>('todos');
  const [search, setSearch] = useState('');

  // Solo se ofrecen pestañas de categorías que hoy tienen productos, en el
  // orden que definió la marca (individual → mini → combos → eventos).
  const availableCategories = useMemo(
    () =>
      CATEGORIES.filter((category) => products.some((p) => p.category === category)).sort(
        (a, b) => CATEGORY_ORDER[a] - CATEGORY_ORDER[b],
      ),
    [products],
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = filter === 'todos' || product.category === filter;
      const matchesSearch =
        needle.length === 0 ||
        product.name.toLowerCase().includes(needle) ||
        product.description.toLowerCase().includes(needle) ||
        (product.flavor?.name.toLowerCase().includes(needle) ?? false);
      return matchesCategory && matchesSearch;
    });
  }, [products, filter, search]);

  const tabs: { value: Filter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    ...availableCategories.map((category) => ({
      value: category as Filter,
      label: CATEGORY_SHORT_LABELS[category],
    })),
  ];

  return (
    <div>
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div
          className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          role="tablist"
          aria-label="Filtrar por categoría"
        >
          {tabs.map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'relative shrink-0 rounded-full px-4 py-2 font-display text-[0.88rem] font-semibold transition-colors duration-200',
                  active ? 'text-paper' : 'text-ink-soft hover:text-ink',
                )}
              >
                {/* La píldora se desliza entre pestañas con layoutId. */}
                {active && (
                  <motion.span
                    layoutId="catalog-tab-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {searchable && (
          <div className="relative md:w-72">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar un sabor..."
              aria-label="Buscar en el catálogo"
              className="w-full rounded-full border border-kraft-line bg-white py-2.5 pl-11 pr-4 text-[0.9rem] outline-none transition-colors placeholder:text-ink-soft/60 focus:border-green-deep"
            />
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="9" cy="9" r="6" />
              <path d="m14 14 4 4" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {visible.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center font-script text-3xl text-ink-soft"
        >
          Nada por aquí todavía...
        </motion.p>
      )}
    </div>
  );
}
