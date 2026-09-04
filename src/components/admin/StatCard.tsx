import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'money' | 'attention';

const TONES: Record<Tone, { card: string; icon: string; value: string }> = {
  neutral: {
    card: 'border-kraft-line/70 bg-white',
    icon: 'bg-paper-2 text-ink-soft',
    value: 'text-ink',
  },
  money: {
    card: 'border-green-deep/25 bg-white',
    icon: 'bg-green-deep/10 text-green-deep',
    value: 'text-green-deep',
  },
  // Solo se enciende cuando de verdad hay algo esperando: un panel donde
  // todo grita, no comunica nada.
  attention: {
    card: 'border-caramel/45 bg-caramel/[0.06]',
    icon: 'bg-caramel/15 text-caramel',
    value: 'text-caramel',
  },
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: Tone;
}) {
  const styles = TONES[tone];

  return (
    <div className={cn('rounded-lg border p-5 transition-shadow hover:shadow-sm', styles.card)}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-[0.76rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
          {label}
        </p>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
            styles.icon,
          )}
        >
          {icon}
        </span>
      </div>

      <p className={cn('mt-3 font-display text-[1.8rem] font-bold leading-none tabular-nums', styles.value)}>
        {value}
      </p>

      {hint && <p className="mt-2 text-[0.8rem] leading-snug text-ink-soft">{hint}</p>}
    </div>
  );
}
