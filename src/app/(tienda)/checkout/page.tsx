import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/store/CheckoutForm';

export const metadata: Metadata = {
  title: 'Finalizar pedido',
  description: 'Confirma tu pedido de Doce pote.',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="wrap py-14">
      <header className="mb-12">
        <p className="font-display text-[0.86rem] font-semibold uppercase tracking-wider text-green-deep">
          Último paso
        </p>
        <h1 className="mt-2 text-[clamp(1.9rem,3.4vw,2.6rem)] font-bold">Finalizar pedido</h1>
      </header>

      <CheckoutForm />
    </div>
  );
}
