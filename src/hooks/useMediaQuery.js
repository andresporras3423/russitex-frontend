import { useSyncExternalStore } from 'react'

/** true mientras la consulta de CSS (p. ej. '(max-width: 991px)') se cumple. */
export function useMediaQuery(consulta) {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(consulta)
      mq.addEventListener('change', avisar)
      return () => mq.removeEventListener('change', avisar)
    },
    () => window.matchMedia(consulta).matches,
    () => false,
  )
}
