'use client';

/**
 * Avisos flotantes.
 *
 * Se anuncian con `role="status"` y `aria-live="polite"` para que un lector
 * de pantalla los lea sin interrumpir lo que el usuario esté haciendo.
 *
 * Cuánto duran depende de cuánto hay que leer: un "Agregado al carrito" se va
 * rápido, un error largo se queda lo suficiente para leerlo con calma. Pasar
 * el mouse o el foco encima lo detiene, y todos se pueden cerrar a mano.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/cn';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Más de tres a la vez ya no se leen: se va el más viejo. */
const MAX_VISIBLE = 3;

/** Unos 70 ms por letra, con piso y techo según el tono. */
function durationFor(toast: Toast): number {
  const reading = toast.message.length * 70;
  return toast.tone === 'error'
    ? Math.min(Math.max(reading, 7000), 15000)
    : Math.min(Math.max(reading, 3500), 8000);
}

const TONE_STYLES: Record<ToastTone, string> = {
  success: 'bg-ink text-paper',
  error: 'bg-berry text-white',
  info: 'bg-green-deep text-white',
};

export function ToastProvider({
  children,
  closeLabel = 'Cerrar aviso',
}: {
  children: ReactNode;
  closeLabel?: string;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => {
      // El mismo mensaje dos veces seguidas (doble clic, reintento) no se apila.
      const rest = current.filter((toast) => toast.message !== message);
      return [...rest, { id, message, tone }].slice(-MAX_VISIBLE);
    });
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Arriba en el celular: abajo están la barra de confirmar del checkout
          y el botón del carrito, y el aviso los tapaba. */}
      <div
        className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-4 lg:top-auto lg:bottom-6"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              closeLabel={closeLabel}
              onDismiss={dismiss}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  closeLabel,
  onDismiss,
}: {
  toast: Toast;
  closeLabel: string;
  onDismiss: (id: number) => void;
}) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(durationFor(toast));

  // El reloj corre solo mientras nadie lo está leyendo; al pausar se guarda
  // lo que faltaba para retomarlo donde iba.
  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(remaining.current - (Date.now() - startedAt), 1000);
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex max-w-md items-start gap-3 rounded-md py-3 pl-5 pr-2 text-[0.92rem] font-semibold shadow-lg',
        TONE_STYLES[toast.tone],
      )}
    >
      <p className="min-w-0 flex-1 py-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={closeLabel}
        className="-my-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full opacity-80 transition-opacity hover:bg-white/15 hover:opacity-100 focus-visible:outline-current"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </motion.div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  }
  return context;
}
