# SOLID y Clean Code Lab

Proyecto independiente en TypeScript que demuestra principios SOLID y Clean Code mediante un sistema de pedidos: validación de productos, cálculo de descuentos, persistencia y confirmación de compras. Incluye ejemplos de refactorización y contratos comunes para adaptadores intercambiables.

## Ejecutar

Requiere Node.js 22 o superior y npm. No necesita servicios externos.

```powershell
git clone https://github.com/jorgefprietol/solid-clean-code-lab.git
cd solid-clean-code-lab
npm ci
npm run verify
npm run demo
npm run smells
```

`npm run demo` utiliza memoria. Para guardar pedidos en archivos locales:

```powershell
npm run demo:file
```

Los archivos se crean en `data/orders/`, una carpeta ignorada por Git. Cada ejecución genera un pedido nuevo. El ejemplo calcula un subtotal de USD 61,00, un descuento de USD 6,10 y un total de USD 54,90. El identificador y la fecha cambian entre ejecuciones.

## Qué incluye

| Tema                                   | Implementación                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| Nombres, funciones, validación y DRY   | `src/domain/`, comparación con `examples/legacy-checkout.ts`                  |
| Deuda técnica, acoplamiento y cohesión | [Guía de estudio](docs/study-guide.md) y ejemplos STUPID                      |
| SRP                                    | Cálculo, orquestación, almacenamiento, serialización y notificación separados |
| OCP                                    | `DiscountPolicy`, descuentos porcentuales, fijos y una extensión en pruebas   |
| LSP                                    | Contrato común ejecutado sobre repositorios en memoria y archivos             |
| ISP                                    | `OrderReader` y `OrderWriter`; consultas que solo dependen de lectura         |
| DIP                                    | Caso de uso con repositorio, notificador, reloj e identificadores inyectados  |
| Pruebas                                | Equivalencia de refactorización, dinero, errores, persistencia y duplicados   |

## Estructura

```text
src/
  domain/          Reglas puras, dinero y descuentos
  application/     Contratos y casos de uso
  infrastructure/  Memoria, archivos, consola, reloj y UUID
  demo.ts          Composición y demostración ejecutable
examples/          Código problemático y demostración de sus consecuencias
tests/             Pruebas con node:test
docs/              Guía, ejercicios y verificación
```

Empieza por [la guía de estudio](docs/study-guide.md), continúa con [los ejercicios](docs/exercises.md) y consulta [la verificación](docs/verification.md). `npm run check` comprueba los tipos sin generar archivos; `npm run build` compila a `dist/`.

## Reglas del caso

- Los importes son enteros en centavos de USD; cantidades positivas e importes no negativos.
- Un pedido necesita al menos una línea. Producto, nombre, cliente e identificador no pueden estar vacíos.
- Los porcentajes usan puntos básicos: 1.000 equivale al 10%. El descuento se redondea a centavos, con medio centavo hacia arriba.
- Un descuento nunca puede superar el subtotal. Una política que viola el contrato se rechaza.
- Guardar un identificador existente falla sin sobrescribirlo.
- La notificación sucede después de guardar. Si falla, el pedido se conserva y el resultado indica `notification: 'failed'`.
- Las lecturas devuelven copias: modificar un resultado no cambia lo almacenado.

La persistencia por archivos es un adaptador de demostración: no ofrece recuperación transaccional ante caídas ni reintentos de notificación. Los identificadores duplicados se rechazan; el caso de uso no implementa idempotencia de compras. El proyecto tiene sus propias dependencias.

## Calidad y entrega

GitHub Actions ejecuta formato, ESLint, comprobación de tipos, pruebas de contratos y auditoría de dependencias en Windows y Linux. `npm run format` aplica el formato; `npm run verify` ejecuta todos los controles locales. Las pruebas comprueban resultados y errores de negocio, incluyendo persistencia, duplicados y equivalencia tras refactorización.

Licencia MIT.
