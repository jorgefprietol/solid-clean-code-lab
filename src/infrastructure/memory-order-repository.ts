import { DuplicateOrderError, type OrderReader, type OrderWriter } from '../application/ports.js';
import type { Order } from '../domain/order.js';

export class MemoryOrderRepository implements OrderReader, OrderWriter {
  private readonly orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    if (this.orders.has(order.id)) throw new DuplicateOrderError(order.id);
    this.orders.set(order.id, structuredClone(order));
  }

  async findById(id: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    return order ? structuredClone(order) : undefined;
  }
}
