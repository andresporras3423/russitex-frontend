import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // Si la URL trae un ancla (#grupo-envios), la página de destino se
    // encarga de saltar hasta ella. Subir arriba acá provocaría un salto
    // visible y, según el orden de los efectos, podría ganar la carrera.
    if (hash) return
    // Instantáneo: el scroll-behavior: smooth del html haría que cada página
    // nueva se viera subiendo desde donde quedó la anterior.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}
