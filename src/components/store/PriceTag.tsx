import { cn } from '@/lib/cn';
import type { ProductDTO } from '@core/application/dto/product.dto';

/**
 * Precio de un producto, con su oferta si la tiene.
 *
 * Vive en un componente propio para que la tarjeta, el detalle y el carrito
 * muestren exactamente la misma regla: el precio anterior va tachado y
 * marcado con `<s>`, que es lo que le dice a un lector de pantalla que ese
 * número ya no es válido — un `line-through` puramente visual no lo hace.
 */
export function PriceTag({
  product,
  size = 'md',
  className,
}: {
  product: ProductDTO;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: { price: 'text-[1rem]', before: 'text-[0.76rem]' },
    md: { price: 'text-[1.15rem]', before: 'text-[0.8rem]' },
    lg: { price: 'text-[2rem]', before: 'text-[0.95rem]' },
  }[size];

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-display font-bold tabular-nums', sizes.price)}>
        {product.priceFormatted}
      </span>

      {product.previousPriceFormatted && (
        <s className={cn('tabular-nums text-ink-soft/70', sizes.before)}>
          {product.previousPriceFormatted}
        </s>
      )}
    </div>
  );
}

/** Píldora de descuento. No se pinta si el producto no está en oferta. */
export function DiscountBadge({
  product,
  className,
}: {
  product: ProductDTO;
  className?: string;
}) {
  if (product.discountPercent === null) return null;

  return (
    <span
      className={cn(
        'rounded-full bg-berry px-2 py-0.5 font-display text-[0.68rem] font-bold uppercase tracking-wide text-white',
        className,
      )}
    >
      −{product.discountPercent}%
    </span>
  );
}
