import type { ReactNode } from 'react';

/**
 * Encabezado común de las páginas del panel.
 *
 * Existe para que las tres pantallas tengan exactamente el mismo ritmo
 * vertical y la misma jerarquía tipográfica: cuando cada página inventa su
 * propio encabezado, el panel se siente cosido a retazos.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-kraft-line/60 pb-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 font-display text-[0.76rem] font-bold uppercase tracking-[0.12em] text-green-deep">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[1.65rem] font-bold leading-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-[62ch] text-[0.92rem] leading-relaxed text-ink-soft">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}
