import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/store/CheckoutForm';
import { getTranslations } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Finalizar pedido',
  description: 'Confirma tu pedido de Doce pote.',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const { t } = await getTranslations();

  return (
    <div className="wrap py-14">
      <header className="mb-12">
        <p className="font-display text-[0.86rem] font-semibold uppercase tracking-wider text-green-deep">
          {t.checkout.eyebrow}
        </p>
        <h1 className="mt-2 text-[clamp(1.9rem,3.4vw,2.6rem)] font-bold">{t.checkout.titulo}</h1>
      </header>

      <CheckoutForm />
    </div>
  );
}
