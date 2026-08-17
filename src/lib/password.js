/**
 * Puntúa una contraseña de 0 a 3 para el medidor de fuerza.
 * Lo usan el registro (LoginPage) y el cambio de contraseña
 * (NuevaContrasenaPage), para que ambos midan igual.
 */
export function calcularFortaleza(val) {
  if (!val) return { score: 0, label: 'Ingresa una contraseña' }
  let score = 0
  if (val.length >= 8) score++
  if (/[A-Z]/.test(val) || /[0-9]/.test(val)) score++
  if (/[^A-Za-z0-9]/.test(val) && val.length >= 10) score++

  const labels = { 1: 'Contraseña débil', 2: 'Contraseña regular', 3: 'Contraseña segura' }
  return { score, label: labels[score] || 'Contraseña débil' }
}

// Mínimo que exige Supabase por defecto.
export const LARGO_MINIMO = 6
