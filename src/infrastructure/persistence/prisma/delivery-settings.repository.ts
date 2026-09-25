/** Tarifa de domicilio sobre Prisma: una sola fila en `StoreSettings`. */

import { DeliveryPolicy } from '@core/domain/ordering/fulfillment';
import type { DeliverySettingsRepository } from '@core/domain/ordering/delivery-settings.repository';
import { db } from './client';

const STORE_ID = 'store';

export class PrismaDeliverySettingsRepository implements DeliverySettingsRepository {
  async find(): Promise<DeliveryPolicy | null> {
    const row = await db().storeSettings.findUnique({ where: { id: STORE_ID } });
    return row ? DeliveryPolicy.of(row.deliveryFee, row.freeDeliveryThreshold) : null;
  }

  async save(policy: DeliveryPolicy): Promise<void> {
    const data = {
      deliveryFee: policy.fee.amount,
      freeDeliveryThreshold: policy.freeThreshold.amount,
    };
    await db().storeSettings.upsert({
      where: { id: STORE_ID },
      create: { id: STORE_ID, ...data },
      update: data,
    });
  }
}
