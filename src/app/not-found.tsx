import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from '@/lib/i18n/server';

export default async function NotFound() {
  const { t } = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center">
      <Image
        src="/brand/logo-mascot.jpg"
        alt=""
        width={200}
        height={200}
        className="h-28 w-28 rounded-full ring-4 ring-kraft-line/40"
      />

      <p className="mt-8 font-script text-5xl text-green-deep">{t.noEncontrado.uy}</p>
      <h1 className="mt-3 font-display text-2xl font-bold">{t.noEncontrado.titulo}</h1>
      <p className="mt-3 max-w-[38ch] text-[0.98rem] leading-relaxed text-ink-soft">
        {t.noEncontrado.lead}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/catalogo"
          className="rounded-sm bg-ink px-6 py-3.5 font-display font-semibold text-paper transition-colors hover:bg-[#100b06]"
        >
          {t.noEncontrado.verCatalogo}
        </Link>
        <Link
          href="/"
          className="rounded-sm border border-ink px-6 py-3.5 font-display font-semibold transition-colors hover:bg-ink hover:text-paper"
        >
          {t.noEncontrado.irInicio}
        </Link>
      </div>
    </div>
  );
}
