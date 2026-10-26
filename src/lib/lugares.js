// La lista DANE de municipios viene en mayúsculas ("BOGOTÁ D.C.",
// "SAN JOSÉ DEL GUAVIARE"). Para mostrarla se pasa a nombre propio, como en
// el diseño ("Bogotá, D.C.", "San José del Guaviare"). El valor que se envía
// al backend no cambia: solo es para leer.
const MINUSCULAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en'])
const ESPECIALES = {
  'BOGOTÁ D.C.': 'Bogotá, D.C.',
  'BOGOTA D.C.': 'Bogotá, D.C.',
  'ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA': 'San Andrés y Providencia',
}

export function nombreLugar(texto) {
  const t = String(texto || '').trim()
  if (ESPECIALES[t]) return ESPECIALES[t]
  return t.toLowerCase().split(/(\s+|-|\()/).map((p, i) => {
    if (/^d\.c\.?$/.test(p)) return 'D.C.'
    if (i > 0 && MINUSCULAS.has(p)) return p
    return p.charAt(0).toUpperCase() + p.slice(1)
  }).join('')
}
