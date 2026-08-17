import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTiendaInfo } from '../hooks/useTiendaInfo'
import { useChat } from '../context/useChat'
import {
  ICON_BOT, ICON_USER, ICON_WA_FLOAT, ICON_CHAT_CLOSE, ICON_SEND_PLANE,
} from '../pages/catalogIcons'
import './FloatingActions.css'

const API_URL = import.meta.env.VITE_API_URL

const WA_POR_DEFECTO = 'https://wa.me/573138909118'

const SALUDO = '¡Hola! Soy el asistente de Russitex. Cuéntame qué vas a confeccionar y te ayudo a elegir el material, o pregúntame por precios, envíos y horarios. 🧵'

const SUGERENCIAS = [
  '¿Qué forro uso para una chaqueta?',
  '¿Cuánto cuesta la entretela?',
  '¿Hacen envíos?',
]

function getTime() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

// El bot responde en markdown ligero. Convertimos solo negrita, cursiva,
// viñetas y saltos: nada que permita inyectar HTML arbitrario.
function formatearMensaje(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/\n\s*[-•]\s+/g, '\n• ')
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>')
}

/**
 * Botones flotantes (asistente + WhatsApp) y panel de chat.
 * Se monta una sola vez en App.jsx, así aparece en todas las páginas
 * y el chat conserva la conversación al navegar entre rutas.
 */
export default function FloatingActions() {
  const navigate = useNavigate()
  const tienda = useTiendaInfo()
  const waLink = tienda.whatsapp_link || WA_POR_DEFECTO

  // El estado vive en ChatProvider para que otras páginas puedan abrirlo.
  const { abierto, cerrarChat, alternarChat } = useChat()
  const [mensajes, setMensajes] = useState([{ role: 'assistant', content: SALUDO, time: 'Ahora' }])
  const [entrada, setEntrada] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [verSugerencias, setVerSugerencias] = useState(true)

  const mensajesRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (mensajesRef.current) mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight
  }, [mensajes, escribiendo])

  // Escape cierra el panel, igual que el mockup.
  useEffect(() => {
    if (!abierto) return
    function onKey(e) { if (e.key === 'Escape') cerrarChat() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto, cerrarChat])

  useEffect(() => {
    if (abierto) {
      const t = setTimeout(() => inputRef.current?.focus(), 300)
      return () => clearTimeout(t)
    }
  }, [abierto])

  async function enviar(texto) {
    const valor = (texto ?? entrada).trim()
    if (!valor || escribiendo) return

    setEntrada('')
    setVerSugerencias(false)
    const historial = [...mensajes, { role: 'user', content: valor, time: getTime() }]
    setMensajes(historial)
    setEscribiendo(true)

    try {
      // Va contra nuestro backend, no contra la API del modelo: allí se arma
      // el prompt con los precios reales de Alegra y los datos de tienda_info.
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historial.map(({ role, content }) => ({ role, content })) }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setMensajes((m) => [...m, { role: 'assistant', content: data.error, time: getTime() }])
        return
      }
      const respuesta = data.content?.[0]?.text || 'Lo siento, hubo un error. Intenta de nuevo.'
      setMensajes((m) => [...m, { role: 'assistant', content: respuesta, time: getTime() }])
    } catch {
      setMensajes((m) => [...m, { role: 'assistant', content: 'Error de conexión. Por favor intenta de nuevo.', time: getTime() }])
    } finally {
      setEscribiendo(false)
    }
  }

  function irAlFormulario(e) {
    e.preventDefault()
    cerrarChat()
    navigate('/asesoria#solicitar')
  }

  return (
    <>
      <div className="fab-stack">
        <span className="fab-enter" style={{ animationDelay: '.15s' }}>
          <button
            type="button"
            className="fab-btn ic-asist"
            onClick={alternarChat}
            aria-label="Asistente Russitex"
            aria-expanded={abierto}
          >
            <span dangerouslySetInnerHTML={{ __html: ICON_BOT }} />
            <span className="fab-tip">Asistente · al instante</span>
          </button>
        </span>
        <span className="fab-enter" style={{ animationDelay: '.3s' }}>
          <a className="fab-btn ic-wa" href={waLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <span dangerouslySetInnerHTML={{ __html: ICON_WA_FLOAT }} />
            <span className="fab-tip">WhatsApp · una persona</span>
          </a>
        </span>
      </div>

      <div className={`chat-panel ${abierto ? 'open' : ''}`} role="dialog" aria-label="Asistente Russitex" aria-hidden={!abierto}>
        <div className="chat-header">
          <div className="chat-avatar" dangerouslySetInnerHTML={{ __html: ICON_BOT }} />
          <div className="chat-header-info">
            <h3>Asistente Russitex</h3>
            <p>Respuestas al instante</p>
          </div>
          <button type="button" className="chat-close" onClick={cerrarChat} aria-label="Cerrar chat">
            <span dangerouslySetInnerHTML={{ __html: ICON_CHAT_CLOSE }} />
          </button>
        </div>

        <div className="chat-messages" ref={mensajesRef}>
          {mensajes.map((m, i) => (
            <div className={`msg ${m.role === 'user' ? 'user' : 'bot'}`} key={i}>
              <div className="msg-avatar" dangerouslySetInnerHTML={{ __html: m.role === 'user' ? ICON_USER : ICON_BOT }} />
              <div>
                {m.role === 'user'
                  ? <div className="msg-bubble">{m.content}</div>
                  : <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: formatearMensaje(m.content) }} />}
                <div className="msg-time">{m.time}</div>
              </div>
            </div>
          ))}
          <div className={`typing-indicator ${escribiendo ? 'visible' : ''}`}>
            <div className="msg-avatar" dangerouslySetInnerHTML={{ __html: ICON_BOT }} />
            <div className="typing-bubble">
              <span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span>
            </div>
          </div>
        </div>

        {verSugerencias && (
          <div className="quick-suggestions">
            {SUGERENCIAS.map((s) => (
              <button type="button" className="suggestion-chip" key={s} onClick={() => enviar(s)}>{s}</button>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <input
            type="text"
            className="chat-input"
            ref={inputRef}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') enviar() }}
            placeholder="Escribe tu pregunta..."
          />
          <button type="button" className="chat-send" onClick={() => enviar()} aria-label="Enviar">
            <span dangerouslySetInnerHTML={{ __html: ICON_SEND_PLANE }} />
          </button>
        </div>

        <a className="chat-to-form" href="/asesoria#solicitar" onClick={irAlFormulario}>
          ¿Tu proyecto es más específico? Solicita asesoría personalizada →
        </a>
      </div>
    </>
  )
}
