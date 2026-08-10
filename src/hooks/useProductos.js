import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

// Mismo patrón que useTiendaInfo: se cachea la PROMESA a nivel de módulo,
// así varios componentes montados a la vez comparten una sola petición.
let promesa = null

function cargar() {
  if (!promesa) {
    promesa = fetch(`${API_URL}/api/productos`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('sin catálogo'))))
      .then((d) => d.productos || [])
      .catch(() => {
        // Si falla se reintenta en la próxima carga, en vez de dejar
        // cacheado el error para siempre.
        promesa = null
        return []
      })
  }
  return promesa
}

/**
 * Catálogo público (Alegra + Supabase) para componentes que solo necesitan
 * leerlo, como los conteos del mega-menú o el total de materiales.
 * Devuelve [] mientras carga o si el backend no responde.
 *
 * CatalogPage no usa este hook porque necesita estados de carga y error
 * propios para pintar el esqueleto y el mensaje de fallo.
 */
export function useProductos() {
  const [productos, setProductos] = useState([])

  useEffect(() => {
    let activo = true
    cargar().then((d) => { if (activo) setProductos(d) })
    return () => { activo = false }
  }, [])

  return productos
}
