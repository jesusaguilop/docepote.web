/** Puerto de la tarifa de domicilio que se edita desde el panel. */

import type { DeliveryPolicy } from './fulfillment';

export interface DeliverySettingsRepository {
  /** La tarifa guardada. `null` = nunca se ha cambiado desde el panel. */
  find(): Promise<DeliveryPolicy | null>;
  save(policy: DeliveryPolicy): Promise<void>;
}
