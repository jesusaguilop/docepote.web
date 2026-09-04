import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartDrawer } from '@/components/store/CartDrawer';
import { CartProvider } from '@/components/store/cart-context';
import { ToastProvider } from '@/components/ui/Toast';
import { container } from '@infra/container';

/**
 * Layout de la tienda.
 *
 * Los proveedores de carrito y avisos envuelven solo esta rama: el panel de
 * administración no los necesita y no debería cargarlos.
 */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { config } = container();

  return (
    <CartProvider>
      <ToastProvider>
        <div className="flex min-h-dvh flex-col">
          <Header whatsappNumber={config.WHATSAPP_NUMBER} />
          <main className="flex-1">{children}</main>
          <Footer
            whatsappNumber={config.WHATSAPP_NUMBER}
            instagram={config.INSTAGRAM}
          />
        </div>
        <CartDrawer />
      </ToastProvider>
    </CartProvider>
  );
}
