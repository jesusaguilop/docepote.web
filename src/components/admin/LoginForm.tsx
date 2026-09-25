'use client';

import { useActionState, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { motion } from 'motion/react';
import { login } from '@/app/actions/admin';
import type { ActionResult } from '@/lib/action-result';
import { EyeIcon, EyeOffIcon } from './icons';

const inputClass =
  'w-full min-h-12 rounded-md border border-kraft-line bg-white px-4 py-3 text-base outline-none transition-[border-color,box-shadow] focus:border-green-deep focus:ring-3 focus:ring-green-deep/25 aria-invalid:border-berry';

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

  /* React vacía los campos no controlados al terminar la acción. El correo va
     controlado para que un fallo de contraseña no obligue a escribirlo otra vez. */
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const passwordRef = useRef<HTMLInputElement>(null);

  const hasError = state !== null && !state.ok;

  // Tras un fallo, el cursor vuelve a la contraseña: es lo que hay que corregir.
  useEffect(() => {
    if (!hasError) return;
    passwordRef.current?.focus();
    // Cambiar la `key` vuelve a montar el aviso: se anima y se lee otra vez
    // aunque el mensaje sea idéntico al del intento anterior.
    setAttempt((count) => count + 1);
  }, [state, hasError]);

  function detectCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState('CapsLock'));
  }

  const passwordHints = [hasError && 'login-error', capsLock && 'caps-lock']
    .filter(Boolean)
    .join(' ');

  return (
    <form
      action={formAction}
      onSubmit={() => setShowPassword(false)}
      className="space-y-5"
    >
      <div>
        <label htmlFor="email" className="mb-1.5 block font-display text-[0.95rem] font-semibold">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? 'login-error' : undefined}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block font-display text-[0.95rem] font-semibold"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            autoCapitalize="none"
            spellCheck={false}
            onKeyDown={detectCapsLock}
            onKeyUp={detectCapsLock}
            onBlur={() => setCapsLock(false)}
            aria-invalid={hasError || undefined}
            aria-describedby={passwordHints || undefined}
            className={`${inputClass} pr-28`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-controls="password"
            className="absolute inset-y-1 right-1 flex min-w-11 items-center gap-1.5 rounded px-3 font-display text-[0.86rem] font-semibold text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
          >
            {showPassword ? (
              <EyeOffIcon className="h-5 w-5 shrink-0" />
            ) : (
              <EyeIcon className="h-5 w-5 shrink-0" />
            )}
            {showPassword ? 'Ocultar' : 'Mostrar'}
            <span className="sr-only"> contraseña</span>
          </button>
        </div>

        <p id="caps-lock" aria-live="polite" className="mt-1.5 min-h-5 text-[0.86rem] font-semibold text-caramel">
          {capsLock ? 'Tienes las mayúsculas activadas.' : ''}
        </p>
      </div>

      {hasError && (
        <motion.p
          key={attempt}
          id="login-error"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded bg-berry/10 px-3 py-2.5 text-[0.92rem] text-berry"
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
      aria-busy={pending}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-ink py-3.5 font-display text-base font-semibold text-paper transition-colors hover:bg-[#100b06] disabled:cursor-wait disabled:opacity-70"
    >
      {pending && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper"
          aria-hidden
        />
      )}
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  );
}
