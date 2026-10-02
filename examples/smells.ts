import { PlaceOrder } from '../src/application/place-order.js';
import { PercentageDiscount } from '../src/domain/discount.js';
import { multiplyCents } from '../src/domain/money.js';
import { OrderCalculator } from '../src/domain/order.js';
import { MemoryOrderRepository } from '../src/infrastructure/memory-order-repository.js';
import { legacyTotal } from './legacy-checkout.js';
import {
  PricingSingleton,
  prematurelyOptimizedTotal,
  checkoutDiscount,
  reportDiscount,
  Penguin,
  BasicPrinter,
} from './stupid.js';

const lines = [{ productId: 'book', name: 'Libro', unitPriceCents: 2_000, quantity: 2 }];
const calculator = new OrderCalculator();
const discount = new PercentageDiscount(1_000);
console.log('Antes y después (entrada válida):');
console.log({
  before: legacyTotal([{ p: 2_000, q: 2 }], 1),
  after: calculator.calculate(lines, discount).totalCents,
});

console.log('\nS — Singleton: cambiar una compra afecta a otra.');
const regularPrice = PricingSingleton.price(1_000);
PricingSingleton.premium = true;
console.log({ regularPrice, sameCustomerAfterGlobalChange: PricingSingleton.price(1_000) });
PricingSingleton.premium = false;

console.log(
  '\nT/U — Acoplamiento y tiempo: inyectar permite simular almacenamiento, reloj y notificación.',
);
const checkout = new PlaceOrder(
  calculator,
  new MemoryOrderRepository(),
  { notify: async () => {} },
  { now: () => new Date('2026-01-01T00:00:00Z') },
  { next: () => 'deterministic-order' },
);
console.log((await checkout.execute({ customerName: 'Ana', lines, discount })).order.createdAt);

console.log('\nP — Optimización prematura: truncamiento de enteros.');
console.log({
  before: prematurelyOptimizedTotal(3_000_000_000, 1),
  after: multiplyCents(3_000_000_000, 1),
});
console.log('\nI — Nombres opacos: p/q/t se convierten en unitPriceCents/quantity/DiscountPolicy.');
console.log('\nD — Duplicación: descuentos inconsistentes.');
console.log({
  checkout: checkoutDiscount(1_000),
  report: reportDiscount(1_000),
  sharedPolicy: discount.discountCents(1_000),
});

console.log('\nLSP / ISP — Capacidades incompatibles:');
for (const operation of [() => new Penguin().fly(), () => new BasicPrinter().scan()]) {
  try {
    operation();
  } catch (error) {
    console.log((error as Error).message);
  }
}
console.log(
  'Solución aplicada: interfaces pequeñas y adaptadores con el mismo contrato verificable.',
);
