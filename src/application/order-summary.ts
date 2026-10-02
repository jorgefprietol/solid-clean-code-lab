import type { OrderReader } from './ports.js';
import { formatUsd } from '../domain/money.js';

export async function orderSummary(reader: OrderReader, id: string): Promise<string | undefined> {
  const order = await reader.findById(id);
  if (!order) return undefined;
  return `Pedido ${order.id} · ${order.customerName} · ${formatUsd(order.totalCents)}`;
}
