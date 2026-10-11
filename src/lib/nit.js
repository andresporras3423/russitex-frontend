// Dígito de verificación del NIT (algoritmo de la DIAN).
export function digitoVerificacion(nit) {
  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
  const digitos = String(nit).replace(/\D/g, '')
  const suma = digitos.split('').reverse().reduce((s, d, i) => s + Number(d) * pesos[i], 0)
  const r = suma % 11
  return String(r > 1 ? 11 - r : r)
}

export const REGIMENES = {
  COMMON_REGIME: 'Responsable de IVA',
  SIMPLIFIED_REGIME: 'No responsable de IVA',
}
