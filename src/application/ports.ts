import type { Order } from '../domain/order.js';

// ISP: consultar pedidos no requiere conocer operaciones de escritura.
export interface OrderReader {
  findById(id: string): Promise<Order | undefined>;
}

export interface OrderWriter {
  save(order: Order): Promise<void>;
}

export interface OrderNotifier {
  notify(order: Order): Promise<void>;
}

export interface Clock {
  now(): Date;
}
export interface IdGenerator {
  next(): string;
}

export class DuplicateOrderError extends Error {
  constructor(id: string) {
    super(`Ya existe el pedido ${id}`);
  }
}
