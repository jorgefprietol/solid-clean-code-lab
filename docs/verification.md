# Verificación

Verificado localmente en Windows con Node.js 22.14.0 y npm 11.2.0. Las versiones exactas de TypeScript y sus tipos están fijadas en `package-lock.json`; instala con `npm ci`.

## Comandos

```powershell
npm run check
npm test
npm run demo
npm run demo:file
npm run smells
```

## Evidencia

`npm test` compila con tipos estrictos y ejecuta 35 pruebas, contando subpruebas. No hay pruebas omitidas ni fallidas.

- Precios y refactorización: centavos, redondeo, subtotal, descuentos, entradas inválidas, desbordamientos y 36 combinaciones de equivalencia con el cálculo legado.
- Orquestación: reloj e IDs controlados, guardar antes de notificar, errores de almacenamiento, fallo de mensajes sin perder pedidos y entradas inválidas sin efectos externos.
- Contratos de repositorio: memoria y archivos ejecutan las mismas cinco verificaciones de ausencia, lectura completa, duplicados, aislamiento de datos y escrituras concurrentes del mismo ID.
- Persistencia: recuperación con una instancia nueva, IDs con caracteres de ruta codificados, fallo de escritura y rechazo de JSON corrupto, estructura inválida, totales inconsistentes e ID alterado.

Las pruebas usan directorios temporales y los eliminan al terminar. `npm run demo:file` conserva un pedido en `data/orders/` para que puedas inspeccionarlo.

## Alcance

Las pruebas verifican los contratos implementados, no garantizan durabilidad ante una caída del proceso. La escritura exclusiva impide sobrescribir IDs repetidos, pero no es una transacción entre guardar y notificar. El laboratorio no incluye servidor web, base de datos, pagos reales ni entrega externa de mensajes.
