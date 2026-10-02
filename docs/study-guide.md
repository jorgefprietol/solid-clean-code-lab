# Guía de estudio

Esta ruta sigue los temas del temario adjunto. No intenta reproducir sus clases: trabaja los conceptos con un caso original, pequeño y ejecutable.

## 1. Preparar el laboratorio

Ejecuta los comandos del README. Lee `src/demo.ts`: allí se decide qué implementaciones conectar. Después corre `npm run demo:file` para sustituir el almacenamiento. Ninguna regla de precios cambia al seleccionar otro adaptador.

## 2. Clean Code y deuda técnica

Compara `examples/legacy-checkout.ts` con `src/domain/order.ts`. En el primero hay que deducir qué significan `d`, `p`, `q`, `t` y `x`. En el segundo, los nombres incluyen unidades: `unitPriceCents`, `quantity`, `subtotalCents`. El descuento es una política con nombre en vez de un número que codifica el tipo de cliente.

Una función debe revelar su propósito y mantener juntas las operaciones que pertenecen a él. `validatedLine` valida y copia una línea; `OrderCalculator.calculate` obtiene una cotización; `PlaceOrder.execute` coordina guardar y notificar. Separa efectos externos de cálculos para razonar sobre errores y escribir pruebas deterministas.

DRY significa tener una fuente de verdad por regla. No obliga a unir fragmentos parecidos que cambian por razones distintas. El porcentaje está definido en `PercentageDiscount`; cálculos y reportes deben reutilizar esa política en vez de copiar su fórmula.

La deuda técnica aparece cuando una decisión dificulta cambios futuros. En este laboratorio, un `switch` de descuentos obliga a editar el cálculo por cada promoción; un reloj global dificulta probar fechas; una fórmula copiada puede divergir. Una deuda consciente necesita motivo, impacto y condición de revisión. Ejemplo: conservar archivos locales mientras solo hay una demostración; revisar el adaptador al necesitar transacciones y recuperación.

## 3. Clases y composición

El comportamiento variable se incorpora por composición. `PlaceOrder` recibe un escritor, un notificador, un reloj y un generador de IDs. No necesita heredar de un servicio genérico con funciones ajenas al pedido.

En cada clase, mantén una estructura uniforme: dependencias y estado, constructor, operaciones públicas y ayudantes privados. Una clase se justifica si agrupa estado o comportamientos relacionados; `formatUsd` y las validaciones sencillas permanecen como funciones.

Los comentarios explican decisiones: por qué usamos BigInt para porcentajes o por qué un fallo de notificación conserva el pedido. Evita comentarios que repitan el nombre de un método. La configuración estricta de TypeScript y las unidades explícitas ayudan a mantener la misma convención en todos los archivos.

## 4. Code smells y STUPID

Ejecuta `npm run smells`. Los defectos se encuentran en `examples/stupid.ts`, separados del código del caso de uso.

| Olor                   | Consecuencia observable                                                  | Cambio aplicado o ejercicio                     |
| ---------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| Singleton              | Un cambio global en `premium` afecta a otros consumidores                | Políticas independientes por pedido             |
| Tight coupling         | `TightlyCoupledWriter` crea su repositorio y no permite simular un fallo | Inyectar `OrderWriter`                          |
| Untestability          | `Date.now` y `Math.random` introducen resultados variables               | Inyectar `Clock` e `IdGenerator`                |
| Premature optimization | Un operador bit a bit convierte 3.000.000.000 en un entero negativo      | Aritmética validada, sin truncamiento a 32 bits |
| Indescriptive naming   | `calc(a,b)` no comunica unidades ni propósito                            | `multiplyCents(cents, quantity)`                |
| Duplication            | El checkout aplica 10% y el reporte 15%                                  | Una `DiscountPolicy` compartida                 |

Otros olores que debes detectar: una función larga que calcula, guarda y manda mensajes; _primitive obsession_ al mezclar dólares y centavos; _shotgun surgery_ si cada promoción toca múltiples consumidores; _feature envy_ si una consulta inspecciona campos internos de un repositorio; parámetros booleanos que ocultan dos operaciones distintas; abstracciones especulativas sin un segundo caso real.

La cohesión aumenta al reunir operaciones que cambian por el mismo motivo. El acoplamiento disminuye cuando un consumidor solo conoce el contrato que necesita. Separar archivos no basta: una clase que importa detalles privados de otra sigue estando acoplada.

## 5. Los cinco principios SOLID

| Principio                      | Decisión concreta                                                                | Cómo comprobarlo                                                      |
| ------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| SRP: responsabilidad única     | Las reglas de precios, persistencia y notificación cambian por motivos distintos | Cambiar un mensaje no requiere editar `OrderCalculator`               |
| OCP: abierto/cerrado           | Las variantes de descuento implementan `DiscountPolicy`                          | Añadir una promoción sin editar el calculador                         |
| LSP: sustitución de Liskov     | Ambos repositorios conservan lectura, duplicados y aislamiento de datos          | Ejecutar `repository-contract.test.ts` con los dos adaptadores        |
| ISP: segregación de interfaces | `orderSummary` solo necesita `OrderReader`                                       | Probarlo con un objeto que no tiene `save`                            |
| DIP: inversión de dependencias | El caso de uso conoce puertos; infraestructura implementa esos puertos           | Simular fallo de almacenamiento o notificación sin servicios externos |

LSP es un contrato de comportamiento, no una afirmación sobre usar `extends`. El pingüino que hereda `fly` pero arroja una excepción ilustra una capacidad mal modelada. En nuestro caso, memoria y archivos son sustituibles cuando guardan correctamente y permiten fallos de infraestructura explícitos.

ISP divide contratos según sus consumidores, no según una regla de una interfaz por método. DIP tampoco consiste simplemente en pasar parámetros: los contratos se definen desde las necesidades de la aplicación y los adaptadores externos dependen de ellos.

OCP se aplica al punto de variación que ya conocemos: descuentos. No es una prohibición de modificar código ni un motivo para diseñar un framework para cada función.

## 6. Refactorizar con evidencia

Primero fija el comportamiento esperado con pruebas. Después realiza cambios pequeños de nombres, extracción y composición. `pricing.test.ts` compara el cálculo legado con el limpio en 36 combinaciones de precio, cantidad y descuento sobre entradas válidas.

Las validaciones nuevas son un cambio deliberado de comportamiento frente al legado: cantidades inválidas, desbordamientos y descuentos excesivos ahora fallan. No se debe presentar esa ampliación como una mera refactorización. Revisa también la semántica de los fallos: guardar y notificar no son una sola transacción.
