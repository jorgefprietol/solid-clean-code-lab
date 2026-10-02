import { nonEmptyText, nonNegativeInteger, ValidationError } from '../domain/money.js';
import { createOrder, OrderCalculator, type Order, type OrderLine } from '../domain/order.js';

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError('El archivo no contiene un objeto de pedido válido');
  }
  return value as Record<string, unknown>;
}

function textField(value: unknown, name: string): string {
  if (typeof value !== 'string') throw new ValidationError(`${name} debe ser texto`);
  return nonEmptyText(value, name);
}

function centsField(value: unknown, name: string): number {
  if (typeof value !== 'number') throw new ValidationError(`${name} debe ser numérico`);
  return nonNegativeInteger(value, name);
}

// El tipo de TypeScript no valida JSON. Este límite comprueba la estructura y las invariantes.
export function parseOrderJson(json: string): Order {
  const data = record(JSON.parse(json) as unknown);
  if (!Array.isArray(data.lines)) throw new ValidationError('Faltan las líneas del pedido');
  const lines: OrderLine[] = data.lines.map((value: unknown) => {
    const line = record(value);
    return {
      productId: textField(line.productId, 'Producto'),
      name: textField(line.name, 'Nombre del producto'),
      unitPriceCents: centsField(line.unitPriceCents, 'Precio'),
      quantity: centsField(line.quantity, 'Cantidad'),
    };
  });
  const discountCents = centsField(data.discountCents, 'Descuento');
  const quote = new OrderCalculator().calculate(lines, { discountCents: () => discountCents });
  if (quote.subtotalCents !== data.subtotalCents || quote.totalCents !== data.totalCents) {
    throw new ValidationError('Los totales del archivo no coinciden con las líneas');
  }
  const createdAt = textField(data.createdAt, 'Fecha');
  return createOrder(
    textField(data.id, 'Identificador'),
    textField(data.customerName, 'Cliente'),
    new Date(createdAt),
    quote,
  );
}
