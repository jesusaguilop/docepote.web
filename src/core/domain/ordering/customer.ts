/** Datos de contacto y entrega del cliente. Objeto de valor validado. */

import { PhoneNumber } from '../shared/phone-number';
import { ValidationError } from '../shared/errors';
import type { FulfillmentMethod } from './fulfillment';

export interface CustomerInput {
  readonly name: string;
  readonly phone: string;
  readonly address?: string | null;
  readonly notes?: string | null;
}

const MAX_NOTES_LENGTH = 400;

export class Customer {
  private constructor(
    readonly name: string,
    readonly phone: PhoneNumber,
    readonly address: string | null,
    readonly notes: string | null,
  ) {
    Object.freeze(this);
  }

  /**
   * La dirección es obligatoria solo si el pedido es a domicilio: la regla
   * depende del método de entrega, por eso se recibe aquí y no se asume.
   */
  static of(input: CustomerInput, method: FulfillmentMethod): Customer {
    const name = input.name.trim();
    if (name.length < 2) {
      throw new ValidationError('Cuéntanos tu nombre para saber a quién entregarle.', {
        campo: 'name',
      });
    }

    const phone = PhoneNumber.of(input.phone);

    const address = input.address?.trim() || null;
    if (method === 'delivery' && (!address || address.length < 8)) {
      throw new ValidationError('Necesitamos la dirección completa para llevarte el pedido.', {
        campo: 'address',
      });
    }

    const notes = input.notes?.trim() || null;
    if (notes && notes.length > MAX_NOTES_LENGTH) {
      throw new ValidationError(`Las notas no pueden superar ${MAX_NOTES_LENGTH} caracteres.`, {
        campo: 'notes',
      });
    }

    return new Customer(name, phone, method === 'pickup' ? null : address, notes);
  }

  /** Primer nombre, para saludar en la confirmación. */
  get firstName(): string {
    return this.name.split(' ')[0] ?? this.name;
  }
}
