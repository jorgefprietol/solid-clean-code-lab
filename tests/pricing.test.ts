import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FixedDiscount, NoDiscount, PercentageDiscount } from '../src/domain/discount.js';
import { OrderCalculator, type OrderLine } from '../src/domain/order.js';
import { ValidationError } from '../src/domain/money.js';
import { legacyTotal } from '../examples/legacy-checkout.js';

const calculator = new OrderCalculator();
const line: OrderLine = { productId: 'book', name: 'Libro', unitPriceCents: 1_001, quantity: 2 };

test('calcula subtotal, descuento y total en centavos', () => {
  const quote = calculator.calculate([line], new PercentageDiscount(1_000));
  assert.equal(quote.subtotalCents, 2_002);
  assert.equal(quote.discountCents, 200);
  assert.equal(quote.totalCents, 1_802);
});

test('un descuento fijo nunca produce un total negativo', () => {
  assert.equal(calculator.calculate([line], new FixedDiscount(10_000)).totalCents, 0);
});

test('sin descuento conserva el subtotal', () => {
  assert.equal(calculator.calculate([line], new NoDiscount()).totalCents, 2_002);
});

test('redondea medio centavo hacia arriba', () => {
  assert.equal(new PercentageDiscount(5_000).discountCents(101), 51);
});

test('el porcentaje mantiene precisión con enteros seguros grandes', () => {
  assert.equal(
    new PercentageDiscount(10_000).discountCents(Number.MAX_SAFE_INTEGER),
    Number.MAX_SAFE_INTEGER,
  );
});

test('OCP: incorporar una política nueva no modifica OrderCalculator', () => {
  const promotionalDiscount = {
    discountCents: (subtotal: number) => (subtotal >= 2_000 ? 500 : 0),
  };
  assert.equal(calculator.calculate([line], promotionalDiscount).totalCents, 1_502);
});

test('rechaza carrito vacío y datos de línea inválidos', () => {
  assert.throws(() => calculator.calculate([], new NoDiscount()), ValidationError);
  for (const invalid of [
    { ...line, quantity: 0 },
    { ...line, quantity: -1 },
    { ...line, quantity: 1.5 },
    { ...line, unitPriceCents: -1 },
    { ...line, unitPriceCents: 1.5 },
    { ...line, unitPriceCents: NaN },
    { ...line, quantity: Infinity },
    { ...line, productId: ' ' },
    { ...line, name: '' },
  ])
    assert.throws(() => calculator.calculate([invalid], new NoDiscount()), ValidationError);
});

test('rechaza desbordamiento en producto y suma', () => {
  const expensive = { ...line, unitPriceCents: Number.MAX_SAFE_INTEGER, quantity: 1 };
  assert.throws(
    () => calculator.calculate([{ ...expensive, quantity: 2 }], new NoDiscount()),
    ValidationError,
  );
  assert.throws(() => calculator.calculate([expensive, line], new NoDiscount()), ValidationError);
});

test('rechaza descuentos inválidos incluso si vienen de un plugin', () => {
  for (const invalid of [-1, 2_003, 0.5, NaN, Infinity]) {
    assert.throws(
      () => calculator.calculate([line], { discountCents: () => invalid }),
      ValidationError,
    );
  }
  for (const invalid of [-1, 10_001, 0.5, NaN]) {
    assert.throws(() => new PercentageDiscount(invalid), ValidationError);
  }
  assert.throws(() => new FixedDiscount(-1), ValidationError);
});

test('la cotización es una copia inmutable y normaliza nombres', () => {
  const input = { ...line, name: ' Libro ' };
  const quote = calculator.calculate([input], new NoDiscount());
  input.quantity = 100;
  assert.equal(quote.lines[0]?.quantity, 2);
  assert.equal(quote.lines[0]?.name, 'Libro');
  assert.ok(Object.isFrozen(quote));
  assert.ok(Object.isFrozen(quote.lines));
  assert.ok(Object.isFrozen(quote.lines[0]));
});

test('la refactorización conserva el comportamiento legado en entradas válidas', () => {
  for (const price of [0, 1, 5, 101, 1_099, 10_000]) {
    for (const quantity of [1, 2, 5]) {
      for (const premium of [false, true]) {
        const legacy = legacyTotal(
          [
            { p: price, q: quantity },
            { p: 100, q: 1 },
          ],
          premium ? 1 : 0,
        );
        const clean = calculator.calculate(
          [
            { ...line, unitPriceCents: price, quantity },
            { ...line, unitPriceCents: 100, quantity: 1 },
          ],
          premium ? new PercentageDiscount(1_000) : new NoDiscount(),
        );
        assert.equal(clean.totalCents, legacy);
      }
    }
  }
});
