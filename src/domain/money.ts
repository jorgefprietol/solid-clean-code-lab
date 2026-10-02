export class ValidationError extends Error {}

export function nonEmptyText(value: string, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${name} no puede estar vacío`);
  }
  return value.trim();
}

export function nonNegativeInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ValidationError(`${name} debe ser un entero seguro no negativo`);
  }
  return value;
}

export function addCents(left: number, right: number): number {
  nonNegativeInteger(left, 'Sumando izquierdo');
  nonNegativeInteger(right, 'Sumando derecho');
  return nonNegativeInteger(left + right, 'Suma en centavos');
}

export function multiplyCents(cents: number, quantity: number): number {
  nonNegativeInteger(cents, 'Precio en centavos');
  nonNegativeInteger(quantity, 'Cantidad');
  return nonNegativeInteger(cents * quantity, 'Subtotal en centavos');
}

export function formatUsd(cents: number): string {
  nonNegativeInteger(cents, 'Importe');
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
