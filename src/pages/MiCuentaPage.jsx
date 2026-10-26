import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useAuth } from '../context/useAuth'
import { useProductos } from '../hooks/useProductos'
import { digitoVerificacion, REGIMENES } from '../lib/nit'
import './MiCuentaPage.css'
import { nombreLugar } from '../lib/lugares'
import { fechaCorta, fechaHora } from '../lib/fechas'

// Portada de la maqueta version2/russitex-mi-cuenta.html. Por ahora tiene
// Resumen, Mis pedidos y el detalle de cada pedido; direcciones y datos de
// la cuenta llegan después.

const API_URL = import.meta.env.VITE_API_URL
const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`
const moneyCorto = (n) => {
  const v = Number(n) || 0
  if (v >= 1e6) return `$${(v / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`
  if (v >= 1e3) return `$${Math.round(v / 1e3)}k`
  return money(v)
}

const METODO = {
  CARD: 'Tarjeta', PSE: 'PSE', NEQUI: 'Nequi', DAVIPLATA: 'Daviplata',
  BANCOLOMBIA_TRANSFER: 'Transferencia Bancolombia', BANCOLOMBIA_QR: 'QR Bancolombia',
  BANCOLOMBIA_COLLECT: 'Efectivo (Corresponsal Bancolombia)', PCOL: 'Puntos Colombia',
}

// "BOGOTÁ D.C." -> "Bogotá D.C."
// Nombre propio para la lista DANE (viene en mayúsculas): lib/lugares.js
const nombreCiudad = nombreLugar
function lugar(ciudad, departamento) {
  const c = nombreCiudad(ciudad)
  const d = nombreCiudad(departamento)
  return [c, d && d !== c ? d : null].filter(Boolean).join(', ')
}

const unidadBase = (u) => (u || '').replace(/^(venta\s+por|por)\s+/i, '').trim().toLowerCase()
function textoCantidad(cantidad, unidad) {
  const base = unidadBase(unidad)
  if (!base) return String(cantidad)
  // Como en la maqueta: "3 m", y por unidad solo el número.
  const corta = { metro: 'm', metros: 'm', unidad: '', unidades: '' }[base]
  if (corta === '') return String(cantidad)
  return corta ? `${cantidad} ${corta}` : `${cantidad} ${cantidad === 1 ? base : (/[aeiou]$/.test(base) ? `${base}s` : `${base}es`)}`
}

const iniciales = (u) => {
  const partes = (u?.nombre?.trim() || u?.email || '').split(/\s+/).filter(Boolean)
  return (partes.length >= 2 ? partes[0][0] + partes[1][0] : (partes[0] || '').slice(0, 2)).toUpperCase()
}
const primerNombre = (u) => (u?.nombre?.trim() || u?.email || '').split(/[\s@]+/)[0]

// ── Íconos ──
// Menú lateral: los de línea del diseño (russitex-mi-cuenta.html de version2).
const SiResumen = () => <svg className="si-icon" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /></svg>
const SiPedidos = () => <svg className="si-icon" fill="none" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" /></svg>
const SiDireccion = () => <svg className="si-icon" fill="none" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" /></svg>
const SiUsuario = () => <svg className="si-icon" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
const SiSalir = () => <svg className="si-icon" fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
// Ventana de cerrar sesión.
const IcoSalirModal = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 17l5-5-5-5-1.4 1.4 2.6 2.6H9v2h8.2l-2.6 2.6L16 17ZM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5Z" /></svg>
const IcoPedidos = () => <svg className="si-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19,0H5A5.006,5.006,0,0,0,0,5V19a5.006,5.006,0,0,0,5,5H19a5.006,5.006,0,0,0,5-5V5A5.006,5.006,0,0,0,19,0ZM5,2H19a3,3,0,0,1,3,3V6H2V5A3,3,0,0,1,5,2ZM19,22H5a3,3,0,0,1-3-3V8H22V19A3,3,0,0,1,19,22Z" /><path d="M16,11H8a1,1,0,0,0,0,2h8a1,1,0,0,0,0-2Z" /></svg>
const IcoCamion = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19,5H17V4a3,3,0,0,0-3-3H3A3,3,0,0,0,0,4V19H2.041A3.465,3.465,0,0,0,2,19.5a3.5,3.5,0,0,0,7,0,3.465,3.465,0,0,0-.041-.5h6.082a3.465,3.465,0,0,0-.041.5,3.5,3.5,0,0,0,7,0,3.465,3.465,0,0,0-.041-.5H24V10A5.006,5.006,0,0,0,19,5Zm0,2a3,3,0,0,1,3,3v1H17V7ZM7,19.5a1.5,1.5,0,0,1-3,0,1.418,1.418,0,0,1,.093-.5H6.907A1.418,1.418,0,0,1,7,19.5ZM15,17H2V4A1,1,0,0,1,3,3H14a1,1,0,0,1,1,1Zm5,2.5a1.5,1.5,0,0,1-3,0,1.41,1.41,0,0,1,.093-.5h2.814A1.41,1.41,0,0,1,20,19.5ZM22,17H17V13h5Z" /></svg>

// Iconos del diseño version2 (iconos/ de almacen-russitex).
const IcoSaludo = () => <svg className="title-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.04,.719c.156-.53,.713-.833,1.241-.679,1.843,.54,3.114,1.809,3.677,3.671,.16,.529-.14,1.087-.668,1.247-.096,.029-.194,.043-.29,.043-.429,0-.826-.279-.957-.711-.373-1.234-1.111-1.974-2.323-2.329-.53-.155-.834-.711-.679-1.241Zm10.96,7.265v6.17c0,2.381-.969,4.708-2.658,6.386l-.815,.81c-1.721,1.709-4.104,2.65-6.526,2.65-2.454-.021-4.725-1.006-6.436-2.766L.842,14.316c-.964-.965-1.119-2.506-.35-3.576,.238-.33,.541-.599,.885-.793l-.344-.344C.058,8.628-.097,7.086,.674,6.017c.352-.489,.846-.841,1.405-1.018-.127-.71,.005-1.451,.434-2.047,.474-.658,1.205-1.073,2.006-1.137,.711-.055,1.398,.177,1.942,.622,.051-.094,.099-.19,.162-.278,.474-.658,1.205-1.072,2.005-1.137,.809-.064,1.586,.224,2.154,.792l7.218,7.218v-.939c0-1.517,1.076-2.835,2.504-3.067,.879-.141,1.768,.103,2.439,.674,.672,.571,1.057,1.404,1.057,2.286Zm-2,0c0-.294-.128-.572-.353-.762-.228-.193-.521-.271-.823-.224-.462,.075-.825,.555-.825,1.093v3.354c0,.404-.244,.769-.617,.924-.375,.154-.804,.069-1.09-.217L9.368,3.227c-.153-.153-.364-.227-.579-.212-.126,.01-.365,.064-.543,.312-.2,.278-.134,.719,.15,1.003l5.051,5.051c.391,.391,.391,1.023,0,1.414-.195,.195-.451,.293-.707,.293s-.512-.098-.707-.293L5.258,4.021c-.152-.152-.359-.229-.579-.212-.126,.01-.365,.064-.543,.312-.2,.278-.134,.718,.15,1.003l6.71,6.71c.391,.391,.391,1.023,0,1.414-.195,.195-.451,.293-.707,.293s-.512-.098-.707-.293L3.419,7.085c-.152-.152-.372-.23-.578-.212-.126,.01-.365,.064-.544,.313-.2,.278-.134,.718,.15,1.003l6.097,6.097c.391,.391,.391,1.023,0,1.414s-1.023,.391-1.414,0l-3.891-3.891c-.152-.152-.364-.228-.579-.212-.126,.01-.365,.064-.544,.312-.2,.278-.134,.719,.151,1.003l6.732,6.929c1.335,1.374,3.125,2.14,5.041,2.157,1.885,.003,3.718-.717,5.078-2.066l.815-.81c1.314-1.305,2.067-3.115,2.067-4.967V7.984ZM4.281,21.04c-1.212-.355-1.951-1.095-2.323-2.329-.16-.529-.718-.825-1.247-.668-.529,.16-.828,.718-.668,1.247,.562,1.862,1.834,3.131,3.677,3.671,.094,.027,.188,.041,.281,.041,.433,0,.832-.283,.959-.72,.155-.53-.149-1.085-.679-1.241Z" /></svg>
const IcoBolsa = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21,6H18A6,6,0,0,0,6,6H3A3,3,0,0,0,0,9V19a5.006,5.006,0,0,0,5,5H19a5.006,5.006,0,0,0,5-5V9A3,3,0,0,0,21,6ZM12,2a4,4,0,0,1,4,4H8A4,4,0,0,1,12,2ZM22,19a3,3,0,0,1-3,3H5a3,3,0,0,1-3-3V9A1,1,0,0,1,3,8H6v2a1,1,0,0,0,2,0V8h8v2a1,1,0,0,0,2,0V8h3a1,1,0,0,1,1,1Z" /></svg>
const IcoFactura = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16,23c0,.552-.447,1-1,1H6c-2.757,0-5-2.243-5-5V5C1,2.243,3.243,0,6,0h4.515c1.869,0,3.627,.728,4.95,2.05l3.484,3.486c.271,.271,.523,.568,.748,.883,.321,.449,.217,1.074-.232,1.395-.449,.32-1.075,.217-1.395-.233-.161-.225-.341-.438-.534-.63l-3.485-3.486c-.318-.318-.671-.587-1.051-.805V7c0,.551,.448,1,1,1h3c.553,0,1,.448,1,1s-.447,1-1,1h-3c-1.654,0-3-1.346-3-3V2.023c-.16-.015-.322-.023-.485-.023H6c-1.654,0-3,1.346-3,3v14c0,1.654,1.346,3,3,3H15c.553,0,1,.448,1,1Zm5.685-6.733l-3.041-.507c-.373-.062-.644-.382-.644-.76,0-.551,.448-1,1-1h2.268c.356,0,.688,.192,.867,.5,.275,.478,.885,.641,1.366,.365,.478-.277,.642-.888,.364-1.366-.534-.925-1.53-1.5-2.598-1.5h-.268v-1c0-.552-.447-1-1-1s-1,.448-1,1v1c-1.654,0-3,1.346-3,3,0,1.36,.974,2.51,2.315,2.733l3.041,.507c.373,.062,.644,.382,.644,.76,0,.551-.448,1-1,1h-2.268c-.356,0-.688-.192-.867-.5-.275-.479-.886-.642-1.366-.365-.478,.277-.642,.888-.364,1.366,.534,.925,1.53,1.499,2.598,1.499h.268v1c0,.552,.447,1,1,1s1-.448,1-1v-1c1.654,0,3-1.346,3-3,0-1.36-.974-2.51-2.315-2.733Zm-14.185-1.267h5.5c.553,0,1-.448,1-1s-.447-1-1-1H7.5c-1.378,0-2.5,1.122-2.5,2.5v2c0,1.378,1.122,2.5,2.5,2.5h5.5c.553,0,1-.448,1-1s-.447-1-1-1H7.5c-.276,0-.5-.224-.5-.5v-2c0-.276,.224-.5,.5-.5Zm-1.5-4h2c.552,0,1-.448,1-1s-.448-1-1-1h-2c-.552,0-1,.448-1,1s.448,1,1,1Zm0-4h2c.552,0,1-.448,1-1s-.448-1-1-1h-2c-.552,0-1,.448-1,1s.448,1,1,1Z" /></svg>
const IcoCarrito = () => <svg viewBox="0 0 24 24"><path d="M22.713,4.077A2.993,2.993,0,0,0,20.41,3H4.242L4.2,2.649A3,3,0,0,0,1.222,0H1A1,1,0,0,0,1,2h.222a1,1,0,0,1,.993.883l1.376,11.7A5,5,0,0,0,8.557,19H19a1,1,0,0,0,0-2H8.557a3,3,0,0,1-2.82-2h11.92a5,5,0,0,0,4.921-4.113l.785-4.354A2.994,2.994,0,0,0,22.713,4.077ZM21.4,6.178l-.786,4.354A3,3,0,0,1,17.657,13H5.419L4.478,5H20.41A1,1,0,0,1,21.4,6.178Z" /><circle cx="7" cy="22" r="2" /><circle cx="17" cy="22" r="2" /></svg>

// Llamada autenticada al backend. Devuelve { ok, status, datos }.
async function api(token, ruta, { method = 'GET', body } = {}) {
  try {
    const r = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    return { ok: r.ok, status: r.status, datos: await r.json().catch(() => ({})) }
  } catch {
    return { ok: false, status: 0, datos: { error: 'No hay conexión con el servidor. Intenta de nuevo.' } }
  }
}

// Municipios con código DANE (la misma lista del checkout), una sola vez.
let promesaCiudades = null
function cargarCiudades() {
  if (!promesaCiudades) {
    promesaCiudades = fetch(`${API_URL}/api/envios/ciudades`)
      .then((r) => r.json()).then((d) => d.ciudades || [])
      .catch(() => { promesaCiudades = null; return [] })
  }
  return promesaCiudades
}

// Pide los pedidos de la cuenta. Devuelve { pedidos, error?, noVerificado?, sesionVencida? }.
async function pedirPedidos(token) {
  try {
    const r = await fetch(`${API_URL}/api/pedidos/mios`, { headers: { Authorization: `Bearer ${token}` } })
    const d = await r.json().catch(() => ({}))
    if (r.status === 403 && d.codigo === 'EMAIL_NO_VERIFICADO') return { pedidos: [], noVerificado: true }
    if (r.status === 401) return { pedidos: [], sesionVencida: true }
    if (!r.ok) throw new Error(d.error)
    return { pedidos: d.pedidos || [] }
  } catch {
    return { pedidos: [], error: 'No pudimos cargar tus pedidos. Intenta de nuevo en un momento.' }
  }
}

function Estado({ e }) {
  return <span className={`estado ${e.color}`}><span className="dot" />{e.texto}</span>
}

export default function MiCuentaPage() {
  const { user, token, loading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  // /mi-cuenta, /mi-cuenta/pedidos o /mi-cuenta/pedidos/<referencia>
  const resto = useParams()['*'] || ''
  const referencia = resto.startsWith('pedidos/') ? decodeURIComponent(resto.slice('pedidos/'.length)) : null
  const productos = useProductos()

  const [pedidos, setPedidos] = useState(null)   // null = cargando
  const [error, setError] = useState('')
  const [noVerificado, setNoVerificado] = useState(false)
  const [confirmarSalida, setConfirmarSalida] = useState(false)

  // Aplica el resultado de pedirPedidos al estado.
  const aplicar = useCallback((r) => {
    if (r.sesionVencida) { logout(); return }
    setNoVerificado(Boolean(r.noVerificado))
    setError(r.error || '')
    setPedidos(r.pedidos)
  }, [logout])

  useEffect(() => {
    if (!token) return
    let activo = true
    pedirPedidos(token).then((r) => { if (activo) aplicar(r) })
    return () => { activo = false }
  }, [token, aplicar])

  const reintentar = () => { setError(''); setPedidos(null); pedirPedidos(token).then(aplicar) }

  // Sin sesión: al login, y de vuelta aquí después de entrar.
  if (!loading && !user) {
    try { sessionStorage.setItem('russitex_tras_login', location.pathname) } catch { /* sin storage */ }
    return <Navigate to="/login" replace />
  }

  const vista = confirmarSalida ? 'salir'
    : referencia ? 'pedido'
      : resto.startsWith('pedidos') ? 'pedidos'
        : resto === 'direcciones' ? 'direcciones'
          : resto === 'detalles' ? 'detalles' : 'resumen'
  const TITULO = { direcciones: 'Mis direcciones', detalles: 'Detalles de la cuenta' }
  const ir = (ruta) => { setConfirmarSalida(false); navigate(ruta); window.scrollTo(0, 0) }

  // Foto y unidad de cada producto, del catálogo.
  const porId = new Map(productos.map((p) => [String(p.id), p]))

  return (
    <div className="micuenta-page">
      <SiteHeader />
      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <Link to="/">Inicio</Link><span className="sep">/</span>
          {vista === 'resumen' ? <span className="current">Mi cuenta</span> : <Link to="/mi-cuenta">Mi cuenta</Link>}
          {TITULO[vista] && <><span className="sep">/</span><span className="current">{TITULO[vista]}</span></>}
          {(vista === 'pedidos' || vista === 'pedido') && <><span className="sep">/</span>
            {vista === 'pedidos' ? <span className="current">Mis pedidos</span> : <Link to="/mi-cuenta/pedidos">Mis pedidos</Link>}</>}
          {vista === 'pedido' && <><span className="sep">/</span><span className="current">#{referencia}</span></>}
        </div>
      </div>

      <div className="cuenta-layout">
        <aside className="cuenta-sidebar">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{iniciales(user)}</div>
            <div>
              <div className="sidebar-name">{user?.nombre || primerNombre(user)}</div>
              <div className="sidebar-email">{user?.email}</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            <button className={`sidebar-item ${vista === 'resumen' ? 'active' : ''}`} onClick={() => ir('/mi-cuenta')}><SiResumen /> Resumen</button>
            <button className={`sidebar-item ${vista === 'pedidos' || vista === 'pedido' ? 'active' : ''}`} onClick={() => ir('/mi-cuenta/pedidos')}><SiPedidos /> Mis pedidos</button>
            <button className={`sidebar-item ${vista === 'direcciones' ? 'active' : ''}`} onClick={() => ir('/mi-cuenta/direcciones')}><SiDireccion /> Mis direcciones</button>
            <button className={`sidebar-item ${vista === 'detalles' ? 'active' : ''}`} onClick={() => ir('/mi-cuenta/detalles')}><SiUsuario /> Detalles de la cuenta</button>
            <button className={`sidebar-item logout ${vista === 'salir' ? 'active' : ''}`} onClick={() => setConfirmarSalida(true)}><SiSalir /> Cerrar sesión</button>
          </nav>
        </aside>

        {/* key: al cambiar de sección se vuelve a montar y repite la entrada */}
        <div className="cuenta-content" key={vista}>
          {vista === 'salir' ? (
            <Salir onConfirmar={async () => { await logout(); navigate('/') }} onCancelar={() => setConfirmarSalida(false)} />
          ) : vista === 'direcciones' ? (
            token && <Direcciones token={token} />
          ) : vista === 'detalles' ? (
            token && <Detalles token={token} />
          ) : loading || pedidos === null ? (
            <p className="cargando">Cargando tus pedidos…</p>
          ) : noVerificado ? (
            <div className="empty-state">
              <div className="empty-ico"><IcoPedidos /></div>
              <h3>Confirma tu correo</h3>
              <p>Para mostrarte tus pedidos necesitamos saber que <strong>{user?.email}</strong> es tuyo. Abre el enlace que te enviamos al crear la cuenta y vuelve a entrar.</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <h3>Algo salió mal</h3>
              <p>{error}</p>
              <button className="btn-primary" onClick={reintentar}>Reintentar</button>
            </div>
          ) : vista === 'resumen' ? (
            <Resumen user={user} pedidos={pedidos} onVer={(ref) => ir(`/mi-cuenta/pedidos/${ref}`)} onTodos={() => ir('/mi-cuenta/pedidos')} />
          ) : vista === 'pedidos' ? (
            <ListaPedidos pedidos={pedidos} onVer={(ref) => ir(`/mi-cuenta/pedidos/${ref}`)} />
          ) : (
            <DetallePedido pedido={pedidos.find((p) => p.referencia === referencia)} porId={porId} onVolver={() => ir('/mi-cuenta/pedidos')} />
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}

function Resumen({ user, pedidos, onVer, onTodos }) {
  const pagados = pedidos.filter((p) => !['pago_pendiente', 'rechazado', 'cancelado', 'reembolsado'].includes(p.estadoCliente.clave))
  const enCamino = pedidos.filter((p) => p.estadoCliente.clave === 'enviado').length
  return (
    <>
      <h1 className="sec-title">¡Hola, {primerNombre(user)}! <IcoSaludo /></h1>
      <p className="sec-sub">Desde aquí puedes gestionar tus pedidos, direcciones y datos de cuenta.</p>
      <div className="stats-row">
        <div className="stat-card"><div className="stat-ico p"><IcoBolsa /></div><div><div className="stat-num">{pagados.length}</div><div className="stat-lbl">Pedidos realizados</div></div></div>
        <div className="stat-card"><div className="stat-ico g"><IcoFactura /></div><div><div className="stat-num">{moneyCorto(pagados.reduce((s, p) => s + (Number(p.total) || 0), 0))}</div><div className="stat-lbl">Total comprado</div></div></div>
        <div className="stat-card"><div className="stat-ico d"><IcoCamion /></div><div><div className="stat-num">{enCamino}</div><div className="stat-lbl">{enCamino === 1 ? 'Envío en camino' : 'Envíos en camino'}</div></div></div>
      </div>
      <div className="recientes-card">
        <div className="rc-header">
          <div className="rc-title">Pedidos recientes</div>
          {pedidos.length > 0 && <button className="rc-link" onClick={onTodos}>Ver todos →</button>}
        </div>
        {pedidos.length === 0 ? (
          <div className="empty-mini">Todavía no tienes pedidos. <Link to="/catalogo">Explora el catálogo</Link></div>
        ) : (
          <>
            <div className="tabla-head"><span>Pedido</span><span>Fecha</span><span>Estado</span><span>Total</span><span /></div>
            {pedidos.slice(0, 3).map((p) => (
              <div className="pedido-fila" key={p.referencia} role="button" tabIndex={0} onClick={() => onVer(p.referencia)} onKeyDown={(e) => e.key === 'Enter' && onVer(p.referencia)}>
                <span className="p-num">#{p.referencia}</span>
                <span className="p-fecha">{fechaCorta(p.creadoEn)}</span>
                <Estado e={p.estadoCliente} />
                <span className="p-total">{money(p.total)}</span>
                <span className="p-ver" aria-hidden="true">Ver</span>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}

function ListaPedidos({ pedidos, onVer }) {
  return (
    <>
      <h1 className="sec-title">Mis pedidos</h1>
      <p className="sec-sub">Historial completo de tus compras en Russitex. Haz clic en un pedido para ver el detalle.</p>
      {pedidos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-ico"><IcoCarrito /></div>
          <h3>Aún no has hecho ningún pedido</h3>
          <p>Cuando compres, tus pedidos aparecerán aquí con su estado, seguimiento y detalle.</p>
          <Link className="btn-primary" to="/catalogo">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="recientes-card">
          <div className="tabla-head cols5"><span>Pedido</span><span>Fecha</span><span>Productos</span><span>Estado</span><span>Total</span><span /></div>
          {pedidos.map((p) => (
            <div className="pedido-fila cols5" key={p.referencia} role="button" tabIndex={0} onClick={() => onVer(p.referencia)} onKeyDown={(e) => e.key === 'Enter' && onVer(p.referencia)}>
              <span className="p-num">#{p.referencia}</span>
              <span className="p-fecha">{fechaCorta(p.creadoEn)}</span>
              <span className="p-items">
                {p.productos.slice(0, 3).map((i, n) => <span key={n}>{i.nombre}{i.variante ? ` · ${i.variante}` : ''} × {i.cantidad}<br /></span>)}
                {p.productos.length > 3 && <span className="p-mas">y {p.productos.length - 3} más</span>}
              </span>
              <Estado e={p.estadoCliente} />
              <span className="p-total">{money(p.total)}</span>
              <span className="p-ver" aria-hidden="true">Ver</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function DetallePedido({ pedido, porId, onVolver }) {
  if (!pedido) {
    return (
      <div className="empty-state">
        <h3>No encontramos ese pedido</h3>
        <p>Puede que se haya hecho con otro correo. Revisa la lista de tus pedidos.</p>
        <button className="btn-primary" onClick={onVolver}>Ver mis pedidos</button>
      </div>
    )
  }
  const e = pedido.estadoCliente
  const tienda = pedido.modalidad === 'tienda'
  const envio = pedido.envio || {}
  const subtotal = pedido.productos.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const chip = { verde: 'Pagado', azul: 'Pagado', ambar: e.clave === 'pago_pendiente' ? 'Pago en proceso' : 'Pagado', rojo: e.clave === 'cancelado' ? (e.pago || 'Anulado') : 'No cobrado', gris: 'Reembolsado' }[e.color]

  return (
    <>
      <button className="volver-link" onClick={onVolver}>← Volver a mis pedidos</button>
      <div className="ped-head">
        <h1>{pedido.referencia.startsWith('PEDIDO-') ? pedido.referencia : `Pedido #${pedido.referencia}`}</h1>
        <Estado e={e} />
      </div>
      <div className="ped-fecha">{fechaHora(pedido.creadoEn)}</div>

      {e.envio && <div className={`envio-banner ${e.color}`}><span className="dot" />Estado del envío: {e.envio}</div>}
      {pedido.cancelacion && (
        <div className={`envio-banner ${e.color}`}><span className="dot" />
          Cancelamos este pedido: {pedido.cancelacion.motivo}{' '}
          <Link to={`/pedido-cancelado?ref=${encodeURIComponent(pedido.referencia)}`}>Ver el reembolso</Link>
        </div>
      )}

      <div className="ped-card">
        <h3>Datos del pedido</h3>
        <div className="pd-row"><span className="l">Fecha</span><span className="v">{fechaHora(pedido.creadoEn)}</span></div>
        <div className="pd-row"><span className="l">Estado</span><span className="v"><Estado e={e} /></span></div>
        <div className="pd-row"><span className="l">Pago</span><span className="v">{e.pago}</span></div>
        {pedido.metodoPago && <div className="pd-row"><span className="l">Método de pago</span><span className="v">{METODO[pedido.metodoPago] || pedido.metodoPago} · Wompi</span></div>}
        <div className="pd-row"><span className="l">Entrega</span><span className="v">{tienda ? 'Recoger en la tienda' : `Domicilio en ${nombreCiudad(envio.ciudad) || 'Colombia'}`}</span></div>
        {!tienda && (pedido.direccion || envio.ciudad) && (
          <div className="pd-row"><span className="l">Dirección de envío</span><span className="v">{pedido.direccion}{pedido.direccion && <br />}{lugar(envio.ciudad, envio.departamento)}</span></div>
        )}
        {!tienda && envio.transportadora && <div className="pd-row"><span className="l">Transportadora</span><span className="v">{envio.transportadora}</span></div>}
        {pedido.guia && (
          <div className="pd-row"><span className="l">Número de guía</span><span className="v">
            {pedido.guia.rastreoUrl ? <a href={pedido.guia.rastreoUrl} target="_blank" rel="noopener noreferrer">{pedido.guia.numeroGuia}</a> : pedido.guia.numeroGuia}
          </span></div>
        )}
      </div>

      <div className="ped-card">
        <h3>Productos</h3>
        <div className="prod-head"><span>Producto</span><span className="h-precio">Precio</span><span className="h-cant">Cant.</span><span>Total</span></div>
        {pedido.productos.map((i, n) => {
          const p = porId.get(String(i.productoId))
          return (
            <div className="prod-fila" key={n}>
              <div className="prod-info">
                <img src={p?.imagen || 'https://placehold.co/48x48?text=R'} alt="" />
                <div className="prod-nom">
                  {i.nombre}
                  {i.variante && <span className="det">{i.variante}</span>}
                  <span className="meta">{textoCantidad(i.cantidad, p?.unidad)} · {money(i.precio)} c/u</span>
                </div>
              </div>
              <span className="c c-precio">{money(i.precio)}</span>
              <span className="c c-cant">{textoCantidad(i.cantidad, p?.unidad)}</span>
              <span className="c c-total strong">{money(i.precio * i.cantidad)}</span>
            </div>
          )
        })}
      </div>

      <div className="ped-card">
        <h3>Resumen</h3>
        <div className="pd-row"><span className="l">Subtotal</span><span className="v">{money(subtotal)}</span></div>
        {pedido.descuento?.monto > 0 && (
          <div className="pd-row"><span className="l">Descuento {pedido.descuento.porcentaje}%</span><span className="v desc">-{money(pedido.descuento.monto)}</span></div>
        )}
        <div className="pd-row"><span className="l">Envío</span><span className="v">{tienda || envio.costo === 0 ? 'Gratis' : money(envio.costo)}</span></div>
        <div className="pd-total"><span className="l">Total</span><span className="v">{money(pedido.total)}</span></div>
        <div className={`pd-chip ${e.color}`}><span className="dot" />{chip} · Wompi</div>
      </div>
    </>
  )
}

// ── Ventana genérica (overlay + caja), cierra con Escape o clic afuera ──
function Modal({ titulo, onCerrar, children, pie }) {
  useEffect(() => {
    const alTeclear = (e) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCerrar])
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar() }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="modal-header">
          <h3 className="modal-title">{titulo}</h3>
          <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">{pie}</div>
      </div>
    </div>
  )
}

// ── Mis direcciones ──
function Direcciones({ token }) {
  const [direcciones, setDirecciones] = useState(null)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(null)   // null | 'nueva' | dirección
  const [borrando, setBorrando] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    let activo = true
    api(token, '/api/cuenta/direcciones').then((r) => {
      if (!activo) return
      if (r.ok) setDirecciones(r.datos.direcciones)
      else { setError(r.datos.error || 'No se pudieron cargar tus direcciones.'); setDirecciones([]) }
    })
    return () => { activo = false }
  }, [token])

  // Las acciones devuelven la lista actualizada.
  async function accion(ruta, opciones) {
    setOcupado(true)
    const r = await api(token, ruta, opciones)
    setOcupado(false)
    if (r.ok) { setDirecciones(r.datos.direcciones); setError('') }
    return r
  }

  async function eliminar() {
    const r = await accion(`/api/cuenta/direcciones/${borrando.id}`, { method: 'DELETE' })
    if (!r.ok) setError(r.datos.error || 'No se pudo eliminar la dirección.')
    setBorrando(null)
  }

  return (
    <>
      <h1 className="sec-title">Mis direcciones</h1>
      <p className="sec-sub">Guarda tus direcciones de envío y elígelas en el checkout sin volver a escribirlas.</p>
      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {direcciones === null ? <p className="cargando">Cargando tus direcciones…</p> : (
        <div className="dirs-grid">
          {direcciones.length === 0 && (
            <div className="empty-mini" style={{ gridColumn: '1 / -1' }}>Aún no tienes direcciones guardadas. Agrega una para agilizar tus envíos.</div>
          )}
          {direcciones.map((d) => (
            <div className={`dir-card ${d.principal ? 'principal' : ''}`} key={d.id}>
              {d.principal && <span className="dir-badge">Principal</span>}
              <div className="dir-name">{d.destinatario}</div>
              <div className="dir-addr">
                {d.direccion}{d.indicaciones && <><br />{d.indicaciones}</>}<br />{lugar(d.ciudad, d.departamento)}
              </div>
              <div className="dir-btns">
                <button className="btn-dir" onClick={() => setEditando(d)}>Editar</button>
                {!d.principal && <button className="btn-dir" disabled={ocupado} onClick={() => accion(`/api/cuenta/direcciones/${d.id}/principal`, { method: 'POST' })}>Usar como principal</button>}
                <button className="btn-dir del" onClick={() => setBorrando(d)}>Eliminar</button>
              </div>
            </div>
          ))}
          {direcciones.length < 10 && (
            <button className="dir-add" onClick={() => setEditando('nueva')}>
              <div className="dir-add-plus">＋</div>
              <div className="dir-add-label">Agregar nueva dirección</div>
            </button>
          )}
        </div>
      )}

      {editando && (
        <DireccionModal
          inicial={editando === 'nueva' ? null : editando}
          onCerrar={() => setEditando(null)}
          onGuardar={async (datos) => {
            const r = editando === 'nueva'
              ? await accion('/api/cuenta/direcciones', { method: 'POST', body: datos })
              : await accion(`/api/cuenta/direcciones/${editando.id}`, { method: 'PUT', body: datos })
            if (r.ok) setEditando(null)
            return r.ok ? null : (r.datos.error || 'No se pudo guardar la dirección.')
          }}
        />
      )}

      {borrando && (
        <Modal titulo="Eliminar dirección" onCerrar={() => setBorrando(null)}
          pie={<>
            <button className="modal-btn-cancel" onClick={() => setBorrando(null)}>Cancelar</button>
            <button className="modal-btn-save del" disabled={ocupado} onClick={eliminar}>Sí, eliminar</button>
          </>}>
          <p>¿Seguro que quieres eliminar la dirección de <strong>{borrando.destinatario}</strong> ({borrando.direccion})? Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </>
  )
}

function DireccionModal({ inicial, onCerrar, onGuardar }) {
  const [ciudades, setCiudades] = useState([])
  const [f, setF] = useState({
    destinatario: inicial?.destinatario || '',
    direccion: inicial?.direccion || '',
    indicaciones: inicial?.indicaciones || '',
    departamento: inicial?.departamento || '',
    codigoDane: inicial?.codigoDane || '',
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let activo = true
    cargarCiudades().then((c) => { if (activo) setCiudades(c) })
    return () => { activo = false }
  }, [])

  const departamentos = [...new Set(ciudades.map((c) => c.departamento))].sort((a, b) => a.localeCompare(b, 'es'))
  const municipiosDepto = ciudades.filter((c) => c.departamento === f.departamento).sort((a, b) => a.ciudad.localeCompare(b.ciudad, 'es'))
  const set = (campo) => (e) => setF((x) => ({ ...x, [campo]: e.target.value }))

  async function guardar() {
    setError('')
    if (f.destinatario.trim().length < 2) return setError('Escribe el nombre de quien recibe.')
    if (f.direccion.trim().length < 5) return setError('Escribe la dirección completa.')
    if (!f.codigoDane) return setError('Elige el departamento y el municipio.')
    setGuardando(true)
    const msg = await onGuardar({ destinatario: f.destinatario, direccion: f.direccion, indicaciones: f.indicaciones, codigoDane: f.codigoDane })
    setGuardando(false)
    if (msg) setError(msg)
  }

  return (
    <Modal titulo={inicial ? 'Editar dirección' : 'Agregar nueva dirección'} onCerrar={onCerrar}
      pie={<>
        <button className="modal-btn-cancel" onClick={onCerrar}>Cancelar</button>
        <button className="modal-btn-save" disabled={guardando} onClick={guardar}>{guardando ? 'Guardando…' : inicial ? 'Guardar cambios' : 'Agregar dirección'}</button>
      </>}>
      <div className="fg"><label className="fl" htmlFor="d-dest">Nombre del destinatario</label>
        <input id="d-dest" className="fi" placeholder="Nombre completo" value={f.destinatario} onChange={set('destinatario')} maxLength={120} /></div>
      <div className="fg"><label className="fl" htmlFor="d-depto">Departamento</label>
        <select id="d-depto" className="fi" value={f.departamento} disabled={!ciudades.length}
          onChange={(e) => setF((x) => ({ ...x, departamento: e.target.value, codigoDane: '' }))}>
          <option value="">{ciudades.length ? 'Selecciona el departamento' : 'Cargando…'}</option>
          {departamentos.map((d) => <option key={d} value={d}>{nombreCiudad(d)}</option>)}
        </select></div>
      <div className="fg"><label className="fl" htmlFor="d-mun">Ciudad</label>
        <select id="d-mun" className="fi" value={f.codigoDane} disabled={!f.departamento} onChange={set('codigoDane')}>
          <option value="">{f.departamento ? 'Selecciona la ciudad' : 'Elige primero el departamento'}</option>
          {municipiosDepto.map((m) => <option key={m.dane} value={m.dane}>{nombreCiudad(m.ciudad)}</option>)}
        </select></div>
      <div className="fg"><label className="fl" htmlFor="d-dir">Dirección</label>
        <input id="d-dir" className="fi" placeholder="Calle, número, apartamento" value={f.direccion} onChange={set('direccion')} maxLength={200} /></div>
      <div className="fg"><label className="fl" htmlFor="d-ind">Indicaciones adicionales <span>(opcional)</span></label>
        <input id="d-ind" className="fi" placeholder="Ej: torre B, timbre 3" value={f.indicaciones} onChange={set('indicaciones')} maxLength={200} /></div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  )
}

// ── Detalles de la cuenta ──
// Tipos de documento de la persona (código guardado -> etiqueta). PEP = PPT.
const TIPOS_DOC = { CC: 'C.C.', CE: 'C.E.', PP: 'Pasaporte', PEP: 'PPT', TI: 'T.I.' }
const PROVEEDOR = { google: 'Google', facebook: 'Facebook' }
// 1020345678 -> "1.020.345.678" (solo si es un número).
const conPuntos = (n) => (/^\d+$/.test(String(n || '')) ? Number(n).toLocaleString('es-CO') : String(n || ''))

function Detalles({ token }) {
  const { refrescarPerfil } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ventana, setVentana] = useState(null)   // null | 'info' | 'empresa' | 'pwd'

  useEffect(() => {
    let activo = true
    api(token, '/api/cuenta/perfil').then((r) => {
      if (!activo) return
      if (r.ok) setPerfil(r.datos)
      else setError(r.datos.error || 'No se pudo cargar tu información.')
    })
    return () => { activo = false }
  }, [token])

  if (error) return <div className="empty-state"><h3>Algo salió mal</h3><p>{error}</p></div>
  if (!perfil) return <p className="cargando">Cargando tu información…</p>

  const social = perfil.proveedores.filter((p) => p !== 'email').map((p) => PROVEEDOR[p] || p)
  const fila = (etiqueta, v) => (
    <div className="info-fila"><span className="info-lbl">{etiqueta}</span>
      {v ? <span className="info-val">{v}</span> : <span className="info-val vacio">Sin completar</span>}</div>
  )
  const e = perfil.empresa

  async function guardarPerfil(body, mensaje) {
    const r = await api(token, '/api/cuenta/perfil', { method: 'PUT', body })
    if (!r.ok) return r.datos.error || 'No se pudieron guardar los cambios.'
    setPerfil(r.datos); setVentana(null); setAviso(mensaje)
    return null
  }

  return (
    <>
      <h1 className="sec-title">Detalles de la cuenta</h1>
      <p className="sec-sub">Revisa y actualiza tu información personal{perfil.tieneContrasena ? ' y tu contraseña' : ''}.</p>
      {aviso && <div className="aviso-ok">{aviso}</div>}
      <div className="detalles-grid">
        <div className="det-card" style={{ gridArea: 'info' }}>
          <div className="det-card-header">
            <h3>Información personal</h3>
            <button className="btn-edit-info" onClick={() => { setAviso(''); setVentana('info') }}>Editar</button>
          </div>
          {fila('Nombres', perfil.nombres)}
          {fila('Apellidos', perfil.apellidos)}
          {fila('Documento', perfil.documento && `${TIPOS_DOC[perfil.tipoDocumento] || perfil.tipoDocumento} ${conPuntos(perfil.documento)}`)}
          {fila('Celular', perfil.telefono)}
          {fila('Correo', perfil.email)}
          <p>Con estos datos llenamos el checkout por ti. Para cambiar el correo, escríbenos por WhatsApp.</p>
        </div>

        <div className="det-card" style={{ gridArea: 'empresa' }}>
          <div className="det-card-header">
            <h3>Datos de empresa</h3>
            <button className="btn-edit-info" onClick={() => { setAviso(''); setVentana('empresa') }}>Editar</button>
          </div>
          {fila('Razón social', e?.razonSocial)}
          {fila('NIT', e?.nit && `${conPuntos(e.nit)}-${digitoVerificacion(e.nit)}`)}
          {fila('Resp. de IVA', REGIMENES[e?.regimen])}
          {fila('Celular', e?.celular)}
          {fila('Correo', e?.correo)}
          <p>Completa estos datos solo si quieres recibir la factura a nombre de una empresa. Así los tendrás listos al pagar.</p>
        </div>

        <div className="det-card" style={{ gridArea: 'pwd' }}>
          <div className="det-card-header">
            <h3>Contraseña</h3>
            {perfil.tieneContrasena && <button className="btn-edit-info" onClick={() => { setAviso(''); setVentana('pwd') }}>Cambiar</button>}
          </div>
          {perfil.tieneContrasena ? (
            <>
              <div className="info-fila"><span className="info-lbl">Contraseña</span><span className="info-val">••••••••••</span></div>
              <p>Para cambiarla te pediremos la actual, para confirmar que eres tú.</p>
            </>
          ) : (
            <p>Entras con <strong>{social.join(' o ') || 'tu proveedor'}</strong>, así que tu cuenta no tiene una contraseña propia en Russitex. La seguridad la maneja {social[0] || 'ese servicio'}.</p>
          )}
        </div>
      </div>

      {ventana === 'info' && (
        <InfoModal perfil={perfil} onCerrar={() => setVentana(null)} onGuardar={async (datos) => {
          const msg = await guardarPerfil(datos, 'Tus datos quedaron guardados.')
          if (!msg) refrescarPerfil?.()   // para que el encabezado muestre el nombre nuevo
          return msg
        }} />
      )}
      {ventana === 'empresa' && (
        <EmpresaModal empresa={e} onCerrar={() => setVentana(null)} onGuardar={(empresa) =>
          guardarPerfil({ empresa }, empresa ? 'Los datos de empresa quedaron guardados.' : 'Quitamos los datos de empresa.')} />
      )}
      {ventana === 'pwd' && (
        <PwdModal onCerrar={() => setVentana(null)} onGuardar={async (datos) => {
          const r = await api(token, '/api/cuenta/contrasena', { method: 'POST', body: datos })
          if (!r.ok) return r.datos.error || 'No se pudo cambiar la contraseña.'
          setVentana(null); setAviso('Tu contraseña quedó actualizada.')
          return null
        }} />
      )}
    </>
  )
}

function InfoModal({ perfil, onCerrar, onGuardar }) {
  const [f, setF] = useState({
    nombres: perfil.nombres || '', apellidos: perfil.apellidos || '', telefono: perfil.telefono || '',
    tipoDocumento: TIPOS_DOC[perfil.tipoDocumento] ? perfil.tipoDocumento : 'CC', documento: perfil.documento || '',
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const set = (campo) => (e) => setF((x) => ({ ...x, [campo]: e.target.value }))

  async function guardar() {
    setError('')
    if (f.nombres.trim().length < 2) return setError('Escribe tus nombres.')
    setGuardando(true)
    const msg = await onGuardar({ ...f, nombres: f.nombres.trim(), apellidos: f.apellidos.trim(), documento: f.documento.replace(/\./g, '').trim() })
    setGuardando(false)
    if (msg) setError(msg)
  }

  return (
    <Modal titulo="Editar información personal" onCerrar={onCerrar}
      pie={<>
        <button className="modal-btn-cancel" onClick={onCerrar}>Cancelar</button>
        <button className="modal-btn-save" disabled={guardando} onClick={guardar}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
      </>}>
      <div className="fila-par">
        <div className="fg"><label className="fl" htmlFor="i-nom">Nombres</label>
          <input id="i-nom" className="fi" value={f.nombres} onChange={set('nombres')} maxLength={80} autoComplete="given-name" /></div>
        <div className="fg"><label className="fl" htmlFor="i-ape">Apellidos</label>
          <input id="i-ape" className="fi" value={f.apellidos} onChange={set('apellidos')} maxLength={80} autoComplete="family-name" /></div>
      </div>
      <div className="fg"><label className="fl" htmlFor="i-doc">Documento</label>
        <div className="fila-2">
          <select className="fi" aria-label="Tipo de documento" value={f.tipoDocumento} onChange={set('tipoDocumento')}>
            {Object.entries(TIPOS_DOC).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          <input id="i-doc" className="fi" placeholder="Ej: 1020345678" value={f.documento} onChange={set('documento')} maxLength={20} />
        </div></div>
      <div className="fg"><label className="fl" htmlFor="i-tel">Celular</label>
        <input id="i-tel" className="fi" type="tel" placeholder="Ej: 3001234567" value={f.telefono} onChange={set('telefono')} maxLength={20} autoComplete="tel" /></div>
      <div className="fg"><label className="fl" htmlFor="i-mail">Correo electrónico</label>
        <input id="i-mail" className="fi" value={perfil.email} disabled />
        <span className="ayuda">Para cambiarlo, escríbenos por WhatsApp.</span></div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  )
}

function EmpresaModal({ empresa, onCerrar, onGuardar }) {
  const [f, setF] = useState({
    razonSocial: empresa?.razonSocial || '', nit: empresa?.nit || '', regimen: empresa?.regimen || '',
    celular: empresa?.celular || '', correo: empresa?.correo || '',
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const set = (campo) => (e) => setF((x) => ({ ...x, [campo]: e.target.value }))
  const nit = f.nit.replace(/\D/g, '')

  async function enviar(datos) {
    setError('')
    if (datos) {
      if (datos.razonSocial.trim().length < 2) return setError('Escribe la razón social.')
      if (nit.length < 5) return setError('Escribe el NIT sin el dígito de verificación.')
    }
    setGuardando(true)
    const msg = await onGuardar(datos && { ...datos, razonSocial: datos.razonSocial.trim(), nit, celular: datos.celular.trim(), correo: datos.correo.trim() })
    setGuardando(false)
    if (msg) setError(msg)
  }

  return (
    <Modal titulo="Editar datos de empresa" onCerrar={onCerrar}
      pie={<>
        {empresa && <button className="modal-btn-cancel" disabled={guardando} onClick={() => enviar(null)}>Quitar empresa</button>}
        <button className="modal-btn-cancel" onClick={onCerrar}>Cancelar</button>
        <button className="modal-btn-save" disabled={guardando} onClick={() => enviar(f)}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
      </>}>
      <div className="fg"><label className="fl" htmlFor="e-razon">Razón social</label>
        <input id="e-razon" className="fi" placeholder="Ej: Textiles ABC S.A.S." value={f.razonSocial} onChange={set('razonSocial')} maxLength={150} autoComplete="organization" /></div>
      <div className="fg"><label className="fl" htmlFor="e-nit">NIT</label>
        <div className="fila-nit">
          <input id="e-nit" className="fi" inputMode="numeric" placeholder="Ej: 900123456" value={f.nit} onChange={set('nit')} maxLength={15} />
          <input className="fi" aria-label="Dígito de verificación" value={nit ? digitoVerificacion(nit) : ''} placeholder="DV" disabled />
        </div>
        <span className="ayuda">El dígito de verificación se calcula solo.</span></div>
      <div className="fg"><label className="fl" htmlFor="e-reg">Responsabilidad de IVA <span className="opcional">(opcional)</span></label>
        <select id="e-reg" className="fi" value={f.regimen} onChange={set('regimen')}>
          <option value="">No estoy seguro</option>
          {Object.entries(REGIMENES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select></div>
      <div className="fg"><label className="fl" htmlFor="e-cel">Celular</label>
        <input id="e-cel" className="fi" type="tel" placeholder="Ej: 3001234567" value={f.celular} onChange={set('celular')} maxLength={20} /></div>
      <div className="fg"><label className="fl" htmlFor="e-correo">Correo electrónico</label>
        <input id="e-correo" className="fi" type="email" placeholder="Ej: facturacion@empresa.com" value={f.correo} onChange={set('correo')} maxLength={120} />
        <span className="ayuda">Ahí llega la factura cuando compras como empresa.</span></div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  )
}

function PwdModal({ onCerrar, onGuardar }) {
  const [f, setF] = useState({ actual: '', nueva: '', repetir: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const set = (campo) => (e) => setF((x) => ({ ...x, [campo]: e.target.value }))

  async function guardar() {
    setError('')
    if (!f.actual) return setError('Escribe tu contraseña actual.')
    if (f.nueva.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.')
    if (f.nueva !== f.repetir) return setError('Las contraseñas nuevas no coinciden.')
    setGuardando(true)
    const msg = await onGuardar({ actual: f.actual, nueva: f.nueva })
    setGuardando(false)
    if (msg) setError(msg)
  }

  return (
    <Modal titulo="Cambiar contraseña" onCerrar={onCerrar}
      pie={<>
        <button className="modal-btn-cancel" onClick={onCerrar}>Cancelar</button>
        <button className="modal-btn-save" disabled={guardando} onClick={guardar}>{guardando ? 'Actualizando…' : 'Actualizar contraseña'}</button>
      </>}>
      <div className="fg"><label className="fl" htmlFor="p-act">Contraseña actual</label>
        <input id="p-act" className="fi" type="password" value={f.actual} onChange={set('actual')} autoComplete="current-password" /></div>
      <div className="fg"><label className="fl" htmlFor="p-new">Nueva contraseña</label>
        <input id="p-new" className="fi" type="password" placeholder="Mínimo 8 caracteres" value={f.nueva} onChange={set('nueva')} autoComplete="new-password" /></div>
      <div className="fg"><label className="fl" htmlFor="p-rep">Confirmar nueva contraseña</label>
        <input id="p-rep" className="fi" type="password" placeholder="Repite la nueva contraseña" value={f.repetir} onChange={set('repetir')} autoComplete="new-password" /></div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  )
}

function Salir({ onConfirmar, onCancelar }) {
  return (
    <>
      <h1 className="sec-title">Cerrar sesión</h1>
      <p className="sec-sub">¿Seguro que quieres salir de tu cuenta?</p>
      <div className="logout-card">
        <div className="lo-icon"><IcoSalirModal /></div>
        <h3>¿Quieres cerrar sesión?</h3>
        <p>Si cierras sesión tendrás que volver a ingresar la próxima vez que quieras comprar o revisar tus pedidos.</p>
        <div className="lo-btns">
          <button className="btn-lo" onClick={onConfirmar}>Sí, cerrar sesión</button>
          <button className="btn-cancel" onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    </>
  )
}
