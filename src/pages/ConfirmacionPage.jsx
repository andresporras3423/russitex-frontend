import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useCart } from '../context/useCart'
import './ConfirmacionPage.css'

const API_URL = import.meta.env.VITE_API_URL
const money = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`
const BOGOTA_DANE = '11001000'

// Dirección del local para "recoger en la tienda" (la misma del checkout).
const DIRECCION_TIENDA = 'Calle 66 No 21-50, Bogotá'

// Estados del pedido (backend) -> vista de la maqueta.
const VISTA = { APROBADO: 'aprobado', PENDIENTE: 'pendiente', RECHAZADO: 'rechazado', ANULADO: 'rechazado', ERROR: 'error' }

const CHIP = {
  aprobado:  { texto: 'Pago aprobado · Wompi',    total: 'Total pagado' },
  pendiente: { texto: 'Pago en proceso · Wompi',  total: 'Total (en verificación)' },
  rechazado: { texto: 'Pago rechazado · Wompi',   total: 'Total (no cobrado)' },
  error:     { texto: 'Error en el pago · Wompi', total: 'Total (no cobrado)' },
}

// payment_method_type de Wompi -> texto para el cliente.
const METODO = {
  CARD: 'Tarjeta', PSE: 'PSE', NEQUI: 'Nequi', DAVIPLATA: 'Daviplata',
  BANCOLOMBIA_TRANSFER: 'Transferencia Bancolombia', BANCOLOMBIA_QR: 'QR Bancolombia',
  BANCOLOMBIA_COLLECT: 'Efectivo (Corresponsal Bancolombia)', PCOL: 'Puntos Colombia',
}
const textoMetodo = (m) => `${METODO[m] || 'Wompi'}${METODO[m] ? ' · Wompi' : ''}`

function textoFecha(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// "BOGOTÁ D.C." -> "Bogotá D.C.", "SAN JOSÉ DEL GUAVIARE" -> "San José del Guaviare".
const nombreCiudad = (c) => String(c || '').toLowerCase()
  .replace(/(^|[\s(])\S/g, (x) => x.toUpperCase())
  .replace(/\s(De|Del|La|Las|Los|El|Y)(?=\s)/g, (x) => x.toLowerCase())
  .replace(/\bD\.c\./g, 'D.C.')

// "Medellín, Antioquia"; en Bogotá ciudad y departamento se llaman igual.
function lugar(ciudad, departamento) {
  const c = nombreCiudad(ciudad)
  const d = nombreCiudad(departamento)
  return [c, d && d !== c ? d : null].filter(Boolean).join(', ')
}

// "por metro" -> "metro"; plural sencillo para "3 metros", "1 caja".
const unidadBase = (u) => (u || '').replace(/^(venta\s+por|por)\s+/i, '').trim().toLowerCase()
function textoCantidad(cantidad, unidad) {
  const base = unidadBase(unidad)
  if (!base) return `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'}`
  if (cantidad === 1) return `1 ${base}`
  return `${cantidad} ${/[aeiou]$/.test(base) ? `${base}s` : `${base}es`}`
}

// Lo que el checkout guardó en esta pestaña antes de ir a Wompi (contacto y
// fotos). Solo se usa si es del mismo pedido.
function leerCheckoutLocal() {
  try { return JSON.parse(sessionStorage.getItem('russitex_ultimo_checkout') || 'null') } catch { return null }
}

// ── Íconos (los de la maqueta) ──
const IcoCheck = () => <svg viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
const IcoReloj = () => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 7.5V12l3 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
const IcoX = () => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
const IcoAlerta = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm0,22A10,10,0,1,1,22,12,10.011,10.011,0,0,1,12,22Z" /><path d="M12,5a1,1,0,0,0-1,1v8a1,1,0,0,0,2,0V6A1,1,0,0,0,12,5Z" /><rect x="11" y="17" width="2" height="2" rx="1" /></svg>
const IcoDoc = () => <svg viewBox="0 0 24 24"><path d="M19.949,5.536,16.465,2.05A6.958,6.958,0,0,0,11.515,0H7A5.006,5.006,0,0,0,2,5V19a5.006,5.006,0,0,0,5,5H17a5.006,5.006,0,0,0,5-5V10.485A6.951,6.951,0,0,0,19.949,5.536ZM18.535,6.95A4.983,4.983,0,0,1,19.316,8H15a1,1,0,0,1-1-1V2.684a5.01,5.01,0,0,1,1.051.78ZM20,19a3,3,0,0,1-3,3H7a3,3,0,0,1-3-3V5A3,3,0,0,1,7,2h4.515c.164,0,.323.032.485.047V7a3,3,0,0,0,3,3h4.953c.015.162.047.32.047.485Z" /></svg>
const IcoCaja = () => <svg viewBox="0 0 24 24"><path d="M9,14h6a1,1,0,0,0,0-2H9a1,1,0,0,0,0,2Z" /><path d="M19,0H5A5.006,5.006,0,0,0,0,5V6A3,3,0,0,0,1,8.234V19a5.006,5.006,0,0,0,5,5H18a5.006,5.006,0,0,0,5-5V8.234A3,3,0,0,0,24,6V5A5.006,5.006,0,0,0,19,0ZM2,5A3,3,0,0,1,5,2H19a3,3,0,0,1,3,3V6a1,1,0,0,1-1,1H3A1,1,0,0,1,2,6ZM21,19a3,3,0,0,1-3,3H6a3,3,0,0,1-3-3V9H21Z" /></svg>
const IcoBandera = () => <svg viewBox="0 0 24 24"><path d="M20.358,7.5l3.237-4.297c.459-.609,.533-1.413,.192-2.096s-1.026-1.107-1.79-1.107H4C1.794,0,0,1.794,0,4V23c0,.553,.448,1,1,1s1-.447,1-1V15H21.998c.764,0,1.449-.425,1.79-1.107s.267-1.486-.192-2.096l-3.237-4.297ZM2,13V4c0-1.103,.897-2,2-2H21.998l-3.69,4.898c-.268,.356-.268,.847,0,1.203l3.69,4.898H2Z" /></svg>

const HERO = {
  aprobado:  { ico: <IcoCheck />,  ceja: 'Pedido',     titulo: <>¡Gracias por tu <em>compra!</em></>,
    texto: 'Recibimos tu pago y estamos preparando tu pedido. Te enviamos el resumen a tu correo.' },
  pendiente: { ico: <IcoReloj />,  ceja: 'Referencia', titulo: <>Tu pago está <em>en proceso</em></>,
    texto: 'Estamos esperando la confirmación de tu medio de pago. Apenas se confirme, te avisamos por correo y preparamos tu pedido.' },
  rechazado: { ico: <IcoX />,      ceja: 'Referencia', titulo: <>Tu pago <em>no pudo procesarse</em></>,
    texto: 'No te preocupes: no se realizó ningún cobro y tu carrito sigue guardado. Puedes intentarlo de nuevo cuando quieras.' },
  error:     { ico: <IcoAlerta />, ceja: 'Referencia', titulo: <>Tuvimos un <em>problema técnico</em></>,
    texto: 'No pudimos procesar el pago por un error de la pasarela, no por un rechazo de tu banco. No se realizó ningún cobro y tu carrito sigue guardado.' },
}

const NOTA = {
  pendiente: { clase: 'warn', ico: <IcoReloj />, texto: <>Medios como el <strong>efectivo (Corresponsal Bancolombia)</strong>, la <strong>transferencia con Bancolombia</strong> o el <strong>PSE</strong> pueden tardar unos minutos en confirmarse. <strong>Tu pedido queda reservado</strong> mientras tanto.</> },
  rechazado: { clase: 'err', ico: <IcoAlerta />, texto: <><strong>No se realizó ningún cobro</strong> a tu medio de pago. Tu carrito sigue guardado, así que no perderás lo que ya habías elegido.</> },
  error:     { clase: 'neutral', ico: <IcoAlerta />, texto: <>Fue un <strong>problema técnico</strong> al conectar con Wompi, no un rechazo de tu medio de pago. <strong>No se hizo ningún cobro.</strong> Suele resolverse intentando de nuevo en unos minutos.</> },
}

function pasos(vista, { tienda, conGuia }) {
  const tiempos = 'Llega en 1–3 días hábiles en Bogotá y en aproximadamente 2 a 5 días hábiles al resto del país.'
  if (vista === 'aprobado') {
    return [
      ['Confirmación por correo', `Te enviamos al correo el resumen de tu pedido${conGuia ? ' y el número de guía para rastrearlo' : ''}.`],
      ['Preparación del pedido', `Nuestro equipo alista y verifica cada material antes de ${tienda ? 'entregarlo' : 'enviarlo'}.`],
      tienda
        ? ['Recoges en la tienda', `Te avisamos por WhatsApp cuando esté listo para recogerlo en ${DIRECCION_TIENDA}.`]
        : ['Envío a tu dirección', `La transportadora te escribe al correo con cada avance del envío. ${tiempos}`],
      ['¿Tienes preguntas?', 'Escríbenos por WhatsApp y te respondemos de inmediato.'],
    ]
  }
  if (vista === 'pendiente') {
    return [
      ['Verificamos tu pago', 'Estamos a la espera de que tu medio de pago confirme la transacción.'],
      ['Te avisamos por correo', 'Apenas se confirme, recibirás un correo con la confirmación de tu pedido.'],
      ['Preparamos y enviamos', tienda ? 'Alistamos tus materiales y te avisamos por WhatsApp cuando puedas recogerlos.' : `Alistamos tus materiales y los enviamos. ${tiempos}`],
    ]
  }
  if (vista === 'rechazado') {
    return [
      ['Reintenta con otro medio', 'Puedes pagar con otra tarjeta, PSE, Nequi o Daviplata desde el checkout. Si vuelve a fallar, espera unos minutos o consulta con tu entidad financiera.'],
      ['Revisa tus datos', 'Verifica que el número, la fecha y el cupo de tu tarjeta o cuenta estén correctos.'],
      ['Contáctanos', 'Si sigue fallando, escríbenos por WhatsApp y te ayudamos a completar tu compra.'],
    ]
  }
  return [
    ['Reintenta en unos minutos', 'La mayoría de estos errores son temporales y se resuelven al volver a intentar.'],
    ['Prueba otro medio de pago', 'Si sigue fallando, intenta con otra tarjeta, PSE, Nequi o Daviplata.'],
    ['Escríbenos si continúa', 'Si el problema persiste, contáctanos por WhatsApp y te ayudamos a completar tu compra.'],
  ]
}

export default function ConfirmacionPage() {
  const { vaciar } = useCart()
  const [cargando, setCargando] = useState(true)
  const [pedido, setPedido] = useState(null)
  const [sinRef, setSinRef] = useState(false)
  const [local] = useState(leerCheckoutLocal)

  useEffect(() => {
    let activo = true
    async function consultar() {
      // Wompi agrega ?id=<transaccionId> a la URL de regreso. Si está, se
      // verifica el pago DIRECTO con Wompi (no depende del webhook).
      const txId = new URLSearchParams(window.location.search).get('id')
      let ref = null
      try { ref = localStorage.getItem('russitex_ultima_ref') } catch { /* sin storage */ }

      if (!txId && !ref) { if (activo) { setSinRef(true); setCargando(false) } return }

      // 1) Verificación directa con Wompi (fuente inmediata y confiable).
      if (txId) {
        try {
          const r = await fetch(`${API_URL}/api/pagos/verificar/${encodeURIComponent(txId)}`)
          if (r.ok) {
            const d = await r.json()
            if (!activo) return
            setPedido(d)
            if (d.estado === 'APROBADO') { vaciar() }
            if (d.estado && d.estado !== 'PENDIENTE') { setCargando(false); return }
          }
        } catch { /* si falla, se cae al plan por referencia */ }
      }

      // 2) Respaldo por referencia (por si Wompi no trajo id o quedó PENDIENTE):
      //    consulta el estado guardado, reintentando por si el webhook llega.
      if (ref) {
        for (let intento = 0; intento < 3 && activo; intento++) {
          try {
            const r = await fetch(`${API_URL}/api/pagos/estado/${encodeURIComponent(ref)}`)
            if (r.ok) {
              const d = await r.json()
              if (!activo) return
              setPedido(d)
              if (d.estado === 'APROBADO') { vaciar(); break }
              if (d.estado && d.estado !== 'PENDIENTE') break
            }
          } catch { /* reintenta */ }
          await new Promise((res) => setTimeout(res, 3000))
        }
      }
      if (activo) setCargando(false)
    }
    consultar()
    return () => { activo = false }
  }, [vaciar])

  const vista = pedido ? VISTA[pedido.estado] : null

  return (
    <div className="confirmacion-page">
      <SiteHeader activeLink="catalogo" />

      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <Link to="/">Inicio</Link><span className="sep">/</span>
          <Link to="/carrito">Carrito</Link><span className="sep">/</span>
          <span className="current">Confirmación</span>
        </div>
      </div>

      <section className="conf-wrap">
        {cargando || sinRef || !vista ? (
          <div className="conf-simple">
            <div className={`conf-ico ${cargando ? 'pendiente' : 'aprobado'}`}>{cargando ? <IcoReloj /> : <IcoCheck />}</div>
            <div>
              <h1>{cargando ? 'Confirmando tu pago…' : 'Gracias por tu compra'}</h1>
              <p>{cargando
                ? 'Un momento, estamos verificando el estado de tu pedido.'
                : 'Si completaste el pago, te llegará la confirmación por correo. Si tienes dudas, escríbenos por WhatsApp.'}</p>
              {!cargando && <div className="conf-actions"><Link className="btn-primary" to="/catalogo">Seguir comprando</Link></div>}
            </div>
          </div>
        ) : (
          <Detalle pedido={pedido} vista={vista} local={local?.referencia === pedido.referencia ? local : null} />
        )}
      </section>

      <SiteFooter />
    </div>
  )
}

function Detalle({ pedido, vista, local }) {
  const hero = HERO[vista]
  const nota = NOTA[vista]
  const tienda = pedido.modalidad === 'tienda'
  const envio = pedido.envio || {}
  const contacto = local?.contacto
  const fecha = textoFecha(pedido.creadoEn)

  // Productos: los del checkout local traen foto y unidad; si no hay, los
  // del backend.
  const items = local?.items?.length ? local.items : (pedido.productos || [])
  const subtotal = items.reduce((s, i) => s + (Number(i.precio) || 0) * (Number(i.cantidad) || 0), 0)
  const etiquetaEnvio = tienda ? 'Recoger en tienda' : envio.ciudad ? `Envío a ${nombreCiudad(envio.ciudad)}` : 'Envío'
  const valorEnvio = tienda || envio.costo === 0 ? 'Gratis' : money(envio.costo)
  const estadoPago = { aprobado: ['ok', 'Aprobado'], pendiente: ['wait', 'En proceso'], rechazado: ['bad', 'Rechazado'], error: ['err', 'Error'] }[vista]
  const tiempo = tienda
    ? 'Te avisamos por WhatsApp cuando esté listo'
    : envio.codigoDane === BOGOTA_DANE ? '1–3 días hábiles en Bogotá' : '2–5 días hábiles'

  return (
    <div className="conf-layout">
      <div className="conf-left">
        <div className="conf-hero">
          <div className={`conf-ico ${vista}`}>{hero.ico}</div>
          <div>
            <div className={`conf-eyebrow ${vista}`}>{hero.ceja} #{pedido.referencia}</div>
            <h1>{hero.titulo}</h1>
            <p>{hero.texto}</p>
          </div>
        </div>

        {nota && (
          <div className={`nota-box ${nota.clase}`}>{nota.ico}<div>{nota.texto}</div></div>
        )}

        <div className="conf-card">
          <div className="conf-card-title"><IcoDoc /> {vista === 'aprobado' ? 'Detalle del pedido' : 'Detalle del intento'}</div>
          <Fila label={vista === 'aprobado' ? 'Número de pedido' : 'Referencia'} valor={`#${pedido.referencia}`} />
          {fecha && <Fila label="Fecha" valor={fecha} />}
          {pedido.metodoPago && <Fila label="Método de pago" valor={textoMetodo(pedido.metodoPago)} />}
          <Fila label="Estado del pago" valor={estadoPago[1]} clase={estadoPago[0]} />
        </div>

        {vista === 'aprobado' && (
          <div className="conf-card">
            <div className="conf-card-title"><IcoCaja /> {tienda ? 'Información de entrega' : 'Información de envío'}</div>
            {contacto?.nombre && <Fila label="Nombre" valor={contacto.nombre} />}
            {contacto?.telefono && <Fila label="Teléfono" valor={contacto.telefono} />}
            {tienda ? (
              <Fila label="Entrega" valor={<>Recoger en la tienda<br />{DIRECCION_TIENDA}</>} />
            ) : (
              <Fila label="Dirección" valor={contacto?.direccion
                ? <>{contacto.direccion}<br />{lugar(contacto.ciudad, contacto.departamento)}</>
                : lugar(envio.ciudad, envio.departamento)} />
            )}
            <Fila label="Tiempo estimado" valor={tiempo} />
            {!tienda && envio.transportadora && <Fila label="Transportadora" valor={envio.transportadora} />}
            {pedido.guia && (
              <Fila label="Número de guía" valor={pedido.guia.rastreoUrl
                ? <a href={pedido.guia.rastreoUrl} target="_blank" rel="noopener noreferrer">{pedido.guia.numeroGuia}</a>
                : pedido.guia.numeroGuia} />
            )}
            {contacto?.correo && <Fila label="Correo de confirmación" valor={contacto.correo} />}
          </div>
        )}

        <div className="conf-card">
          <div className="conf-card-title"><IcoBandera /> {vista === 'aprobado' || vista === 'pendiente' ? '¿Qué sigue ahora?' : '¿Qué puedes hacer?'}</div>
          <div className="next-steps">
            {pasos(vista, { tienda, conGuia: Boolean(pedido.guia) }).map(([titulo, texto], i) => (
              <div className="next-step" key={titulo}>
                <div className="next-step-num">{i + 1}</div>
                <div className="next-step-text"><strong>{titulo}</strong><span>{texto}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="resumen">
        <h2>Resumen de tu compra</h2>
        {items.map((i, n) => (
          <div className="res-item" key={`${i.productoId}-${i.variante || ''}-${n}`}>
            <div className="res-thumb">
              <img src={i.imagen || 'https://placehold.co/48x48?text=R'} alt="" />
              <span className="badge">{i.cantidad}</span>
            </div>
            <div>
              <div className="res-item-nom">{i.nombre}{i.variante ? ` · ${i.variante}` : ''}</div>
              <div className="res-item-det">{textoCantidad(i.cantidad, i.unidad)}</div>
            </div>
            <span className="res-item-val">{money(i.precio * i.cantidad)}</span>
          </div>
        ))}

        <div className="res-fila"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="res-fila"><span>{etiquetaEnvio}</span><span>{valorEnvio}</span></div>

        <div className="res-total">
          <span className="res-total-label">{CHIP[vista].total}</span>
          <span className="res-total-valor">{money(pedido.total)}</span>
        </div>

        <div className={`pago-chip ${vista}`}><span className="dot" /><span>{CHIP[vista].texto}</span></div>
      </aside>

      <div className="conf-cta">
        <div className="conf-actions">
          {vista === 'aprobado' || vista === 'pendiente' ? (
            <>
              <Link className="btn-primary" to="/catalogo">Seguir comprando</Link>
              <Link className="btn-ghost" to="/">Volver al inicio</Link>
            </>
          ) : (
            <>
              <Link className={`btn-primary ${vista === 'rechazado' ? 'ladrillo' : ''}`} to="/checkout">Reintentar el pago</Link>
              <Link className="btn-ghost" to="/carrito">Volver al carrito</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Fila({ label, valor, clase = '' }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${clase}`}>{valor}</span>
    </div>
  )
}
