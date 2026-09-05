import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartDrawer } from '@/components/store/CartDrawer';
import { CartProvider } from '@/components/store/cart-context';
import { ToastProvider } from '@/components/ui/Toast';
import { TranslationProvider } from '@/lib/i18n/context';
import { getTranslations } from '@/lib/i18n/server';
import { container } from '@infra/container';

/**
 * Layout de la tienda.
 *
 * Los proveedores de carrito, avisos y traducción envuelven solo esta rama:
 * el panel de administración no los necesita y no debería cargarlos.
 *
 * El diccionario se resuelve aquí, en el servidor, y baja una sola vez: así
 * el navegador no descarga los dos idiomas ni espera a hidratarse para
 * mostrar el texto correcto.
 */
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { config } = container();
  const { locale, t } = await getTranslations();

  return (
    <TranslationProvider dictionary={t} locale={locale}>
      <CartProvider>
        <ToastProvider>
          <div className="flex min-h-dvh flex-col">
            <Header whatsappNumber={config.WHATSAPP_NUMBER} />
            <main className="flex-1">{children}</main>
            <Footer
              whatsappNumber={config.WHATSAPP_NUMBER}
              instagram={config.INSTAGRAM}
              locale={locale}
            />
          </div>
          <CartDrawer />
        </ToastProvider>
      </CartProvider>
    </TranslationProvider>
  );
}
