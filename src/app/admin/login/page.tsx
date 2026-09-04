import type { Metadata } from 'next';
import Image from 'next/image';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Entrar al panel',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="texture-cats relative flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="absolute inset-0 bg-green-deep/88" aria-hidden />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand/logo-mascot.jpg"
            alt=""
            width={144}
            height={144}
            className="h-18 w-18 rounded-full ring-4 ring-paper/25"
            style={{ width: 72, height: 72 }}
            priority
          />
          <h1 className="mt-5 font-display text-2xl font-bold text-white">
            Panel de Doce pote
          </h1>
          <p className="mt-1.5 text-[0.9rem] text-paper/80">
            Entra para gestionar el catálogo y los pedidos.
          </p>
        </div>

        <div className="rounded-md bg-paper p-7 shadow-2xl">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-[0.82rem] text-paper/70">
          <a href="/" className="underline underline-offset-4 hover:text-white">
            Volver a la tienda
          </a>
        </p>
      </div>
    </div>
  );
}
