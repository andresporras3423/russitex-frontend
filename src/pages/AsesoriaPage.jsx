import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import './AsesoriaPage.css'
import {
  ICON_BENEFIT_1, ICON_BENEFIT_2, ICON_BENEFIT_3,
  ICON_BOT, ICON_USER, ICON_CHAT_SEND, ICON_QUESTIONS, ICON_CLOCK, ICON_WA_SUBMIT,
  ICON_WA_FLOAT,
} from './catalogIcons'

const API_URL = import.meta.env.VITE_API_URL

const QUICK_SUGGESTIONS = [
  '¿Qué entretelas tienen?',
  'Precios de forros',
  'Materiales para chaqueta',
  '¿Tienen hombreras?',
]

const FAQS = [
  { q: '¿La asesoría tiene costo?', a: 'No. Orientarte para que elijas bien tus materiales es parte de lo que hacemos en Russitex. La asesoría, tanto rápida como personalizada, es completamente gratuita.' },
  { q: '¿Me pueden decir exactamente qué material comprar?', a: 'Podemos orientarte según tu proyecto, pero algunos detalles dependen de la tela que uses, el acabado que buscas y la disponibilidad del producto en el momento. Por eso recomendamos contarnos el mayor detalle posible.' },
  { q: '¿Puedo recibir asesoría presencial?', a: 'Sí. También puedes visitarnos en nuestra tienda física en Bogotá durante el horario de atención y te atendemos directamente en el mostrador.' },
  { q: '¿Qué pasa si no sé el nombre del material que necesito?', a: 'No se necesita. Cuéntanos qué quieres lograr con tu prenda y nosotros te decimos qué material aplica. Para eso está la asesoría.' },
]

function getTime() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function formatBotMessage(text) {
  let t = String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  t = t.replace(/\n\s*[-•]\s+/g, '\n• ')
  t = t.replace(/\s+-\s+(?=<strong>)/g, '\n• ')
  if (t.indexOf('\n• ') !== -1) {
    t = t.replace(/\s(¿[^¿]*\?)\s*$/, '\n\n$1')
    t = t.replace(/:\s*\n• /g, ':\n\n• ')
  }
  t = t.replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>')
  return t
}

export default function AsesoriaPage() {
  const navigate = useNavigate()

  const [opcion, setOpcion] = useState('rapida')

  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy el asistente de Russitex. Puedo ayudarte a encontrar los materiales correctos para tu proyecto. ¿Qué estás confeccionando?', time: 'ahora' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)

  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  const [form, setForm] = useState({ nombre: '', wa: '', prenda: '', logro: '', tela: '', comentarios: '' })
  const [image, setImage] = useState(null) // { dataUrl, name }
  const [dragOver, setDragOver] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  const chatMessagesRef = useRef(null)
  const fileInputRef = useRef(null)
  const paneRapidaRef = useRef(null)
  const panePersonalizadaRef = useRef(null)
  const prevOpcion = useRef(opcion)

  useEffect(() => {
    if (prevOpcion.current === opcion) return
    prevOpcion.current = opcion
    const ref = opcion === 'rapida' ? paneRapidaRef : panePersonalizadaRef
    const t = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    return () => clearTimeout(t)
  }, [opcion])

  // A diferencia del cambio de pestaña (que solo baja si realmente cambia de opción),
  // los botones "Iniciar asesoría rápida" / "Solicitar asesoría personalizada" siempre
  // deben bajar al panel, incluso si esa opción ya estaba activa.
  function goToOpcion(tipo) {
    setOpcion(tipo)
    prevOpcion.current = tipo
    const ref = tipo === 'rapida' ? paneRapidaRef : panePersonalizadaRef
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  useEffect(() => {
    if (chatMessagesRef.current) chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
  }, [messages, isTyping])

  async function sendMessage(text) {
    const value = (text ?? chatInput).trim()
    if (!value || isTyping) return
    setChatInput('')
    setShowSuggestions(false)
    const userMsg = { role: 'user', content: value, time: getTime() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setIsTyping(true)
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated.map(({ role, content }) => ({ role, content })) }),
      })
      if (res.status === 429) {
        const data = await res.json()
        setMessages((m) => [...m, { role: 'assistant', content: data.error, time: getTime() }])
        return
      }
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Lo siento, hubo un error. Intenta de nuevo.'
      setMessages((m) => [...m, { role: 'assistant', content: reply, time: getTime() }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Error de conexión. Por favor intenta de nuevo.', time: getTime() }])
    } finally {
      setIsTyping(false)
    }
  }

  function handleChatKeyDown(e) {
    if (e.key === 'Enter') sendMessage()
  }

  function showImagePreview(file) {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { alert('La imagen no debe superar 10 MB.'); return }
    const reader = new FileReader()
    reader.onload = (e) => setImage({ dataUrl: e.target.result, name: file.name })
    reader.readAsDataURL(file)
  }

  function removeImage(e) {
    e.stopPropagation()
    setImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function enviarFormulario() {
    const { nombre, wa, prenda, logro, tela, comentarios } = form
    if (!nombre.trim() || !wa.trim() || !prenda.trim() || !logro.trim()) {
      alert('Por favor completa los campos obligatorios: nombre, WhatsApp, qué confeccionas y qué necesitas lograr.')
      return
    }
    let msg = `Hola, me llamo ${nombre.trim()}.\nEstoy confeccionando: ${prenda.trim()}.\nNecesito lograr: ${logro.trim()}.`
    if (tela.trim()) msg += `\nTipo de tela: ${tela.trim()}.`
    if (image) msg += `\nImagen de referencia adjunta: ${image.name}.`
    if (comentarios.trim()) msg += `\nComentarios: ${comentarios.trim()}.`
    msg += `\n¿Pueden orientarme con los materiales?`
    window.open(`https://wa.me/573138909118?text=${encodeURIComponent(msg)}`, '_blank')
    setFormSubmitted(true)
  }

  return (
    <div className="asesoria-page">
      <SiteHeader activeLink="asesoria" />

      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>Inicio</a><span className="sep">/</span>
          <span className="current">Asesoría</span>
        </div>
      </div>

      <div className="page-banner">
        <h1 className="banner-title">Asesoría para tus proyectos<br />de <em>confección</em></h1>
        <p className="banner-sub">Te ayudamos a encontrar los materiales adecuados para tu prenda, arreglo o proyecto creativo.</p>
        <p className="banner-support">No necesitas saber el nombre exacto del material. Cuéntanos qué quieres hacer y te orientamos.</p>
      </div>

      <section className="intro-section">
        <div className="intro-grid">
          <div className="intro-left">
            <div className="s-label">Por qué te acompañamos</div>
            <h2>Comprar el material correcto<br className="br-desktop" />no tiene por qué ser <em>complicado</em></h2>
            <p>En Russitex sabemos que cada proyecto necesita materiales diferentes. Por eso te acompañamos para que elijas con más confianza, evites compras innecesarias y avances en tu confección sin perder tiempo.</p>
          </div>
          <div className="intro-benefits">
            <div className="benefit-item">
              <div className="benefit-icon" dangerouslySetInnerHTML={{ __html: ICON_BENEFIT_1 }} />
              <div className="benefit-text"><strong>Evita errores al comprar</strong><span>Te orientamos para elegir materiales que realmente sirvan para tu proyecto.</span></div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon" dangerouslySetInnerHTML={{ __html: ICON_BENEFIT_2 }} />
              <div className="benefit-text"><strong>Ahorra tiempo</strong><span>Encuentra más rápido lo que necesitas sin recorrer varias tiendas.</span></div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon" dangerouslySetInnerHTML={{ __html: ICON_BENEFIT_3 }} />
              <div className="benefit-text"><strong>Compra con confianza</strong><span>Recibe una recomendación inicial antes de tomar una decisión.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="opciones-section">
        <div className="opciones-header">
          <div className="s-label">Elige cómo quieres que te ayudemos</div>
          <h2>Dos formas de recibir asesoría</h2>
        </div>
        <div className="opciones-grid">
          <div className={`opcion-card rapida ${opcion === 'rapida' ? 'active' : ''}`} onClick={() => setOpcion('rapida')}>
            <span className="card-icon-big"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16.713,13.804c.384.393.381,1.02-.009,1.406-.074.073-1.84,1.79-4.704,1.79s-4.63-1.716-4.704-1.79c-.392-.389-.396-1.021-.007-1.414.39-.392,1.021-.396,1.415-.007.046.045,1.28,1.21,3.296,1.21s3.25-1.166,3.302-1.215c.396-.382,1.028-.374,1.411.02Zm-8.213-2.804c.828,0,1.5-.672,1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5,1.5.672,1.5,1.5,1.5Zm7-3c-.828,0-1.5.672-1.5,1.5s.672,1.5,1.5,1.5,1.5-.672,1.5-1.5-.672-1.5-1.5-1.5Zm8.5,4.34v6.66c0,2.757-2.243,5-5,5h-5.917C6.082,24,.471,19.208.029,12.854c-.24-3.476,1.027-6.878,3.479-9.333C5.962,1.065,9.371-.205,12.836.029c6.261.425,11.164,5.833,11.164,12.312Zm-2,0c0-5.431-4.085-9.962-9.299-10.316-.229-.016-.458-.023-.687-.023-2.656,0-5.209,1.048-7.091,2.933-2.043,2.046-3.1,4.883-2.898,7.782.372,5.38,5.023,9.285,11.058,9.285h5.917c1.654,0,3-1.346,3-3v-6.66Z" /></svg></span>
            <h3>Asesoría rápida</h3>
            <p>Responde unas preguntas básicas y recibe una orientación inicial sobre las categorías o materiales que podrían servirte.</p>
            <span className="opcion-hint">Ideal si no sabes por dónde empezar.</span>
            <button className="btn-opcion rapida" onClick={(e) => { e.stopPropagation(); goToOpcion('rapida') }}>Iniciar asesoría rápida →</button>
          </div>
          <div className={`opcion-card personalizada ${opcion === 'personalizada' ? 'active' : ''}`} onClick={() => setOpcion('personalizada')}>
            <span className="card-icon-big"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23,15h-.667c-.25,0-.498,.019-.745,.057l-7.046-5.284,1.688-1.616c.399-.382,.413-1.016,.031-1.414-.383-.399-1.017-.412-1.414-.031l-4.173,3.995c-.208,.208-.491,.315-.788,.29-.298-.024-.56-.175-.739-.425-.274-.38-.19-.975,.168-1.334l4.703-4.429c.891-.837,2.284-1.042,3.374-.495l2.316,1.158c.69,.345,1.464,.527,2.235,.527h1.056c.553,0,1-.447,1-1s-.447-1-1-1h-1.056c-.463,0-.928-.109-1.342-.316l-2.314-1.158c-1.824-.913-4.153-.574-5.641,.828l-.618,.582-.7-.638c-.919-.837-2.109-1.298-3.39-1.298-.771,0-1.54,.182-2.227,.525l-2.314,1.158c-.415,.207-.88,.316-1.343,.316H1c-.553,0-1,.447-1,1s.447,1,1,1h1.056c.771,0,1.545-.183,2.236-.527l2.316-1.158c1.022-.514,2.458-.375,3.374,.462l.587,.535-2.646,2.492c-1.073,1.072-1.244,2.767-.398,3.938,.52,.723,1.553,1.259,2.444,1.259,.793,0,1.554-.312,2.104-.863l1.006-.963,6.346,4.759c-.031,.022-6.198,4.646-6.198,4.646-.723,.562-1.732,.562-2.47-.011l-6.091-4.568c-.859-.645-1.925-1-3-1h-.667c-.553,0-1,.447-1,1s.447,1,1,1h.667c.645,0,1.284,.213,1.8,.6l6.077,4.558c.725,.564,1.594,.846,2.461,.846,.862,0,1.723-.279,2.437-.835l6.093-4.568c.515-.387,1.154-.6,1.799-.6h.667c.553,0,1-.447,1-1s-.447-1-1-1Z" /></svg></span>
            <h3>Asesoría personalizada</h3>
            <p>Cuéntanos con más detalle qué estás confeccionando y te contactaremos por WhatsApp para ayudarte a elegir mejor.</p>
            <span className="opcion-hint">Ideal para proyectos más específicos.</span>
            <button className="btn-opcion personalizada" onClick={(e) => { e.stopPropagation(); goToOpcion('personalizada') }}>Solicitar asesoría personalizada →</button>
          </div>
        </div>
      </section>

      <div className="content-section">
        <div className={`content-pane ${opcion === 'rapida' ? 'active' : ''}`} ref={paneRapidaRef}>
          <div className="chat-layout">
            <div className="chat-container">
              <div className="chat-header">
                <div className="chat-avatar" dangerouslySetInnerHTML={{ __html: ICON_BOT }} />
                <div className="chat-header-info">
                  <h3>Asistente Russitex</h3>
                  <p>Especialista en materiales para confección</p>
                </div>
                <div className="online-dot"></div>
              </div>
              <div className="chat-messages" ref={chatMessagesRef}>
                {messages.map((m, i) => (
                  <div className={`msg ${m.role === 'assistant' ? 'bot' : 'user'}`} key={i}>
                    <div className="msg-avatar" dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? ICON_BOT : ICON_USER }} />
                    <div>
                      {m.role === 'assistant'
                        ? <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: formatBotMessage(m.content) }} />
                        : <div className="msg-bubble">{m.content}</div>}
                      <div className="msg-time">{m.time}</div>
                    </div>
                  </div>
                ))}
                <div className={`typing-indicator ${isTyping ? 'visible' : ''}`}>
                  <div className="msg-avatar" style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--azul-claro)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }} dangerouslySetInnerHTML={{ __html: ICON_BOT }} />
                  <div className="typing-bubble"><div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div></div>
                </div>
              </div>
              {showSuggestions && (
                <div className="quick-suggestions">
                  {QUICK_SUGGESTIONS.map((q) => (
                    <button className="suggestion-chip" key={q} onClick={() => sendMessage(q)}>{q}</button>
                  ))}
                </div>
              )}
              <div className="chat-input-row">
                <input
                  type="text" className="chat-input" placeholder="Pregunta sobre materiales, precios o usos..." maxLength={300}
                  value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleChatKeyDown} disabled={isTyping}
                />
                <button className="chat-send" onClick={() => sendMessage()} disabled={isTyping || !chatInput.trim()} dangerouslySetInnerHTML={{ __html: ICON_CHAT_SEND }} />
              </div>
            </div>
            <div className="chat-info">
              <div className="chat-info-card">
                <h4><span dangerouslySetInnerHTML={{ __html: ICON_QUESTIONS }} />Puedes preguntar sobre</h4>
                <ul>
                  <li>Qué material usar según tu prenda</li>
                  <li>Tipos de entretelas y sus diferencias</li>
                  <li>Forros disponibles y precios</li>
                  <li>Hombreras, guatas y pretinas</li>
                  <li>Tizas, cierres y otros insumos</li>
                  <li>Unidades de venta y disponibilidad</li>
                </ul>
              </div>
              <div className="chat-info-card">
                <h4><span dangerouslySetInnerHTML={{ __html: ICON_CLOCK }} />Horario de atención</h4>
                <ul>
                  <li>Asistente IA: disponible 24/7</li>
                  <li>Asesores humanos: Lun–Vie 10–6 p.m.</li>
                  <li>Sábados: 10 a.m. – 5 p.m.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className={`content-pane ${opcion === 'personalizada' ? 'active' : ''}`} ref={panePersonalizadaRef}>
          <div className="form-layout">
            <div className="form-card">
              {!formSubmitted ? (
                <div>
                  <h2>Cuéntanos sobre tu proyecto</h2>
                  <p>Entre más detalles nos compartas, mejor podremos orientarte. Puedes contarnos qué prenda estás haciendo, qué tela usarás o subir una imagen de referencia.</p>
                  <div className="form-fields">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Nombre completo <span className="req">*</span></label>
                        <input type="text" className="form-input" placeholder="Tu nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">WhatsApp <span className="req">*</span></label>
                        <input type="tel" className="form-input" placeholder="Ej: 300 123 4567" value={form.wa} onChange={(e) => setForm((f) => ({ ...f, wa: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">¿Qué estás confeccionando? <span className="req">*</span></label>
                      <input type="text" className="form-input" placeholder="Ej: chaqueta, pantalón, vestido, camisa, uniforme, arreglo de prenda, proyecto universitario" value={form.prenda} onChange={(e) => setForm((f) => ({ ...f, prenda: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">¿Qué necesitas lograr? <span className="req">*</span></label>
                      <input type="text" className="form-input" placeholder="Ej: dar estructura, forrar una prenda, reforzar una zona, mejorar el acabado, marcar tela, cerrar una prenda" value={form.logro} onChange={(e) => setForm((f) => ({ ...f, logro: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo de tela <span className="opt">(si lo sabes)</span></label>
                      <input type="text" className="form-input" placeholder="Ej: liviana, gruesa, elástica, rígida, delicada" value={form.tela} onChange={(e) => setForm((f) => ({ ...f, tela: e.target.value }))} />
                      <span className="form-hint">No es obligatorio — si no sabes, cuéntanos y te ayudamos a identificarla.</span>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Imagen de referencia <span className="opt">(opcional)</span></label>
                      <div
                        className={`img-upload-area ${dragOver ? 'drag-over' : ''} ${image ? 'has-image' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); showImagePreview(e.dataTransfer.files[0]) }}
                      >
                        {!image ? (
                          <div className="img-upload-placeholder">
                            <div className="img-upload-icon">
                              <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <p className="img-upload-text"><strong>Arrastra tu imagen aquí</strong><br />o haz clic para seleccionarla</p>
                            <p className="img-upload-hint">Foto de la prenda, tela o referencia visual · PNG, JPG · máx. 10 MB</p>
                          </div>
                        ) : (
                          <div className="img-preview-wrap">
                            <img src={image.dataUrl} alt="Vista previa" />
                            <button className="img-remove-btn" onClick={removeImage}>✕</button>
                            <div className="img-preview-name">📎 {image.name}</div>
                          </div>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => showImagePreview(e.target.files[0])} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Comentarios adicionales <span className="opt">(opcional)</span></label>
                      <textarea className="form-textarea" placeholder="Cualquier detalle adicional que nos ayude a orientarte mejor..." value={form.comentarios} onChange={(e) => setForm((f) => ({ ...f, comentarios: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn-wa-submit" onClick={enviarFormulario}>
                    <span dangerouslySetInnerHTML={{ __html: ICON_WA_SUBMIT }} />
                    Enviar solicitud de asesoría
                  </button>
                  <p className="form-note">Al enviar, serás redirigido a WhatsApp con tu solicitud lista. Si adjuntaste imagen, podrás enviarla desde el chat.</p>
                </div>
              ) : (
                <div className="form-confirm visible">
                  <div className="confirm-circle">✅</div>
                  <h3>¡Listo! Recibimos tu solicitud</h3>
                  <p>Te contactaremos por WhatsApp para ayudarte a elegir los materiales adecuados para tu proyecto.</p>
                  <div className="confirm-actions">
                    <button className="btn-catalog" onClick={() => navigate('/')}>← Volver al catálogo</button>
                    <a href="https://wa.me/573138909118" className="btn-confirm-wa" target="_blank" rel="noopener noreferrer">💬 Escribir por WhatsApp</a>
                  </div>
                </div>
              )}
            </div>

            <div className="form-info">
              <div className="form-info-card">
                <h4>¿Cómo funciona?</h4>
                <div className="how-step"><div className="step-num">1</div><div className="step-text"><strong>Completa el formulario</strong><span>Cuéntanos tu proyecto con el mayor detalle posible.</span></div></div>
                <div className="how-step"><div className="step-num">2</div><div className="step-text"><strong>Te redirige a WhatsApp</strong><span>Al enviar, abre WhatsApp con tu solicitud ya escrita y lista para enviar.</span></div></div>
                <div className="how-step"><div className="step-num">3</div><div className="step-text"><strong>Recibe tu orientación</strong><span>Un asesor de Russitex te responde con los materiales exactos que necesitas.</span></div></div>
              </div>
              <div className="chat-info-card">
                <h4><span dangerouslySetInnerHTML={{ __html: ICON_CLOCK }} />Horario de atención</h4>
                <ul>
                  <li>Lunes a viernes: 10 a.m. – 6 p.m.</li>
                  <li>Sábados: 10 a.m. – 5 p.m.</li>
                  <li>Domingos y festivos: cerrado</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="faq-section">
        <div className="faq-header">
          <div className="s-label">Preguntas frecuentes</div>
          <h2>Todo sobre la asesoría</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <div className="faq-item" key={faq.q}>
              <button className={`faq-q ${openFaqIndex === i ? 'open' : ''}`} onClick={() => setOpenFaqIndex((v) => (v === i ? null : i))}>
                {faq.q}
                <div className="faq-icon">+</div>
              </button>
              <div className={`faq-a ${openFaqIndex === i ? 'open' : ''}`}>{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />

      <a href="https://wa.me/573138909118" className="wa-float" target="_blank" rel="noopener noreferrer">
        <span className="wa-float-tooltip">¿Tienes dudas? Escríbenos</span>
        <span dangerouslySetInnerHTML={{ __html: ICON_WA_FLOAT }} />
        <span className="wa-float-badge">1</span>
      </a>
    </div>
  )
}
