import type { Clock } from '@core/application/ports/clock';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Reloj congelado, para tests. Sustituye al real sin que nadie más cambie (LSP). */
export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current);
  }

  advanceBy(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}
