// Descuento por compra grande, solo para MOSTRARLO (lo que se cobra lo
// calcula el backend: services/descuentos.js). El porcentaje debe coincidir
// con DESCUENTO_COMPRA_PORCENTAJE del backend; el monto mínimo sale de
// tienda_info.descuento_compra_desde ("Compras desde $350.000 COP").
export const PORCENTAJE_DESCUENTO = 5

export function umbralDescuento(texto) {
  if (!texto) return null
  const n = Number(String(texto).replace(/[^\d]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

// Mismo cálculo que el backend: línea por línea, redondeado al peso.
export function calcularDescuento(lineas, umbral) {
  const subtotal = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0)
  if (!umbral || subtotal < umbral) return 0
  return lineas.reduce((s, l) => s + Math.round((l.precio * l.cantidad * PORCENTAJE_DESCUENTO) / 100), 0)
}
