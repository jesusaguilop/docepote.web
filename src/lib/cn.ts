/**
 * Une clases condicionales.
 *
 * Deliberadamente mínimo: sin `tailwind-merge`, porque en este proyecto los
 * componentes no reciben clases que peleen con las suyas. Si eso cambia,
 * este es el único archivo a tocar.
 */
export type ClassValue = string | number | null | false | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
