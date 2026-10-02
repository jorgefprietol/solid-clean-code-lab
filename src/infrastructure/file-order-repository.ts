import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DuplicateOrderError, type OrderReader, type OrderWriter } from '../application/ports.js';
import type { Order } from '../domain/order.js';
import { parseOrderJson } from './order-json.js';

// Un archivo por pedido y apertura exclusiva: un ID repetido nunca sobrescribe otro pedido.
// Adaptador local de laboratorio. No aporta transacciones ni recuperación ante caídas.
export class FileOrderRepository implements OrderReader, OrderWriter {
  constructor(private readonly directory: string) {}

  private pathFor(id: string): string {
    const encodedId = Buffer.from(id, 'utf8').toString('hex');
    return join(this.directory, `order-${encodedId}.json`);
  }

  async save(order: Order): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    try {
      await writeFile(this.pathFor(order.id), JSON.stringify(order, null, 2), { flag: 'wx' });
    } catch (error) {
      if (hasCode(error, 'EEXIST')) throw new DuplicateOrderError(order.id);
      throw error;
    }
  }

  async findById(id: string): Promise<Order | undefined> {
    let json: string;
    try {
      json = await readFile(this.pathFor(id), 'utf8');
    } catch (error) {
      if (hasCode(error, 'ENOENT')) return undefined;
      throw error;
    }
    const order = parseOrderJson(json);
    if (order.id !== id) throw new Error('El ID del archivo no coincide con el solicitado');
    return structuredClone(order);
  }
}

function hasCode(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}
