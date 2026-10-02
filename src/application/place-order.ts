import type { DiscountPolicy } from '../domain/discount.js';
import { nonEmptyText } from '../domain/money.js';
import { createOrder, OrderCalculator, type Order, type OrderLine } from '../domain/order.js';
import type { Clock, IdGenerator, OrderNotifier, OrderWriter } from './ports.js';

export interface PlaceOrderRequest {
  readonly customerName: string;
  readonly lines: readonly OrderLine[];
  readonly discount: DiscountPolicy;
}

export type PlacementResult = {
  readonly order: Order;
  readonly notification: 'sent' | 'failed';
};

// DIP: las dependencias son contratos del caso de uso; los adaptadores se eligen en demo.ts.
export class PlaceOrder {
  constructor(
    private readonly calculator: OrderCalculator,
    private readonly writer: OrderWriter,
    private readonly notifier: OrderNotifier,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(request: PlaceOrderRequest): Promise<PlacementResult> {
    const customerName = nonEmptyText(request.customerName, 'Cliente');
    const quote = this.calculator.calculate(request.lines, request.discount);
    const order = createOrder(this.ids.next(), customerName, this.clock.now(), quote);
    await this.writer.save(order);
    // El pedido ya está guardado: fallar al notificar no debe invitar a repetir la compra.
    try {
      await this.notifier.notify(order);
      return { order, notification: 'sent' };
    } catch {
      return { order, notification: 'failed' };
    }
  }
}
