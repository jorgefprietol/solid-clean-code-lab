import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlaceOrder } from '../src/application/place-order.js';
import { orderSummary } from '../src/application/order-summary.js';
import { NoDiscount } from '../src/domain/discount.js';
import { ValidationError } from '../src/domain/money.js';
import { OrderCalculator, type Order } from '../src/domain/order.js';
import { MemoryOrderRepository } from '../src/infrastructure/memory-order-repository.js';

const clock = { now: () => new Date('2026-01-01T00:00:00Z') };
const ids = { next: () => 'order-1' };
const request = {
  customerName: ' Ana ',
  lines: [{ productId: 'book', name: 'Libro', unitPriceCents: 500, quantity: 2 }],
  discount: new NoDiscount(),
};

test('guarda antes de notificar y usa reloj e identificador inyectados', async () => {
  const repository = new MemoryOrderRepository();
  let notificationCount = 0;
  const checkout = new PlaceOrder(
    new OrderCalculator(),
    repository,
    {
      notify: async (order) => {
        assert.deepEqual(await repository.findById(order.id), order);
        notificationCount++;
      },
    },
    clock,
    ids,
  );
  const result = await checkout.execute(request);
  assert.equal(result.notification, 'sent');
  assert.equal(result.order.id, 'order-1');
  assert.equal(result.order.createdAt, '2026-01-01T00:00:00.000Z');
  assert.equal(result.order.customerName, 'Ana');
  assert.equal(notificationCount, 1);
});

test('fallar al guardar impide notificar y propaga la causa', async () => {
  const failure = new Error('Almacenamiento no disponible');
  let notified = false;
  const checkout = new PlaceOrder(
    new OrderCalculator(),
    {
      save: async () => {
        throw failure;
      },
    },
    {
      notify: async () => {
        notified = true;
      },
    },
    clock,
    ids,
  );
  await assert.rejects(checkout.execute(request), (error) => error === failure);
  assert.equal(notified, false);
});

test('fallar al notificar conserva el pedido y devuelve estado explícito', async () => {
  const repository = new MemoryOrderRepository();
  const checkout = new PlaceOrder(
    new OrderCalculator(),
    repository,
    {
      notify: async () => {
        throw new Error('Mensaje no disponible');
      },
    },
    clock,
    ids,
  );
  const result = await checkout.execute(request);
  assert.equal(result.notification, 'failed');
  assert.deepEqual(await repository.findById(result.order.id), result.order);
});

test('una entrada inválida no genera ID ni guarda ni notifica', async () => {
  let effects = 0;
  const checkout = new PlaceOrder(
    new OrderCalculator(),
    {
      save: async () => {
        effects++;
      },
    },
    {
      notify: async () => {
        effects++;
      },
    },
    clock,
    {
      next: () => {
        effects++;
        return 'id';
      },
    },
  );
  await assert.rejects(checkout.execute({ ...request, customerName: ' ' }), ValidationError);
  await assert.rejects(checkout.execute({ ...request, lines: [] }), ValidationError);
  assert.equal(effects, 0);
});

test('fecha e identificador inválidos nunca llegan al almacenamiento', async () => {
  let saved = false;
  const writer = {
    save: async () => {
      saved = true;
    },
  };
  const notifier = { notify: async (_order: Order) => {} };
  await assert.rejects(
    new PlaceOrder(
      new OrderCalculator(),
      writer,
      notifier,
      { now: () => new Date('invalid') },
      ids,
    ).execute(request),
    ValidationError,
  );
  await assert.rejects(
    new PlaceOrder(new OrderCalculator(), writer, notifier, clock, { next: () => ' ' }).execute(
      request,
    ),
    ValidationError,
  );
  assert.equal(saved, false);
});

test('ISP: la consulta funciona con una dependencia que solo sabe leer', async () => {
  const reader = { findById: async () => undefined };
  assert.equal(await orderSummary(reader, 'missing'), undefined);
  const repository = new MemoryOrderRepository();
  const result = await new PlaceOrder(
    new OrderCalculator(),
    repository,
    { notify: async () => {} },
    clock,
    ids,
  ).execute(request);
  const summary = await orderSummary(
    { findById: (id) => repository.findById(id) },
    result.order.id,
  );
  assert.ok(summary?.includes('Ana'));
  assert.ok(summary?.includes('order-1'));
});
