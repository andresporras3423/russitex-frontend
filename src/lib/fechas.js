// Fechas con el formato del diseño (version2):
//   fechaCorta  → "17 may. 2026"               (tablas de pedidos)
//   fechaHora   → "17 may. 2026, 2:34 p.m."    (detalle del pedido)
//   fechaLarga  → "17 de mayo de 2026, 2:34 p.m." (confirmación de compra)
// Se arman a mano porque toLocaleString('es-CO') da "17 de may de 2026" y
// "2:34 p. m.", distinto del diseño.
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const CORTOS = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.']

const fecha = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}
const hora = (d) => {
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h < 12 ? 'a.m.' : 'p.m.'}`
}

export const fechaCorta = (iso) => { const d = fecha(iso); return d ? `${d.getDate()} ${CORTOS[d.getMonth()]} ${d.getFullYear()}` : '' }
export const fechaHora = (iso) => { const d = fecha(iso); return d ? `${fechaCorta(iso)}, ${hora(d)}` : '' }
export const fechaLarga = (iso) => { const d = fecha(iso); return d ? `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}, ${hora(d)}` : '' }
