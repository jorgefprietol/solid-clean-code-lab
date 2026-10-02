# Ejercicios prácticos

La implementación en `src/` es la solución base. Para practicar, trabaja sobre funciones nuevas o una rama local y conserva el punto de partida. Ejecuta `npm test` después de cada cambio.

| Ejercicio             | Punto de partida                                                        | Criterio de aceptación                                                                                        | Pista / solución base                                        |
| --------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1. Nombres expresivos | `examples/legacy-checkout.ts`                                           | Renombrar variables sin alterar los 36 escenarios de equivalencia                                             | Incluir propósito y unidad; `pricing.test.ts`                |
| 2. Extraer funciones  | El cálculo legado                                                       | Separar subtotal y descuento, conservando redondeo y cero                                                     | `OrderCalculator`, `PercentageDiscount`                      |
| 3. DRY                | `checkoutDiscount` y `reportDiscount` en `examples/stupid.ts`           | Ambos consumidores usan exactamente la misma política; 1.000 produce 100                                      | Inyectar `DiscountPolicy`                                    |
| 4. SRP                | Diseñar una versión que haga cálculo, escritura y mensajes en una clase | Separar razones de cambio; demostrar que el fallo de escritura no notifica                                    | `domain/order.ts`, `application/place-order.ts`, adaptadores |
| 5. OCP                | Crear `ThresholdDiscount`                                               | Aplicar 500 centavos a partir de 2.000; probar debajo, igual y encima del umbral sin editar `OrderCalculator` | Política anónima en `pricing.test.ts`                        |
| 6. LSP                | `Bird` y `Penguin` en `examples/stupid.ts`                              | Definir `Swimmer` y `Flyer`; un pingüino nada sin ofrecer una operación imposible                             | Usar capacidades; comparar con los contratos de repositorio  |
| 7. ISP                | `MultifunctionDevice` y `BasicPrinter`                                  | Separar `Printer` y `Scanner`; el consumidor de impresión no requiere `scan`                                  | Patrón de `OrderReader` / `OrderWriter`                      |
| 8. DIP                | `TightlyCoupledWriter` y `untestableMetadata`                           | Inyectar contratos y probar fecha e ID fijos, además de un fallo de escritura                                 | `PlaceOrder` y `place-order.test.ts`                         |
| 9. Deuda técnica      | Adaptador de archivos                                                   | Documentar recuperación ante escritura interrumpida; definir cuándo reemplazar el adaptador                   | Priorizar primero un escenario fallido verificable           |
| 10. Code smells       | Ejemplos STUPID                                                         | Identificar cada defecto, predecir su consecuencia y ejecutar la demostración                                 | `npm run smells`                                             |

## Extensión integradora

Añade un notificador que escriba confirmaciones a un archivo. Debe implementar `OrderNotifier`, conectarse desde la composición y funcionar sin editar las reglas de negocio. Comprueba una notificación correcta y una ruta no escribible. En el segundo caso, `PlaceOrder` debe devolver el pedido guardado con `notification: 'failed'`.

Para una extensión posterior, diseña reintentos de notificación con un estado persistido. Antes de programar, define qué sucede si el proceso cae después de enviar el mensaje pero antes de registrar el éxito. Esto evita confundir inyección de dependencias con garantías de entrega.

## Preguntas para defender el diseño

- ¿Qué motivo de cambio tiene cada clase y dónde hay una abstracción innecesaria?
- ¿Qué parte del contrato de un repositorio verifica LSP y qué errores de infraestructura siguen permitidos?
- ¿Por qué un descuento se redondea una vez sobre el subtotal y no en cada producto?
- ¿Cuál es la diferencia entre rechazar un ID duplicado y hacer idempotente una compra?
- ¿Qué efectos externos ocurren cuando la validación falla?
- ¿Cómo ampliarías la aplicación a otra moneda sin mezclar importes incompatibles?
- ¿Qué prueba falla si una implementación devuelve referencias a sus datos internos?
