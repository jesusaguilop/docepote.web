import { describe, expect, it } from 'vitest';
import {
  SaveDeliverySettingsUseCase,
  StoredDeliveryPolicy,
} from '@core/application/ordering/delivery-settings.use-cases';
import { DeliveryPolicy } from '@core/domain/ordering/fulfillment';
import type { DeliverySettingsRepository } from '@core/domain/ordering/delivery-settings.repository';

class InMemoryDeliverySettings implements DeliverySettingsRepository {
  stored: DeliveryPolicy | null = null;
  async find() {
    return this.stored;
  }
  async save(policy: DeliveryPolicy) {
    this.stored = policy;
  }
}

const FACTORY = DeliveryPolicy.of(5000, 60000);

describe('StoredDeliveryPolicy', () => {
  it('usa la tarifa del .env mientras no se haya guardado ninguna', async () => {
    const source = new StoredDeliveryPolicy(new InMemoryDeliverySettings(), FACTORY);
    expect((await source.current()).fee.amount).toBe(5000);
  });

  it('usa la tarifa guardada en el panel en cuanto existe', async () => {
    const settings = new InMemoryDeliverySettings();
    const source = new StoredDeliveryPolicy(settings, FACTORY);

    await new SaveDeliverySettingsUseCase(settings).execute({ fee: 7000, freeThreshold: 0 });

    const policy = await source.current();
    expect(policy.fee.amount).toBe(7000);
    expect(policy.freeThreshold.amount).toBe(0);
  });

  it('si la base falla, cobra la de fábrica en vez de tumbar el carrito', async () => {
    const broken: DeliverySettingsRepository = {
      find: async () => {
        throw new Error('la tabla no existe');
      },
      save: async () => {},
    };
    const source = new StoredDeliveryPolicy(broken, FACTORY);
    expect((await source.current()).fee.amount).toBe(5000);
  });
});

describe('SaveDeliverySettingsUseCase', () => {
  it('rechaza montos negativos, con decimales o con un cero de más', async () => {
    const settings = new InMemoryDeliverySettings();
    const save = new SaveDeliverySettingsUseCase(settings);

    for (const input of [
      { fee: -1, freeThreshold: 60000 },
      { fee: 5000.5, freeThreshold: 60000 },
      { fee: 5_000_000, freeThreshold: 60000 },
      { fee: 5000, freeThreshold: Number.NaN },
    ]) {
      const result = await save.execute(input);
      expect(result.ok).toBe(false);
    }
    expect(settings.stored).toBeNull();
  });
});
