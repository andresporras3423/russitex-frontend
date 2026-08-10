import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useTiendaInfo } from '../hooks/useTiendaInfo'
import {
  ICON_BENEFIT_1, ICON_BENEFIT_2, ICON_BENEFIT_3,
  ICON_QUESTIONS, ICON_CLOCK, ICON_WA_SUBMIT,
} from './catalogIcons'
import './AsesoriaPage.css'

const API_URL = import.meta.env.VITE_API_URL
const WA_POR_DEFECTO = 'https://wa.me/573138909118'
const MAX_IMAGEN_MB = 10

const BENEFICIOS = [
  { icon: ICON_BENEFIT_1, titulo: 'Evita errores al comprar', texto: 'Te orientamos para elegir materiales que realmente sirvan para tu proyecto.' },
  { icon: ICON_BENEFIT_2, titulo: 'Ahorra tiempo', texto: 'Encuentra más rápido lo que necesitas sin recorrer varias tiendas.' },
  { icon: ICON_BENEFIT_3, titulo: 'Compra con confianza', texto: 'Recibe una recomendación inicial antes de tomar una decisión.' },
]

const PASOS = [
  { titulo: 'Completa el formulario', texto: 'Cuéntanos tu proyecto con el mayor detalle posible.' },
  { titulo: 'Te redirige a WhatsApp', texto: 'Al enviar, abre WhatsApp con tu solicitud ya escrita y lista para enviar.' },
  { titulo: 'Recibe tu orientación', texto: 'Un asesor de Russitex te responde con los materiales exactos que necesitas.' },
]

const FAQS = [
  {
    q: '¿La asesoría tiene costo?',
    a: 'No. Orientarte para que elijas bien tus materiales es parte de lo que hacemos en Russitex. La asesoría, tanto rápida como personalizada, es completamente gratuita.',
  },
  {
    q: '¿Me pueden decir exactamente qué material comprar?',
    a: 'Podemos orientarte según tu proyecto, pero algunos detalles dependen de la tela que uses, el acabado que buscas y la disponibilidad del producto en el momento. Por eso recomendamos contarnos el mayor detalle posible.',
  },
  {
    q: '¿Puedo recibir asesoría presencial?',
    a: 'Sí. También puedes visitarnos en nuestra tienda física en Bogotá durante el horario de atención y te atendemos directamente en el mostrador.',
  },
  {
    q: '¿Qué pasa si no sé el nombre del material que necesito?',
    a: 'No se necesita. Cuéntanos qué quieres lograr con tu prenda y nosotros te decimos qué material aplica. Para eso está la asesoría.',
  },
  {
    q: '¿La asesoría garantiza que mi proyecto quede perfecto?',
    a: 'Tanto la asesoría rápida como la personalizada están para orientarte, no para garantizar resultados. Toma nuestros consejos como la guía de alguien con experiencia: te ayudan a comprar con más confianza, pero como cada proyecto es distinto, la decisión final siempre es tuya.',
  },
]

const FORM_VACIO = { nombre: '', wa: '', prenda: '', logro: '', tela: '', comentarios: '' }

export default function AsesoriaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const tienda = useTiendaInfo()
  const waLink = tienda.whatsapp_link || WA_POR_DEFECTO

  const [form, setForm] = useState(FORM_VACIO)
  const [error, setError] = useState(null)
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  // Distingue "te faltó llenar algo" de "no pudimos enviarlo": solo en el
  // segundo caso ofrecemos WhatsApp como salida.
  const [falloEnvio, setFalloEnvio] = useState(false)
  const [imagenEnviada, setImagenEnviada] = useState(false)
  const [faqAbierta, setFaqAbierta] = useState(null)

  const [imagen, setImagen] = useState(null)   // { nombre, dataUrl }
  const [arrastrando, setArrastrando] = useState(false)
  const fileInputRef = useRef(null)
  const formRef = useRef(null)

  // El chat flotante enlaza a /asesoria#solicitar; al llegar, bajamos al formulario.
  useEffect(() => {
    if (location.hash === '#solicitar' && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location])

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    if (error) { setError(null); setFalloEnvio(false) }
  }

  function cargarImagen(file) {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > MAX_IMAGEN_MB * 1024 * 1024) {
      setError(`La imagen no debe superar ${MAX_IMAGEN_MB} MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => setImagen({ nombre: file.name, dataUrl: e.target.result })
    reader.readAsDataURL(file)
  }

  function quitarImagen(e) {
    e.stopPropagation()
    setImagen(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function enviarFormulario() {
    const { nombre, wa, prenda, logro, tela, comentarios } = form
    if (!nombre.trim() || !wa.trim() || !prenda.trim() || !logro.trim()) {
      setFalloEnvio(false)
      setError('Completa los campos obligatorios: nombre, WhatsApp, qué confeccionas y qué necesitas lograr.')
      return
    }

    setEnviando(true)
    setError(null)
    setFalloEnvio(false)
    try {
      const res = await fetch(`${API_URL}/api/asesoria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(), wa: wa.trim(), prenda: prenda.trim(),
          logro: logro.trim(), tela: tela.trim(), comentarios: comentarios.trim(),
          imagen: imagen ? { nombre: imagen.nombre, dataUrl: imagen.dataUrl } : null,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // El correo es el único canal del formulario, así que un fallo
        // significa que la solicitud NO llegó. No mostramos la pantalla de
        // confirmación: dejamos los datos escritos y ofrecemos WhatsApp.
        setFalloEnvio(true)
        setError(data.error || 'No pudimos enviar tu solicitud.')
        return
      }

      setImagenEnviada(Boolean(data.imagenAdjunta))
      setEnviado(true)
    } catch {
      setFalloEnvio(true)
      setError('No pudimos conectar con el servidor.')
    } finally {
      setEnviando(false)
    }
  }

  // Enlace de respaldo cuando el envío falla: lleva la solicitud ya escrita.
  function enlaceWhatsAppRespaldo() {
    const { nombre, prenda, logro, tela, comentarios } = form
    let msg = `Hola, me llamo ${nombre.trim()}.\nEstoy confeccionando: ${prenda.trim()}.\nNecesito lograr: ${logro.trim()}.`
    if (tela.trim()) msg += `\nTipo de tela: ${tela.trim()}.`
    if (imagen) msg += `\nTengo una imagen de referencia para enviarte.`
    if (comentarios.trim()) msg += `\nComentarios: ${comentarios.trim()}.`
    msg += `\n¿Pueden orientarme con los materiales?`
    return `${waLink}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="asesoria-page">
      <SiteHeader activeLink="asesoria" />

      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>Inicio</a>
          <span className="sep">/</span>
          <span className="current">Asesoría</span>
        </div>
      </div>

      <div className="page-banner">
        <h1 className="banner-title">Asesoría para tus proyectos de <em>confección</em></h1>
        <p className="banner-sub">Te ayudamos a encontrar los materiales adecuados para tu prenda, arreglo o proyecto creativo.</p>
        <p className="banner-support">No necesitas saber el nombre exacto del material. Cuéntanos qué quieres hacer y te orientamos.</p>
      </div>

      <div className="content-section" id="solicitar" ref={formRef}>
        <div className="form-layout">
          <div className="form-card">
            {!enviado ? (
              <div>
                <h2>Cuéntanos sobre tu proyecto</h2>
                <p>Entre más detalles nos compartas, mejor podremos orientarte. Puedes contarnos qué prenda estás haciendo, qué tela usarás o subir una imagen de referencia.</p>

                <div className="form-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="f-nombre">Nombre completo <span className="req">*</span></label>
                      <input id="f-nombre" type="text" className="form-input" placeholder="Tu nombre"
                        value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="f-wa">WhatsApp <span className="req">*</span></label>
                      <input id="f-wa" type="tel" className="form-input" placeholder="Ej: 300 123 4567"
                        value={form.wa} onChange={(e) => actualizar('wa', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="f-prenda">¿Qué estás confeccionando? <span className="req">*</span></label>
                    <input id="f-prenda" type="text" className="form-input"
                      placeholder="Ej: chaqueta, pantalón, vestido, camisa, uniforme, arreglo de prenda, proyecto universitario"
                      value={form.prenda} onChange={(e) => actualizar('prenda', e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="f-logro">¿Qué necesitas lograr? <span className="req">*</span></label>
                    <input id="f-logro" type="text" className="form-input"
                      placeholder="Ej: dar estructura, forrar una prenda, reforzar una zona, mejorar el acabado, marcar tela, cerrar una prenda"
                      value={form.logro} onChange={(e) => actualizar('logro', e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="f-tela">Tipo de tela <span className="opt">(si lo sabes)</span></label>
                    <input id="f-tela" type="text" className="form-input" placeholder="Ej: liviana, gruesa, elástica, rígida, delicada"
                      value={form.tela} onChange={(e) => actualizar('tela', e.target.value)} />
                    <span className="form-hint">No es obligatorio — si no sabes, cuéntanos y te ayudamos a identificarla.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Imagen de referencia <span className="opt">(opcional)</span></label>
                    <div
                      className={`img-upload-area ${arrastrando ? 'drag-over' : ''} ${imagen ? 'has-image' : ''}`}
                      onClick={() => { if (!imagen) fileInputRef.current?.click() }}
                      onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
                      onDragLeave={() => setArrastrando(false)}
                      onDrop={(e) => { e.preventDefault(); setArrastrando(false); cargarImagen(e.dataTransfer.files[0]) }}
                    >
                      {!imagen ? (
                        <div className="img-upload-placeholder">
                          <div className="img-upload-icon">
                            <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </div>
                          <p className="img-upload-text"><strong>Arrastra tu imagen aquí</strong><br />o haz clic para seleccionarla</p>
                          <p className="img-upload-hint">Foto de la prenda, tela o referencia visual · PNG, JPG · máx. {MAX_IMAGEN_MB} MB</p>
                        </div>
                      ) : (
                        <div className="img-preview-wrap">
                          <img src={imagen.dataUrl} alt="Vista previa" />
                          <button type="button" className="img-remove-btn" onClick={quitarImagen} aria-label="Quitar imagen">✕</button>
                          <div className="img-preview-name">📎 {imagen.nombre}</div>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => cargarImagen(e.target.files[0])} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="f-comentarios">Comentarios adicionales <span className="opt">(opcional)</span></label>
                    <textarea id="f-comentarios" className="form-textarea" placeholder="Cualquier detalle adicional que nos ayude a orientarte mejor..."
                      value={form.comentarios} onChange={(e) => actualizar('comentarios', e.target.value)} />
                  </div>
                </div>

                {error && (
                  <div className="form-error" role="alert">
                    {error}
                    {/* Si el envío falló, la solicitud no llegó a ningún lado.
                        Le damos una salida en vez de dejarlo sin respuesta. */}
                    {falloEnvio && (
                      <>
                        {' '}
                        <a href={enlaceWhatsAppRespaldo()} target="_blank" rel="noopener noreferrer">
                          Escríbenos por WhatsApp
                        </a>{' '}
                        y te atendemos de una vez.
                      </>
                    )}
                  </div>
                )}

                <button type="button" className="btn-wa-submit" onClick={enviarFormulario} disabled={enviando}>
                  <span dangerouslySetInnerHTML={{ __html: ICON_WA_SUBMIT }} />
                  {enviando ? 'Enviando…' : 'Enviar solicitud de asesoría'}
                </button>
                <p className="form-note">
                  Tu solicitud le llega por correo al almacén, con la imagen que hayas adjuntado.
                  Te respondemos por WhatsApp al número que nos dejaste.
                </p>
              </div>
            ) : (
              <div className="form-confirm visible">
                <div className="confirm-circle">✅</div>
                <h3>¡Listo! Recibimos tu solicitud</h3>
                <p>
                  Te contactaremos por WhatsApp para ayudarte a elegir los materiales adecuados para tu proyecto.
                  {imagenEnviada && ' Tu imagen de referencia llegó junto con la solicitud.'}
                </p>
                <div className="confirm-actions">
                  <button type="button" className="btn-catalog" onClick={() => navigate('/catalogo')}>← Volver al catálogo</button>
                  <a href={waLink} className="btn-confirm-wa" target="_blank" rel="noopener noreferrer">💬 Escribir por WhatsApp</a>
                </div>
              </div>
            )}
          </div>

          <div className="form-info">
            <div className="form-info-card">
              <h4>¿Cómo funciona?</h4>
              {PASOS.map((p, i) => (
                <div className="how-step" key={p.titulo}>
                  <div className="step-num">{i + 1}</div>
                  <div className="step-text"><strong>{p.titulo}</strong><span>{p.texto}</span></div>
                </div>
              ))}
            </div>

            <div className="chat-info-card">
              <h4><span dangerouslySetInnerHTML={{ __html: ICON_CLOCK }} />Horario de atención</h4>
              <ul>
                <li>Lunes a viernes: {tienda.horario_semana || '10 a.m. – 6 p.m.'}</li>
                <li>Sábados: {tienda.horario_sabado || '10 a.m. – 5 p.m.'}</li>
                <li>Domingos y festivos: {tienda.horario_domingo || 'cerrado'}</li>
              </ul>
            </div>

            <div className="chat-info-card">
              <h4><span dangerouslySetInnerHTML={{ __html: ICON_QUESTIONS }} />¿No sabes por dónde empezar?</h4>
              <p className="info-card-text">
                Habla con nuestro asistente. Obtén recomendaciones de materiales, información general del almacén
                y asesoría básica. Búscalo siempre en el botón azul de la esquina inferior derecha.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="intro-section">
        <div className="intro-grid">
          <div className="intro-left">
            <div className="s-label">Por qué te acompañamos</div>
            <h2>Comprar el material correcto<br className="br-desktop" />no tiene por qué ser <em>complicado</em></h2>
            <p>
              En Russitex sabemos que cada proyecto necesita materiales diferentes. Por eso te acompañamos para que
              elijas con más confianza, evites compras innecesarias y avances en tu confección sin perder tiempo.
            </p>
          </div>
          <div className="intro-benefits">
            {BENEFICIOS.map((b) => (
              <div className="benefit-item" key={b.titulo}>
                <div className="benefit-icon" dangerouslySetInnerHTML={{ __html: b.icon }} />
                <div className="benefit-text"><strong>{b.titulo}</strong><span>{b.texto}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-header">
          <div className="s-label">Preguntas frecuentes</div>
          <h2>Todo sobre la asesoría</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div className="faq-item" key={f.q}>
              <button
                type="button"
                className={`faq-q ${faqAbierta === i ? 'open' : ''}`}
                aria-expanded={faqAbierta === i}
                onClick={() => setFaqAbierta((abierta) => (abierta === i ? null : i))}
              >
                {f.q}
                <span className="faq-icon">+</span>
              </button>
              <div className={`faq-a ${faqAbierta === i ? 'open' : ''}`}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
