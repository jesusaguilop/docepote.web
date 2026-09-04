'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ButtonLink } from '@/components/ui/Button';

interface HeroProps {
  whatsappNumber: string;
}

export function Hero({ whatsappNumber }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  // Parallax suave: el gato se mueve más despacio que el texto al bajar.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const mascotY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 90]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 40]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);

  return (
    <section ref={sectionRef} className="texture-cats relative overflow-hidden">
      {/* Velo verde: da contraste al texto sobre la textura de gatitos. */}
      <div
        className="absolute inset-0 bg-[linear-gradient(100deg,rgba(76,100,32,0.88)_0%,rgba(76,100,32,0.74)_55%,rgba(76,100,32,0.56)_100%)]"
        aria-hidden
      />

      <div className="wrap relative z-10 grid items-center gap-14 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <motion.div style={{ y: copyY, opacity: fade }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 0.88, y: 0 }}
            transition={{ duration: 0.55 }}
            className="font-display text-[0.95rem] font-semibold text-paper"
          >
            Doceria artesanal &middot; Valledupar
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-[11.5ch] text-[clamp(2.5rem,4.4vw,3.9rem)] font-bold leading-[1.04] text-white"
          >
            Un pedacito de Brasil en cada bocado.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.92, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-6 max-w-[44ch] text-[1.08rem] leading-relaxed text-paper"
          >
            Capas de bizcocho y brigadeiro montadas a mano dentro de un potecito.
            Seis sabores, en versión individual, mini o kit para tus eventos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-9 flex flex-wrap items-center gap-6"
          >
            <ButtonLink href="/catalogo" variant="solid">
              Ver catálogo
            </ButtonLink>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-white/55 py-3.5 font-display font-semibold text-white transition-colors hover:border-white"
            >
              Pedir por WhatsApp
            </a>
          </motion.div>
        </motion.div>

        {/* Sticker con cinta, igual al del prototipo original. */}
        <motion.div
          style={{ y: mascotY }}
          className="relative mx-auto w-full max-w-[380px] lg:mx-0"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: -2.5 }}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative rounded-md bg-paper p-3 shadow-[0_18px_50px_rgba(20,28,8,0.35)]"
          >
            <span
              className="absolute -top-4 left-1/2 h-8 w-28 -translate-x-1/2 -rotate-2 bg-paper-2/85 shadow-sm"
              aria-hidden
            />
            <Image
              src="/brand/hero-mascot.jpg"
              alt="El gato de Doce pote abrazando un pote de dulce"
              width={615}
              height={824}
              priority
              className="h-auto w-full rounded-sm"
              sizes="(max-width: 1024px) 90vw, 380px"
            />
            <p className="py-3 text-center font-script text-2xl text-ink-soft">
              Empaque original
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
