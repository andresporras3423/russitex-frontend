// Total del catálogo redondeado hacia abajo a la decena (41 o 49 -> +40),
// para que la cifra no cambie con cada producto nuevo. La usan el inicio y
// Sobre nosotros, que deben mostrar lo mismo.
export function materialesRedondeados(n) {
  if (!n) return '—'
  return n >= 10 ? `+${Math.floor(n / 10) * 10}` : String(n)
}
