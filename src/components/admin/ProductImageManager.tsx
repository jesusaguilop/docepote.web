'use client';

/**
 * Fotos del producto.
 *
 * Las fotos se encogen aquí, en el navegador, antes de subirlas. Una foto de
 * celular llega con 4000 píxeles de ancho y medio megabyte, y en la ficha se
 * ve a 600: subirla entera solo sirve para llenar la base, gastar los datos
 * de la clienta y hacer esperar a quien la sube. Un `<canvas>` la deja en
 * 1400 px y ~80 KB en el tiempo que toma soltar el archivo.
 *
 * Solo aparece con el producto ya guardado: una foto necesita un producto al
 * cual pertenecer, y no existe hasta que se guarda por primera vez.
 */

import { useRef, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  addProductImage,
  deleteProductImage,
  reorderProductImages,
} from '@/app/actions/admin';
import { useToast } from '@/components/ui/Toast';
import { MAX_IMAGES_PER_PRODUCT } from '@core/domain/catalog/product-image';
import type { ProductImageDTO } from '@core/application/dto/product.dto';

/** Lado mayor tras encoger. Cubre la ficha en pantallas grandes con holgura. */
const MAX_SIDE = 1400;
/** Calidad del JPEG de salida: por encima de 0.82 se nota el peso, no la foto. */
const QUALITY = 0.82;

interface Props {
  productId: string;
  productName: string;
  images: readonly ProductImageDTO[];
}

export function ProductImageManager({ productId, productName, images: initial }: Props) {
  const { notify } = useToast();
  const [images, setImages] = useState<readonly ProductImageDTO[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [isShrinking, setShrinking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const lleno = images.length >= MAX_IMAGES_PER_PRODUCT;

  const apply = (
    work: () => Promise<{ ok: boolean; data?: ProductImageDTO[]; error?: string }>,
    exito: string,
  ) => {
    startTransition(async () => {
      const result = await work();
      if (!result.ok || !result.data) {
        notify(result.error ?? 'No se pudo.', 'error');
        return;
      }
      setImages(result.data);
      notify(exito);
    });
  };

  const onPick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const cupo = MAX_IMAGES_PER_PRODUCT - images.length;
    const elegidas = Array.from(files).slice(0, cupo);

    if (elegidas.length < files.length) {
      notify(`Solo caben ${MAX_IMAGES_PER_PRODUCT} fotos; subo las primeras ${cupo}.`, 'error');
    }

    setShrinking(true);
    try {
      for (const file of elegidas) {
        const upload = await shrink(file, productName);
        // Una por una y esperando: subirlas en paralelo hace que el orden de
        // llegada dependa del tamaño de cada archivo, y el orden es justo lo
        // que decide cuál sale en la tarjeta del catálogo.
        const result = await addProductImage(productId, upload);

        if (!result.ok) {
          notify(result.error, 'error');
          break;
        }
        setImages(result.data);
      }
    } catch (error) {
      console.error('[fotos] no se pudo preparar la imagen:', error);
      notify('No pudimos leer esa imagen. ¿Es un JPG, PNG o WebP?', 'error');
    } finally {
      setShrinking(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);

    // Se pinta el nuevo orden de una vez y se confirma contra el servidor
    // después: reordenar es la clase de gesto que se hace tres veces seguidas
    // y esperar a la red en cada una se siente roto.
    setImages(next);
    apply(
      () => reorderProductImages(productId, next.map((image) => image.id)),
      'Orden actualizado.',
    );
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-[0.86rem] font-semibold">Fotos</p>
        <p className="text-[0.76rem] text-ink-soft">
          {images.length} de {MAX_IMAGES_PER_PRODUCT} · la primera es la de la tarjeta
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <AnimatePresence initial={false}>
          {images.map((image, index) => (
            <motion.figure
              key={image.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative aspect-square overflow-hidden rounded-md border border-kraft-line bg-paper-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- la
                  sirve /api/productos/foto ya del tamaño final. */}
              <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />

              {index === 0 && (
                <span className="absolute left-1 top-1 rounded-sm bg-green-deep px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-white">
                  Portada
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-ink/70 px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <span className="flex gap-1">
                  <IconButton
                    label="Mover antes"
                    disabled={index === 0 || isPending}
                    onClick={() => move(index, -1)}
                  >
                    ‹
                  </IconButton>
                  <IconButton
                    label="Mover después"
                    disabled={index === images.length - 1 || isPending}
                    onClick={() => move(index, 1)}
                  >
                    ›
                  </IconButton>
                </span>
                <IconButton
                  label="Quitar foto"
                  disabled={isPending}
                  onClick={() => apply(() => deleteProductImage(image.id), 'Foto quitada.')}
                >
                  ✕
                </IconButton>
              </div>
            </motion.figure>
          ))}
        </AnimatePresence>

        {!lleno && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isShrinking || isPending}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-kraft-line text-ink-soft transition-colors hover:border-green-deep hover:text-green-deep disabled:opacity-60"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="px-1 text-center text-[0.72rem] leading-tight">
              {isShrinking ? 'Preparando...' : 'Agregar'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(event) => void onPick(event.target.files)}
        className="hidden"
      />
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-6 w-6 items-center justify-center rounded-sm text-[0.9rem] leading-none text-paper transition-colors hover:bg-paper/25 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/**
 * Encoge la foto con un canvas y la devuelve en base64.
 *
 * Sale siempre como JPEG: un PNG de fotografía pesa varias veces lo mismo sin
 * ganar nada, y la transparencia no le hace falta a la foto de un pote.
 */
async function shrink(
  file: File,
  productName: string,
): Promise<{ base64: string; mimeType: string; alt: string }> {
  const bitmap = await createImageBitmap(file);

  const escala = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * escala);
  const height = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('El navegador no dio contexto 2D.');

  // Fondo blanco antes de dibujar: si la original es un PNG con
  // transparencia, al pasar a JPEG esas zonas saldrían negras.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);

  return {
    base64: dataUrl.slice(dataUrl.indexOf(',') + 1),
    mimeType: 'image/jpeg',
    alt: `${productName} de Doce pote`,
  };
}
