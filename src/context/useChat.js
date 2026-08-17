import { createContext, useContext } from 'react'

/**
 * Deja que cualquier página abra o cierre el chat del asistente, aunque el
 * panel viva en <FloatingActions>, que está montado aparte en App.jsx.
 *
 * Mismo patrón que useAuth: el contexto y el hook van en este archivo, y el
 * Provider en ChatContext.jsx.
 */
export const ChatContext = createContext(null)

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat debe usarse dentro de <ChatProvider>')
  return ctx
}
