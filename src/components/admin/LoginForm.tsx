'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { motion } from 'motion/react';
import { login } from '@/app/actions/admin';
import type { ActionResult } from '@/lib/action-result';

/**
 * Formulario de acceso.
 *
 * Usa `useActionState` para que funcione incluso sin JavaScript: el navegador
 * envía el formulario y Next ejecuta la acción igual.
 */
export function LoginForm() {
  const [state, formAction] = useActionState<ActionResult<null> | null, FormData>(
    login,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block font-display text-[0.86rem] font-semibold">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          className="w-full rounded-md border border-kraft-line bg-white px-4 py-3 text-[0.94rem] outline-none transition-colors focus:border-green-deep"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block font-display text-[0.86rem] font-semibold"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-kraft-line bg-white px-4 py-3 text-[0.94rem] outline-none transition-colors focus:border-green-deep"
        />
      </div>

      {state && !state.ok && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded bg-berry/10 px-3 py-2.5 text-[0.86rem] text-berry"
          role="alert"
        >
          {state.error}
        </motion.p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-sm bg-ink py-3.5 font-display font-semibold text-paper transition-colors hover:bg-[#100b06] disabled:opacity-60"
    >
      {pending ? 'Entrando...' : 'Entrar'}
    </button>
  );
}
