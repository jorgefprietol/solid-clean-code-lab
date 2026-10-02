import { MemoryOrderRepository } from '../src/infrastructure/memory-order-repository.js';
import type { Order } from '../src/domain/order.js';

// S: estado global que hace que dos consumidores interfieran entre sí.
export class PricingSingleton {
  static premium = false;
  static price(cents: number): number {
    return this.premium ? cents - Math.round(cents * 0.1) : cents;
  }
}

// T: el servicio elige su almacenamiento; probar un fallo exige cambiar la clase.
export class TightlyCoupledWriter {
  private readonly repository = new MemoryOrderRepository();
  async save(order: Order): Promise<void> {
    await this.repository.save(order);
  }
}

// U: tiempo e identificadores no controlables en una prueba determinista.
export function untestableMetadata(): { id: string; timestamp: number } {
  return { id: Math.random().toString(), timestamp: Date.now() };
}

// P: optimización innecesaria; los operadores bit a bit truncan a 32 bits.
export function prematurelyOptimizedTotal(cents: number, quantity: number): number {
  return (cents * quantity) | 0;
}

// I: nombres que ocultan el significado de los datos (ver legacy-checkout.ts).
export function calc(a: number, b: number): number {
  return a * b;
}

// D: dos copias de una regla ya divergieron.
export function checkoutDiscount(cents: number): number {
  return Math.round(cents * 0.1);
}
export function reportDiscount(cents: number): number {
  return Math.round(cents * 0.15);
}

// LSP: obligar a todos los pájaros a volar rompe el contrato para el pingüino.
export class Bird {
  fly(): string {
    return 'volando';
  }
}
export class Penguin extends Bird {
  override fly(): string {
    throw new Error('Un pingüino no puede volar');
  }
}

// ISP: una impresora simple se ve obligada a implementar una capacidad ajena.
export interface MultifunctionDevice {
  print(text: string): string;
  scan(): string;
}
export class BasicPrinter implements MultifunctionDevice {
  print(text: string): string {
    return text;
  }
  scan(): string {
    throw new Error('No admite escaneo');
  }
}
