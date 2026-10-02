import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  DuplicateOrderError,
  type OrderReader,
  type OrderWriter,
} from '../src/application/ports.js';
import { NoDiscount } from '../src/domain/discount.js';
import { createOrder, OrderCalculator, type Order } from '../src/domain/order.js';
import { FileOrderRepository } from '../src/infrastructure/file-order-repository.js';
import { MemoryOrderRepository } from '../src/infrastructure/memory-order-repository.js';

function sampleOrder(id = 'order-1'): Order {
  const quote = new OrderCalculator().calculate(
    [{ productId: 'book', name: 'Libro', unitPriceCents: 500, quantity: 2 }],
    new NoDiscount(),
  );
  return createOrder(id, 'Ana', new Date('2026-01-01T00:00:00Z'), quote);
}

// LSP: ejecutar el mismo contrato sobre cada implementación, sin condiciones por tipo.
for (const adapter of ['memory', 'file'] as const) {
  test(`contrato LSP: ${adapter}`, async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'solid-contract-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const repository: OrderReader & OrderWriter =
      adapter === 'memory' ? new MemoryOrderRepository() : new FileOrderRepository(directory);

    await t.test('ID inexistente devuelve undefined', async () => {
      assert.equal(await repository.findById('missing'), undefined);
    });
    await t.test('guardar y leer conserva el pedido completo', async () => {
      const order = sampleOrder();
      await repository.save(order);
      assert.deepEqual(await repository.findById(order.id), order);
    });
    await t.test('ID duplicado falla sin sobrescribir', async () => {
      const original = await repository.findById('order-1');
      await assert.rejects(
        repository.save({ ...sampleOrder(), customerName: 'Otro' }),
        DuplicateOrderError,
      );
      assert.deepEqual(await repository.findById('order-1'), original);
    });
    await t.test('mutar el resultado no altera el almacenamiento', async () => {
      const loaded = await repository.findById('order-1');
      assert.ok(loaded);
      const mutable = loaded as unknown as { customerName: string; lines: { quantity: number }[] };
      mutable.customerName = 'Cambio';
      mutable.lines[0]!.quantity = 99;
      assert.deepEqual(await repository.findById('order-1'), sampleOrder());
    });
    await t.test('dos escrituras del mismo ID tienen un solo ganador', async () => {
      const order = sampleOrder('concurrent');
      const results = await Promise.allSettled([repository.save(order), repository.save(order)]);
      assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
      const rejected = results.find((result) => result.status === 'rejected');
      assert.ok(rejected?.status === 'rejected' && rejected.reason instanceof DuplicateOrderError);
      assert.deepEqual(await repository.findById(order.id), order);
    });
  });
}

test('archivo: una instancia nueva recupera pedidos y codifica IDs como nombres seguros', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'solid-restart-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const order = sampleOrder('../pedido/ñ');
  await new FileOrderRepository(directory).save(order);
  assert.deepEqual(await new FileOrderRepository(directory).findById(order.id), order);
});

test('archivo: errores de escritura no se ocultan como ausencia de pedido', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'solid-error-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const blocked = join(directory, 'not-a-directory');
  await writeFile(blocked, 'blocked');
  await assert.rejects(new FileOrderRepository(blocked).save(sampleOrder()));
});
