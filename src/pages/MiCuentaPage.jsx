import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useAuth } from '../context/useAuth'
import { useProductos } from '../hooks/useProductos'
import './MiCuentaPage.css'

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
const fechaCorta = (iso) => (iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
const fechaLarga = (iso) => (iso ? new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '')

const METODO = {
  CARD: 'Tarjeta', PSE: 'PSE', NEQUI: 'Nequi', DAVIPLATA: 'Daviplata',
  BANCOLOMBIA_TRANSFER: 'Transferencia Bancolombia', BANCOLOMBIA_QR: 'QR Bancolombia',
  BANCOLOMBIA_COLLECT: 'Efectivo (Corresponsal Bancolombia)', PCOL: 'Puntos Colombia',
}

// "BOGOTÁ D.C." -> "Bogotá D.C."
const nombreCiudad = (c) => String(c || '').toLowerCase()
  .replace(/(^|[\s(])\S/g, (x) => x.toUpperCase())
  .replace(/\s(De|Del|La|Las|Los|El|Y)(?=\s)/g, (x) => x.toLowerCase())
  .replace(/\bD\.c\./g, 'D.C.')
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
const IcoResumen = () => <svg className="si-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7,0H4A4,4,0,0,0,0,4V7a4,4,0,0,0,4,4H7a4,4,0,0,0,4-4V4A4,4,0,0,0,7,0ZM9,7A2,2,0,0,1,7,9H4A2,2,0,0,1,2,7V4A2,2,0,0,1,4,2H7A2,2,0,0,1,9,4Z" /><path d="M20,0H17a4,4,0,0,0-4,4V7a4,4,0,0,0,4,4h3a4,4,0,0,0,4-4V4A4,4,0,0,0,20,0Zm2,7a2,2,0,0,1-2,2H17a2,2,0,0,1-2-2V4a2,2,0,0,1,2-2h3a2,2,0,0,1,2,2Z" /><path d="M7,13H4a4,4,0,0,0-4,4v3a4,4,0,0,0,4,4H7a4,4,0,0,0,4-4V17A4,4,0,0,0,7,13Zm2,7a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V17a2,2,0,0,1,2-2H7a2,2,0,0,1,2,2Z" /><path d="M20,13H17a4,4,0,0,0-4,4v3a4,4,0,0,0,4,4h3a4,4,0,0,0,4-4V17A4,4,0,0,0,20,13Zm2,7a2,2,0,0,1-2,2H17a2,2,0,0,1-2-2V17a2,2,0,0,1,2-2h3a2,2,0,0,1,2,2Z" /></svg>
const IcoPedidos = () => <svg className="si-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19,0H5A5.006,5.006,0,0,0,0,5V19a5.006,5.006,0,0,0,5,5H19a5.006,5.006,0,0,0,5-5V5A5.006,5.006,0,0,0,19,0ZM5,2H19a3,3,0,0,1,3,3V6H2V5A3,3,0,0,1,5,2ZM19,22H5a3,3,0,0,1-3-3V8H22V19A3,3,0,0,1,19,22Z" /><path d="M16,11H8a1,1,0,0,0,0,2h8a1,1,0,0,0,0-2Z" /></svg>
const IcoSalir = () => <svg className="si-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M11.476,15a1,1,0,0,0-1,1v3a3,3,0,0,1-3,3H5a3,3,0,0,1-3-3V5A3,3,0,0,1,5,2H7.476a3,3,0,0,1,3,3V8a1,1,0,0,0,2,0V5a5.006,5.006,0,0,0-5-5H5A5.006,5.006,0,0,0,0,5V19a5.006,5.006,0,0,0,5,5H7.476a5.006,5.006,0,0,0,5-5V16A1,1,0,0,0,11.476,15Z" /><path d="M22.867,9.879,18.281,5.293a1,1,0,1,0-1.414,1.414l4.262,4.263L6,11a1,1,0,0,0,0,2H6l15.188-.031-4.323,4.324a1,1,0,1,0,1.414,1.414l4.586-4.586A3,3,0,0,0,22.867,9.879Z" /></svg>
const IcoCaja = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.2,6.2,14.4,1.7a5,5,0,0,0-4.8,0L1.8,6.2A3.5,3.5,0,0,0,0,9.3v5.4a3.5,3.5,0,0,0,1.8,3.1l7.8,4.5a5,5,0,0,0,4.8,0l7.8-4.5A3.5,3.5,0,0,0,24,14.7V9.3A3.5,3.5,0,0,0,22.2,6.2ZM10.6,3.4a3,3,0,0,1,2.8,0l7.4,4.3L12,12.8,3.2,7.7ZM2.8,16.1A1.5,1.5,0,0,1,2,14.7V9.4l9,5.2v7.3a3.1,3.1,0,0,1-.4-.2Zm18.4,0-7.8,4.5a3.1,3.1,0,0,1-.4.2V14.6l9-5.2v5.3A1.5,1.5,0,0,1,21.2,16.1Z" /></svg>
const IcoMoneda = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm0,22A10,10,0,1,1,22,12,10.011,10.011,0,0,1,12,22Z" /><path d="M12,5a1,1,0,0,0-1,1v6a1,1,0,0,0,.293.707l3,3a1,1,0,0,0,1.414-1.414L13,11.586V6A1,1,0,0,0,12,5Z" /></svg>
const IcoCamion = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19,5H17V4a3,3,0,0,0-3-3H3A3,3,0,0,0,0,4V19H2.041A3.465,3.465,0,0,0,2,19.5a3.5,3.5,0,0,0,7,0,3.465,3.465,0,0,0-.041-.5h6.082a3.465,3.465,0,0,0-.041.5,3.5,3.5,0,0,0,7,0,3.465,3.465,0,0,0-.041-.5H24V10A5.006,5.006,0,0,0,19,5Zm0,2a3,3,0,0,1,3,3v1H17V7ZM7,19.5a1.5,1.5,0,0,1-3,0,1.418,1.418,0,0,1,.093-.5H6.907A1.418,1.418,0,0,1,7,19.5ZM15,17H2V4A1,1,0,0,1,3,3H14a1,1,0,0,1,1,1Zm5,2.5a1.5,1.5,0,0,1-3,0,1.41,1.41,0,0,1,.093-.5h2.814A1.41,1.41,0,0,1,20,19.5ZM22,17H17V13h5Z" /></svg>

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
      : resto.startsWith('pedidos') ? 'pedidos' : 'resumen'
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
          {vista !== 'resumen' && vista !== 'salir' && <><span className="sep">/</span>
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
            <button className={`sidebar-item ${vista === 'resumen' ? 'active' : ''}`} onClick={() => ir('/mi-cuenta')}><IcoResumen /> Resumen</button>
            <button className={`sidebar-item ${vista === 'pedidos' || vista === 'pedido' ? 'active' : ''}`} onClick={() => ir('/mi-cuenta/pedidos')}><IcoPedidos /> Mis pedidos</button>
            <button className={`sidebar-item logout ${vista === 'salir' ? 'active' : ''}`} onClick={() => setConfirmarSalida(true)}><IcoSalir /> Cerrar sesión</button>
          </nav>
        </aside>

        <div className="cuenta-content">
          {vista === 'salir' ? (
            <Salir onConfirmar={async () => { await logout(); navigate('/') }} onCancelar={() => setConfirmarSalida(false)} />
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
  const pagados = pedidos.filter((p) => !['pago_pendiente', 'rechazado', 'cancelado'].includes(p.estadoCliente.clave))
  const enCamino = pedidos.filter((p) => p.estadoCliente.clave === 'enviado').length
  return (
    <>
      <h1 className="sec-title">¡Hola, {primerNombre(user)}! 👋</h1>
      <p className="sec-sub">Desde aquí puedes ver tus pedidos y cómo van tus envíos.</p>
      <div className="stats-row">
        <div className="stat-card"><div className="stat-ico p"><IcoCaja /></div><div><div className="stat-num">{pagados.length}</div><div className="stat-lbl">Pedidos realizados</div></div></div>
        <div className="stat-card"><div className="stat-ico g"><IcoMoneda /></div><div><div className="stat-num">{moneyCorto(pagados.reduce((s, p) => s + (Number(p.total) || 0), 0))}</div><div className="stat-lbl">Total comprado</div></div></div>
        <div className="stat-card"><div className="stat-ico d"><IcoCamion /></div><div><div className="stat-num">{enCamino}</div><div className="stat-lbl">{enCamino === 1 ? 'Envío en camino' : 'Envíos en camino'}</div></div></div>
      </div>
      <div className="recientes-card">
        <div className="rc-header">
          <div className="rc-title">Pedidos recientes</div>
          {pedidos.length > 0 && <button className="rc-link" onClick={onTodos}>Ver todos →</button>}
        </div>
        {pedidos.length === 0 ? (
          <div className="empty-mini">Aún no tienes pedidos. <Link to="/catalogo">Explora el catálogo</Link></div>
        ) : (
          <>
            <div className="tabla-head"><span>Pedido</span><span>Fecha</span><span>Estado</span><span>Total</span></div>
            {pedidos.slice(0, 3).map((p) => (
              <div className="pedido-fila" key={p.referencia} role="button" tabIndex={0} onClick={() => onVer(p.referencia)} onKeyDown={(e) => e.key === 'Enter' && onVer(p.referencia)}>
                <span className="p-num">#{p.referencia}</span>
                <span className="p-fecha">{fechaCorta(p.creadoEn)}</span>
                <Estado e={p.estadoCliente} />
                <span className="p-total">{money(p.total)}</span>
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
      <p className="sec-sub">Historial de tus compras en Russitex. Haz clic en un pedido para ver el detalle.</p>
      {pedidos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-ico"><IcoPedidos /></div>
          <h3>Aún no has hecho ningún pedido</h3>
          <p>Cuando compres, tus pedidos aparecerán aquí con su estado, seguimiento y detalle.</p>
          <Link className="btn-primary" to="/catalogo">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="recientes-card">
          <div className="tabla-head cols5"><span>Pedido</span><span>Fecha</span><span>Productos</span><span>Estado</span><span>Total</span></div>
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
  const chip = { verde: 'Pagado', azul: 'Pagado', ambar: e.clave === 'pago_pendiente' ? 'Pago en proceso' : 'Pagado', rojo: e.clave === 'cancelado' ? 'Anulado' : 'No cobrado' }[e.color]

  return (
    <>
      <button className="volver-link" onClick={onVolver}>← Volver a mis pedidos</button>
      <div className="ped-head">
        <h1>{pedido.referencia.startsWith('PEDIDO-') ? pedido.referencia : `Pedido #${pedido.referencia}`}</h1>
        <Estado e={e} />
      </div>
      <div className="ped-fecha">{fechaLarga(pedido.creadoEn)}</div>

      {e.envio && <div className={`envio-banner ${e.color}`}><span className="dot" />Estado del envío: {e.envio}</div>}

      <div className="ped-card">
        <h3>Datos del pedido</h3>
        <div className="pd-row"><span className="l">Fecha</span><span className="v">{fechaLarga(pedido.creadoEn)}</span></div>
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
        <div className="pd-row"><span className="l">Envío</span><span className="v">{tienda || envio.costo === 0 ? 'Gratis' : money(envio.costo)}</span></div>
        <div className="pd-total"><span className="l">Total</span><span className="v">{money(pedido.total)}</span></div>
        <div className={`pd-chip ${e.color}`}><span className="dot" />{chip} · Wompi</div>
      </div>
    </>
  )
}

function Salir({ onConfirmar, onCancelar }) {
  return (
    <>
      <h1 className="sec-title">Cerrar sesión</h1>
      <p className="sec-sub">¿Seguro que quieres salir de tu cuenta?</p>
      <div className="logout-card">
        <div className="lo-icon"><IcoSalir /></div>
        <h3>¿Quieres cerrar sesión?</h3>
        <p>Si cierras sesión tendrás que volver a ingresar la próxima vez que quieras revisar tus pedidos.</p>
        <div className="lo-btns">
          <button className="btn-lo" onClick={onConfirmar}>Sí, cerrar sesión</button>
          <button className="btn-cancel" onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    </>
  )
}
