/**
 * La tarifa de domicilio, editable desde el panel.
 *
 * El .env trae los valores de fábrica; lo que se guarda en el panel los
 * reemplaza sin tener que redesplegar. El carrito y el pedido leen la tarifa
 * en cada consulta a través de `DeliveryPolicySource`, así que un cambio se
 * cobra desde el siguiente pedido.
 */

import { DeliveryPolicy } from '@core/domain/ordering/fulfillment';
import type { DeliverySettingsRepository } from '@core/domain/ordering/delivery-settings.repository';
import { ValidationError, type DomainError } from '@core/domain/shared/errors';
import { Err, Ok, type Result } from '@core/domain/shared/result';

/** De dónde sacan el carrito y el pedido la tarifa vigente. */
export interface DeliveryPolicySource {
  current(): Promise<DeliveryPolicy>;
}

/** Una tarifa que no cambia: la de los tests. */
export function fixedDeliveryPolicy(policy: DeliveryPolicy): DeliveryPolicySource {
  return { current: async () => policy };
}

/**
 * La tarifa guardada en el panel, o la de fábrica si no hay ninguna.
 *
 * Si la base falla al leerla —la tabla aún sin crear tras un despliegue, Neon
 * dormida— se cobra la de fábrica en vez de tumbar el carrito: es mejor vender
 * con la tarifa del .env que no vender.
 */
export class StoredDeliveryPolicy implements DeliveryPolicySource {
  constructor(
    private readonly settings: DeliverySettingsRepository,
    private readonly fallback: DeliveryPolicy,
  ) {}

  async current(): Promise<DeliveryPolicy> {
    try {
      return (await this.settings.find()) ?? this.fallback;
    } catch (error) {
      console.error('[domicilio] no se pudo leer la tarifa, uso la de fábrica:', error);
      return this.fallback;
    }
  }
}

export interface DeliverySettingsDTO {
  /** Lo que cuesta el domicilio, en pesos. */
  readonly fee: number;
  readonly feeFormatted: string;
  /** Desde qué subtotal va gratis. 0 = nunca va gratis. */
  readonly freeThreshold: number;
  readonly freeThresholdFormatted: string;
}

function toDTO(policy: DeliveryPolicy): DeliverySettingsDTO {
  return {
    fee: policy.fee.amount,
    feeFormatted: policy.fee.format(),
    freeThreshold: policy.freeThreshold.amount,
    freeThresholdFormatted: policy.freeThreshold.format(),
  };
}

export class GetDeliverySettingsUseCase {
  constructor(private readonly source: DeliveryPolicySource) {}

  async execute(): Promise<Result<DeliverySettingsDTO, DomainError>> {
    return Ok(toDTO(await this.source.current()));
  }
}

export interface SaveDeliverySettingsInput {
  readonly fee: number;
  readonly freeThreshold: number;
}

/** Topes para atajar un cero de más, no reglas del negocio. */
const MAX_FEE = 500_000;
const MAX_FREE_THRESHOLD = 10_000_000;

function checkAmount(value: number, max: number, label: string): string | null {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return `${label} debe ser un número entero de pesos, sin puntos ni decimales.`;
  }
  if (value < 0) return `${label} no puede ser negativo.`;
  if (value > max) {
    return `${label} parece demasiado alto. Revisa que no sobre un cero.`;
  }
  return null;
}

export class SaveDeliverySettingsUseCase {
  constructor(private readonly settings: DeliverySettingsRepository) {}

  async execute(input: SaveDeliverySettingsInput): Promise<Result<DeliverySettingsDTO, DomainError>> {
    const details: Record<string, string> = {};

    const feeError = checkAmount(input.fee, MAX_FEE, 'El costo del domicilio');
    if (feeError) details.fee = feeError;

    const thresholdError = checkAmount(
      input.freeThreshold,
      MAX_FREE_THRESHOLD,
      'El monto para el domicilio gratis',
    );
    if (thresholdError) details.freeThreshold = thresholdError;

    const first = feeError ?? thresholdError;
    if (first) return Err(new ValidationError(first, details));

    const policy = DeliveryPolicy.of(input.fee, input.freeThreshold);
    await this.settings.save(policy);
    return Ok(toDTO(policy));
  }
}
