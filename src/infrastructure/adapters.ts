import { randomUUID } from 'node:crypto';
import type { Clock, IdGenerator, OrderNotifier } from '../application/ports.js';
import { formatUsd } from '../domain/money.js';
import type { Order } from '../domain/order.js';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class UuidGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}

export class ConsoleOrderNotifier implements OrderNotifier {
  async notify(order: Order): Promise<void> {
    console.log(`Confirmación para ${order.customerName}: ${formatUsd(order.totalCents)}`);
  }
}
