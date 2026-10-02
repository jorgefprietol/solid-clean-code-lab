import { nonNegativeInteger, ValidationError } from './money.js';

// Un nuevo descuento implementa este contrato sin modificar el calculador (OCP).
export interface DiscountPolicy {
  discountCents(subtotalCents: number): number;
}

export class NoDiscount implements DiscountPolicy {
  discountCents(_subtotalCents: number): number {
    return 0;
  }
}

export class PercentageDiscount implements DiscountPolicy {
  constructor(private readonly basisPoints: number) {
    nonNegativeInteger(basisPoints, 'Porcentaje en puntos básicos');
    if (basisPoints > 10_000) throw new ValidationError('El descuento supera el 100%');
  }

  discountCents(subtotalCents: number): number {
    nonNegativeInteger(subtotalCents, 'Subtotal');
    // BigInt evita pérdida de precisión en la multiplicación. Redondeo: medio hacia arriba.
    return Number((BigInt(subtotalCents) * BigInt(this.basisPoints) + 5_000n) / 10_000n);
  }
}

export class FixedDiscount implements DiscountPolicy {
  constructor(private readonly cents: number) {
    nonNegativeInteger(cents, 'Descuento fijo');
  }

  discountCents(subtotalCents: number): number {
    return Math.min(this.cents, nonNegativeInteger(subtotalCents, 'Subtotal'));
  }
}
