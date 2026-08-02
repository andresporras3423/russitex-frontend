import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

// La cabecera y el pie piden lo mismo. Guardamos la promesa a nivel de
// módulo para que se haga UNA sola petición aunque varios componentes
// llamen al hook.
let promesa = null

function cargar() {
  if (!promesa) {
    promesa = fetch(`${API_URL}/api/tienda`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('sin datos'))))
      .then((d) => d.info || {})
      .catch(() => {
        // Si falla, se reintenta en la próxima carga en vez de quedar
        // cacheado un error para siempre.
        promesa = null
        return {}
      })
  }
  return promesa
}

/**
 * Información del local (horarios, contacto, envíos) desde tienda_info.
 * Devuelve {} mientras carga o si el backend no responde, para que los
 * componentes puedan usar valores por defecto sin romperse.
 */
export function useTiendaInfo() {
  const [info, setInfo] = useState({})

  useEffect(() => {
    let activo = true
    cargar().then((d) => { if (activo) setInfo(d) })
    return () => { activo = false }
  }, [])

  return info
}
