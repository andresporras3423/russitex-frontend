import { useCallback, useMemo, useState } from 'react'
import { ChatContext } from './useChat'

/**
 * Guarda si el panel del asistente está abierto. Lo pinta <FloatingActions>,
 * pero cualquier página puede abrirlo — por ejemplo el enlace "Habla con
 * nuestro asistente" del inicio.
 */
export function ChatProvider({ children }) {
  const [abierto, setAbierto] = useState(false)

  const abrirChat    = useCallback(() => setAbierto(true), [])
  const cerrarChat   = useCallback(() => setAbierto(false), [])
  const alternarChat = useCallback(() => setAbierto((v) => !v), [])

  const valor = useMemo(
    () => ({ abierto, abrirChat, cerrarChat, alternarChat }),
    [abierto, abrirChat, cerrarChat, alternarChat]
  )

  return <ChatContext.Provider value={valor}>{children}</ChatContext.Provider>
}
