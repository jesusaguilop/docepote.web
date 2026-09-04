'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/** Colores de la marca; nada de arcoíris genérico. */
const COLORS = ['#7c9a34', '#9c6405', '#c7ae85', '#4c6420', '#8c2e2e'];
const PIECES = 34;

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  size: number;
}

/**
 * Lluvia de confeti para la confirmación del pedido.
 *
 * Las posiciones se sortean después del montaje: generarlas durante el
 * render daría un resultado distinto en servidor y cliente, y React marcaría
 * un error de hidratación.
 */
export function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    setPieces(
      Array.from({ length: PIECES }, (_, id) => ({
        id,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.4 + Math.random() * 1.6,
        color: COLORS[id % COLORS.length] ?? COLORS[0]!,
        rotation: Math.random() * 360,
        size: 6 + Math.random() * 6,
      })),
    );
  }, [reduceMotion]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute top-[-5%] rounded-[1px]"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * 1.7,
            backgroundColor: piece.color,
          }}
          initial={{ y: 0, opacity: 1, rotate: piece.rotation }}
          animate={{ y: '105vh', opacity: [1, 1, 0], rotate: piece.rotation + 540 }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
