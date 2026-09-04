import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '@core/application/ports/id-generator';

export class UuidGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}

/** Ids predecibles para tests: "test-1", "test-2", ... */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = 'test') {}

  generate(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}
