import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { ValidationError } from '../src/domain/money.js';
import { FileOrderRepository } from '../src/infrastructure/file-order-repository.js';
import { parseOrderJson } from '../src/infrastructure/order-json.js';

const data = {
  id: 'order-1',
  customerName: 'Ana',
  createdAt: '2026-01-01T00:00:00.000Z',
  lines: [{ productId: 'book', name: 'Libro', unitPriceCents: 500, quantity: 2 }],
  subtotalCents: 1_000,
  discountCents: 100,
  totalCents: 900,
};

test('deserialización valida y reconstruye un pedido', () => {
  assert.deepEqual(parseOrderJson(JSON.stringify(data)), data);
});

test('JSON corrupto y estructuras incorrectas fallan explícitamente', () => {
  assert.throws(() => parseOrderJson('{corrupt'), SyntaxError);
  for (const invalid of [
    null,
    [],
    {},
    { ...data, customerName: 7 },
    { ...data, lines: [null] },
    { ...data, createdAt: 'invalid' },
    { ...data, lines: [{ ...data.lines[0], quantity: '2' }] },
    { ...data, lines: [] },
  ]) {
    assert.throws(() => parseOrderJson(JSON.stringify(invalid)), ValidationError);
  }
});

test('totales manipulados no se aceptan', () => {
  for (const invalid of [
    { ...data, totalCents: 1 },
    { ...data, subtotalCents: 999 },
    { ...data, discountCents: -1 },
    { ...data, discountCents: 1_001 },
  ]) {
    assert.throws(() => parseOrderJson(JSON.stringify(invalid)), ValidationError);
  }
});

test('el repositorio no convierte un archivo corrupto en pedido inexistente', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'solid-corrupt-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const filename = join(directory, `order-${Buffer.from(data.id).toString('hex')}.json`);
  const repository = new FileOrderRepository(directory);
  await writeFile(filename, '{invalid');
  await assert.rejects(repository.findById(data.id), SyntaxError);
  await writeFile(filename, JSON.stringify({ ...data, id: 'different' }));
  await assert.rejects(repository.findById(data.id), /ID/);
});
