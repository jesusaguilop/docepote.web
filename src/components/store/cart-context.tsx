'use client';

/**
 * Estado del carrito en el navegador.
 *
 * Reutiliza la entidad `Cart` del dominio — la misma clase que valida el
 * pedido en el servidor. No hay dos implementaciones del carrito que se
 * puedan desincronizar: hay una, y esto es una capa fina de React encima.
 *
 * Se persiste en localStorage, pero solo `{productId, quantity}`. Los precios
 * jamás salen de aquí: los pone el servidor al valorar el carrito y al crear
 * el pedido.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Cart, type CartItem } from '@core/domain/ordering/cart';

const STORAGE_KEY = 'docepote.cart.v1';

interface CartContextValue {
  cart: Cart;
  /** `false` hasta leer localStorage; evita parpadeos y desajustes de hidratación. */
  ready: boolean;
  items: CartItem[];
  totalItems: number;
  add: (productId: string, amount?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): Cart {
  if (typeof window === 'undefined') return Cart.empty();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return Cart.empty();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? Cart.fromItems(parsed as CartItem[]) : Cart.empty();
  } catch {
    // localStorage corrupto o bloqueado (modo privado): se arranca vacío en
    // lugar de romper toda la tienda.
    return Cart.empty();
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(Cart.empty);
  const [ready, setReady] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // El carrito se lee después del montaje: en el servidor no existe
  // localStorage, y renderizarlo distinto rompería la hidratación.
  useEffect(() => {
    setCart(readStoredCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.toItems()));
    } catch {
      // Sin espacio o con almacenamiento bloqueado: el carrito sigue vivo en
      // memoria durante la sesión.
    }
  }, [cart, ready]);

  // Si el cliente tiene dos pestañas abiertas, ambas ven el mismo carrito.
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setCart(readStoredCart());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const add = useCallback((productId: string, amount = 1) => {
    setCart((current) => current.add(productId, amount));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setCart((current) => current.setQuantity(productId, quantity));
  }, []);

  const remove = useCallback((productId: string) => {
    setCart((current) => current.remove(productId));
  }, []);

  const clear = useCallback(() => setCart(Cart.empty()), []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      ready,
      items: cart.toItems(),
      totalItems: cart.totalItems,
      add,
      setQuantity,
      remove,
      clear,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [cart, ready, isDrawerOpen, add, setQuantity, remove, clear, openDrawer, closeDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de <CartProvider>.');
  }
  return context;
}
