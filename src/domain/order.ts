import type { DiscountPolicy } from './discount.js';
import {
  addCents,
  multiplyCents,
  nonEmptyText,
  nonNegativeInteger,
  ValidationError,
} from './money.js';

export interface OrderLine {
  readonly productId: string;
  readonly name: string;
  readonly unitPriceCents: number;
  readonly quantity: number;
}

export interface Quote {
  readonly lines: readonly OrderLine[];
  readonly subtotalCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
}

export interface Order extends Quote {
  readonly id: string;
  readonly customerName: string;
  readonly createdAt: string;
}

function validatedLine(line: OrderLine): OrderLine {
  const quantity = nonNegativeInteger(line.quantity, 'Cantidad');
  if (quantity === 0) throw new ValidationError('La cantidad debe ser mayor a cero');
  return Object.freeze({
    productId: nonEmptyText(line.productId, 'Producto'),
    name: nonEmptyText(line.name, 'Nombre del producto'),
    unitPriceCents: nonNegativeInteger(line.unitPriceCents, 'Precio en centavos'),
    quantity,
  });
}

// Responsabilidad única: validar líneas y calcular precios; sin almacenamiento ni mensajes.
export class OrderCalculator {
  calculate(input: readonly OrderLine[], discount: DiscountPolicy): Quote {
    if (input.length === 0) throw new ValidationError('El pedido debe contener productos');
    const lines = Object.freeze(input.map(validatedLine));
    const subtotalCents = lines.reduce(
      (subtotal, line) => addCents(subtotal, multiplyCents(line.unitPriceCents, line.quantity)),
      0,
    );
    const discountCents = nonNegativeInteger(discount.discountCents(subtotalCents), 'Descuento');
    if (discountCents > subtotalCents) throw new ValidationError('El descuento supera el subtotal');
    return Object.freeze({
      lines,
      subtotalCents,
      discountCents,
      totalCents: subtotalCents - discountCents,
    });
  }
}

export function createOrder(
  id: string,
  customerName: string,
  createdAt: Date,
  quote: Quote,
): Order {
  if (!Number.isFinite(createdAt.getTime())) throw new ValidationError('Fecha inválida');
  return Object.freeze({
    ...quote,
    id: nonEmptyText(id, 'Identificador'),
    customerName: nonEmptyText(customerName, 'Cliente'),
    createdAt: createdAt.toISOString(),
  });
}
