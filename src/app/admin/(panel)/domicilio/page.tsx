import { container } from '@infra/container';
import { PageHeader } from '@/components/admin/PageHeader';
import { DeliverySettingsForm } from '@/components/admin/DeliverySettingsForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Domicilio' };

export default async function AdminDeliveryPage() {
  // Nunca falla: si la base no responde, devuelve la tarifa del .env.
  const result = await container().ordering.deliverySettings.execute();
  const settings = result.ok ? result.value : null;

  return (
    <>
      <PageHeader
        eyebrow="Pedidos"
        title="Domicilio"
        description="Cuánto se cobra por llevar un pedido en Valledupar y desde qué monto va gratis. El cambio se aplica desde el siguiente pedido; los que ya se hicieron conservan lo que se les cobró."
      />

      {settings ? (
        <DeliverySettingsForm initial={settings} />
      ) : (
        <p className="rounded-md bg-berry/10 px-4 py-3 text-[0.88rem] text-berry" role="alert">
          No pudimos leer la tarifa de domicilio. Recarga en un momento.
        </p>
      )}
    </>
  );
}
