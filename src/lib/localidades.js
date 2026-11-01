// Localidades de Bogotá: en Bogotá el segundo selector de la dirección es la
// localidad (la ciudad es una sola). La misma lista está en el backend:
// services/localidades.js
export const LOCALIDADES = [
  'Antonio Nariño', 'Barrios Unidos', 'Bosa', 'Chapinero', 'Ciudad Bolívar',
  'Engativá', 'Fontibón', 'Kennedy', 'La Candelaria', 'Los Mártires',
  'Puente Aranda', 'Rafael Uribe Uribe', 'San Cristóbal', 'Santa Fe', 'Suba',
  'Sumapaz', 'Teusaquillo', 'Tunjuelito', 'Usaquén', 'Usme',
]

export const esBogota = (dane) => String(dane || '').startsWith('11001')

// Municipio único de un departamento (Bogotá), o null.
export function municipioUnico(ciudades, departamento) {
  const lista = ciudades.filter((c) => c.departamento === departamento)
  return lista.length === 1 ? lista[0] : null
}

// "Calle 66 # 21-50, barrio Galerías, localidad Teusaquillo"
export function direccionCompleta({ direccion, barrio, localidad } = {}) {
  return [direccion, barrio && `barrio ${barrio}`, localidad && `localidad ${localidad}`].filter(Boolean).join(', ')
}
