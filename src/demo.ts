import { resolve } from 'node:path';
import { PlaceOrder } from './application/place-order.js';
import { orderSummary } from './application/order-summary.js';
import { PercentageDiscount } from './domain/discount.js';
import { formatUsd } from './domain/money.js';
import { OrderCalculator } from './domain/order.js';
import { ConsoleOrderNotifier, SystemClock, UuidGenerator } from './infrastructure/adapters.js';
import { FileOrderRepository } from './infrastructure/file-order-repository.js';
import { MemoryOrderRepository } from './infrastructure/memory-order-repository.js';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--file')) {
  console.error('Uso: npm run demo o npm run demo:file');
  process.exitCode = 1;
} else {
  const repository = args.includes('--file')
    ? new FileOrderRepository(resolve('data/orders'))
    : new MemoryOrderRepository();
  const checkout = new PlaceOrder(
    new OrderCalculator(),
    repository,
    new ConsoleOrderNotifier(),
    new SystemClock(),
    new UuidGenerator(),
  );
  const result = await checkout.execute({
    customerName: 'Ana',
    lines: [
      { productId: 'keyboard', name: 'Teclado', unitPriceCents: 4_500, quantity: 1 },
      { productId: 'notebook', name: 'Cuaderno', unitPriceCents: 800, quantity: 2 },
    ],
    discount: new PercentageDiscount(1_000),
  });
  console.log('\nLaboratorio SOLID y Clean Code');
  console.log(`Adaptador: ${repository.constructor.name}`);
  console.log(`Subtotal: ${formatUsd(result.order.subtotalCents)}`);
  console.log(`Descuento (10%): ${formatUsd(result.order.discountCents)}`);
  console.log(await orderSummary(repository, result.order.id));
  console.log(`Notificación: ${result.notification}`);
  console.log('\nSRP: cálculo, almacenamiento y notificación tienen responsabilidades separadas.');
  console.log('OCP: políticas de descuento sustituibles, sin switch en el calculador.');
  console.log('LSP: repositorios en memoria y archivo comparten pruebas de contrato.');
  console.log('ISP: el resumen solo requiere OrderReader.');
  console.log('DIP: el caso de uso recibe adaptadores a través de contratos.');
}
