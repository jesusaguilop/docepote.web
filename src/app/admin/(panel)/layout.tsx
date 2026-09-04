import { requireAdmin } from '@/lib/require-admin';
import { Sidebar } from '@/components/admin/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

/**
 * Layout de las páginas protegidas del panel.
 *
 * `requireAdmin()` corre antes de renderizar nada: si no hay sesión válida,
 * redirige al login y el contenido nunca llega al navegador.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col bg-paper-2/40 lg:flex-row">
        <Sidebar adminName={admin.name} adminEmail={admin.email} />
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
