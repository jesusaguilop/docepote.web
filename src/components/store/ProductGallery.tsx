'use client';

/**
 * Galería de la ficha de producto.
 *
 * Con varias fotos funciona como carrusel: una grande y las miniaturas
 * debajo. Con una sola se comporta como una foto y ya — sin flechas ni puntos
 * que no llevan a ninguna parte. Sin ninguna, dibuja el potecito ilustrado,
 * que es como se veía la tienda antes de la sesión de fotos y sigue siendo un
 * respaldo digno.
 *
 * La foto grande se puede ampliar a pantalla completa: es un producto que
 * entra por los ojos, y en el celular la ficha se ve pequeña.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { JarIcon } from '@/components/brand/JarIcon';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/cn';
import type { ProductDTO } from '@core/application/dto/product.dto';

export function ProductGallery({ product }: { product: ProductDTO }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const images = product.images;
  const active = images[current] ?? images[0] ?? null;

  // Escape cierra la vista ampliada, y con ella abierta el fondo no se mueve.
  useEffect(() => {
    if (!zoomed) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false);
      if (event.key === 'ArrowRight') setCurrent((n) => (n + 1) % images.length);
      if (event.key === 'ArrowLeft') setCurrent((n) => (n - 1 + images.length) % images.length);
    };

    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [zoomed, images.length]);

  if (!active) {
    return (
      <div className="relative flex items-center justify-center rounded-md bg-paper-2/70 px-8 py-16">
        <span className="absolute h-56 w-56 rounded-full bg-white/50 blur-3xl" aria-hidden />
        <motion.div
          className="relative h-64 w-64"
          animate={{ y: [0, -12, 0], rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <JarIcon
            fillColor={product.art.fillColor}
            pattern={product.art.pattern}
            label={product.name}
          />
        </motion.div>
      </div>
    );
  }

  const go = (direction: -1 | 1) =>
    setCurrent((n) => (n + direction + images.length) % images.length);

  return (
    <div className="space-y-3">
      <div className="group relative aspect-square overflow-hidden rounded-md bg-paper-2/70">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <Image
              src={active.url}
              alt={active.alt}
              fill
              priority
              sizes="(max-width: 1024px) 92vw, 560px"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="absolute inset-0 cursor-zoom-in focus-visible:outline-offset-[-4px]"
          aria-label={t.producto.ampliarFoto}
        />

        {images.length > 1 && (
          <>
            <FlechaGaleria lado="izquierda" onClick={() => go(-1)} label={t.producto.fotoAnterior} />
            <FlechaGaleria lado="derecha" onClick={() => go(1)} label={t.producto.fotoSiguiente} />

            <span className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((image, index) => (
                <span
                  key={image.id}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    index === current ? 'w-5 bg-ink' : 'w-1.5 bg-ink/35',
                  )}
                />
              ))}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={image.alt}
                aria-current={index === current}
                className={cn(
                  'relative block aspect-square w-full overflow-hidden rounded border-2 transition-colors',
                  index === current ? 'border-green-deep' : 'border-transparent hover:border-kraft-line',
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Vista ampliada ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
            onClick={() => setZoomed(false)}
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
          >
            <button
              type="button"
              onClick={() => setZoomed(false)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-paper/15 text-xl text-paper transition-colors hover:bg-paper/25"
              aria-label={t.carrito.cerrar}
            >
              &#10005;
            </button>

            <motion.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              className="relative h-full max-h-[82vh] w-full max-w-4xl"
              /* El clic dentro no debe cerrar: solo el del fondo. */
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={active.url}
                alt={active.alt}
                fill
                sizes="90vw"
                className="object-contain"
              />

              {images.length > 1 && (
                <>
                  <FlechaGaleria lado="izquierda" onClick={() => go(-1)} label={t.producto.fotoAnterior} claro />
                  <FlechaGaleria lado="derecha" onClick={() => go(1)} label={t.producto.fotoSiguiente} claro />
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FlechaGaleria({
  lado,
  onClick,
  label,
  claro,
}: {
  lado: 'izquierda' | 'derecha';
  onClick: () => void;
  label: string;
  claro?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-xl leading-none shadow-sm transition-colors',
        lado === 'izquierda' ? 'left-2' : 'right-2',
        claro
          ? 'bg-paper/20 text-paper hover:bg-paper/35'
          : 'bg-paper/90 text-ink hover:bg-paper',
      )}
    >
      {lado === 'izquierda' ? '‹' : '›'}
    </button>
  );
}
