// Código deliberadamente problemático para practicar: nombres opacos, número mágico y ramas por tipo.
// Solo modela entradas válidas; no debe usarse desde src/.
export function legacyTotal(d: readonly { p: number; q: number }[], t: number): number {
  let x = 0;
  for (let i = 0; i < d.length; i++) {
    const a = d[i]!;
    x += a.p * a.q;
  }
  if (t === 1) x -= Math.round(x * 0.1);
  return x;
}
