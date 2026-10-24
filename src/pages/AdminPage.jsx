import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useAuth } from '../context/useAuth'
import { IcoImagen, IcoEtiqueta, IcoPedidos, IcoUsuario } from './adminIcons'
import './AdminPage.css'

// Panel de administrador (diseño version2: russitex-admin.html).
// Rutas: /admin/imagenes, /admin/imagenes/<id>, /admin/estado,
//        /admin/pedidos, /admin/pedidos/<referencia>.
// El backend (/api/admin) solo deja pasar los correos de ADMIN_EMAILS.

const API_URL = import.meta.env.VITE_API_URL
const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`
const fecha = (iso) => (iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
const fechaHora = (iso) => (iso ? new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '')
const CATEGORIA = { forros: 'Forros', entretelas: 'Entretelas', hombreras: 'Hombreras', guatas: 'Guatas', tizas: 'Tizas', cierres: 'Cierres', otros: 'Otros' }
const METODO = { CARD: 'Tarjeta', PSE: 'PSE', NEQUI: 'Nequi', DAVIPLATA: 'DaviPlata', BANCOLOMBIA_TRANSFER: 'Bancolombia', BANCOLOMBIA_QR: 'QR Bancolombia', BANCOLOMBIA_COLLECT: 'Efectivo' }

async function api(token, ruta, { method = 'GET', body } = {}) {
  try {
    const r = await fetch(`${API_URL}/api/admin${ruta}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    return { ok: r.ok, status: r.status, datos: await r.json().catch(() => ({})) }
  } catch {
    return { ok: false, status: 0, datos: { error: 'No hay conexión con el servidor. Intenta de nuevo.' } }
  }
}

// Reduce la foto antes de subirla (máx. 1600 px, JPEG): las del celular
// pesan varios MB y la web no necesita más.
async function prepararImagen(archivo) {
  if (!/^image\//.test(archivo.type)) throw new Error('El archivo no es una imagen.')
  const bitmap = await createImageBitmap(archivo)
  const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'   // las PNG con transparencia quedan con fondo blanco
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85))
  const datosBase64 = await new Promise((ok, mal) => {
    const lector = new FileReader()
    lector.onload = () => ok(String(lector.result).split(',')[1])
    lector.onerror = mal
    lector.readAsDataURL(blob)
  })
  return { tipo: 'image/jpeg', datosBase64 }
}

// Estado mostrado de un producto: con variantes se calcula de ellas.
function estadoProducto(p) {
  if (!p.variantes.length) return p.disponible ? 'disponible' : 'agotado'
  const disp = p.variantes.filter((v) => v.disponible).length
  if (disp === 0) return 'agotado'
  return disp === p.variantes.length ? 'disponible' : 'parcial'
}
const BADGE = { disponible: ['verde', 'Disponible'], agotado: ['rojo', 'Agotado'], parcial: ['ambar', 'Parcial'] }
const Badge = ({ color, texto }) => <span className={`badge ${color}`}><span className="dot" />{texto}</span>

export default function AdminPage() {
  const { user, token, loading } = useAuth()
  const navigate = useNavigate()
  const ruta = useParams()['*'] || ''
  const [seccion, detalle] = [ruta.split('/')[0] || 'imagenes', ruta.split('/').slice(1).join('/')]
  const [productos, setProductos] = useState(null)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const toast = useCallback((texto) => {
    setAviso(texto)
    setTimeout(() => setAviso((a) => (a === texto ? '' : a)), 2600)
  }, [])

  const cargarProductos = useCallback(() => api(token, '/productos').then((r) => {
    if (r.ok) setProductos(r.datos.productos)
    else setError(r.datos.error || 'No se pudieron cargar los productos.')
  }), [token])

  useEffect(() => {
    if (!token || !user?.esAdmin || productos) return
    cargarProductos()
  }, [token, user, productos, cargarProductos])

  if (loading) return null
  if (!user) {
    try { sessionStorage.setItem('russitex_tras_login', '/admin') } catch { /* sin storage */ }
    return <Navigate to="/login" replace />
  }

  const ir = (r) => { navigate(`/admin/${r}`); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="admin-page">
      <SiteHeader activeLink="admin" />
      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <Link to="/">Inicio</Link><span className="sep">/</span>
          <span className="current">Administrador</span>
        </div>
      </div>

      {!user.esAdmin ? (
        <div className="admin-layout" style={{ display: 'block' }}>
          <div className="admin-empty">
            <h3>Esta sección es solo para administradores</h3>
            <p>Tu cuenta no tiene acceso al panel. <Link to="/mi-cuenta">Ir a Mi cuenta</Link></p>
          </div>
        </div>
      ) : (
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <div className="admin-user">
              <div className="ico"><IcoUsuario /></div>
              <div className="rol">Administrador</div>
              <div className="nom">{user.nombre || user.email}</div>
            </div>
            <div className="admin-nav">
              <button className={`admin-item ${seccion === 'imagenes' ? 'active' : ''}`} onClick={() => ir('imagenes')}><IcoImagen /> Imágenes de productos</button>
              <button className={`admin-item ${seccion === 'estado' ? 'active' : ''}`} onClick={() => ir('estado')}><IcoEtiqueta /> Estado del producto</button>
              <button className={`admin-item ${seccion === 'pedidos' ? 'active' : ''}`} onClick={() => ir('pedidos')}><IcoPedidos /> Pedidos</button>
            </div>
          </aside>

          <div className="admin-content">
            {error && <div className="admin-error">{error}</div>}
            {seccion === 'imagenes' && !detalle && <ListaImagenes productos={productos} onVer={(id) => ir(`imagenes/${id}`)} />}
            {seccion === 'imagenes' && detalle && (
              <ImagenesProducto token={token} producto={productos?.find((p) => p.id === detalle)} toast={toast}
                onVolver={() => ir('imagenes')}
                onCambio={(id, imagenes) => setProductos((ps) => ps.map((p) => (p.id === id ? { ...p, imagenes } : p)))} />
            )}
            {seccion === 'estado' && <EstadoProductos token={token} productos={productos} setProductos={setProductos} toast={toast} />}
            {seccion === 'pedidos' && !detalle && <ListaPedidos token={token} onVer={(ref) => ir(`pedidos/${encodeURIComponent(ref)}`)} />}
            {seccion === 'pedidos' && detalle && <DetallePedido token={token} referencia={decodeURIComponent(detalle)} toast={toast} onVolver={() => ir('pedidos')} />}
          </div>
        </div>
      )}

      {aviso && <div className="admin-toast">{aviso}</div>}
      <SiteFooter />
    </div>
  )
}

// ------------------------------------------------------------
// 1. Imágenes
// ------------------------------------------------------------
function ListaImagenes({ productos, onVer }) {
  const [filtro, setFiltro] = useState('')
  if (!productos) return <p className="cargando">Cargando productos…</p>
  const lista = productos.filter((p) => p.nombre.toLowerCase().includes(filtro.toLowerCase()))
  return (
    <>
      <h1 className="sec-title">Imágenes de productos</h1>
      <p className="sec-sub">Haz clic en un producto para ver sus imágenes, ordenarlas, eliminarlas o subir nuevas.</p>
      <input className="filtro" placeholder="Buscar producto…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      {lista.map((p) => (
        <div className="admin-card" key={p.id}>
          <div className="prod-row">
            {p.imagenes[0] ? <img className="prod-thumb" src={p.imagenes[0].url} alt="" loading="lazy" /> : <div className="prod-thumb" />}
            <div className="prod-id">
              <div className="cat">{CATEGORIA[p.categoria] || p.categoria}</div>
              <div className="nom">{p.nombre}</div>
              <div className="prod-meta">{p.imagenes.length === 0 ? 'Sin imágenes' : p.imagenes.length === 1 ? '1 imagen' : `${p.imagenes.length} imágenes`}</div>
            </div>
            <button className="ped-ver" onClick={() => onVer(p.id)}>Ver</button>
          </div>
        </div>
      ))}
    </>
  )
}

function ImagenesProducto({ token, producto, toast, onVolver, onCambio }) {
  const [subiendo, setSubiendo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  if (!producto) return <><button className="volver-link" onClick={onVolver}>← Volver a imágenes</button><p className="cargando">Cargando…</p></>
  const imgs = producto.imagenes

  async function aplicar(promesa, mensaje) {
    setError(''); setOcupado(true)
    const r = await promesa
    setOcupado(false)
    if (!r.ok) { setError(r.datos.error || 'No se pudo guardar.'); return }
    onCambio(producto.id, r.datos.imagenes)
    if (mensaje) toast(mensaje)
  }
  function mover(i, dir) {
    const ids = imgs.map((x) => x.id)
    const j = i + dir
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    aplicar(api(token, `/productos/${producto.id}/imagenes/orden`, { method: 'PUT', body: { ids } }), j === 0 ? 'Nueva portada' : null)
  }
  function eliminar(img) {
    if (!window.confirm('¿Eliminar esta imagen? Se deja de ver en la tienda.')) return
    aplicar(api(token, `/imagenes/${img.id}`, { method: 'DELETE' }), 'Imagen eliminada')
  }
  async function subir(e) {
    const archivos = [...(e.target.files || [])]
    e.target.value = ''
    if (!archivos.length) return
    setError(''); setSubiendo(true)
    for (const archivo of archivos) {
      try {
        const cuerpo = await prepararImagen(archivo)
        const r = await api(token, `/productos/${producto.id}/imagenes`, { method: 'POST', body: cuerpo })
        if (!r.ok) throw new Error(r.datos.error || 'No se pudo subir la imagen.')
        onCambio(producto.id, r.datos.imagenes)
      } catch (err) {
        setError(err.message)
        break
      }
    }
    setSubiendo(false)
    toast(archivos.length === 1 ? 'Imagen agregada' : 'Imágenes agregadas')
  }

  return (
    <>
      <button className="volver-link" onClick={onVolver}>← Volver a imágenes</button>
      <h1 className="sec-title">Imágenes · {producto.nombre}</h1>
      <p className="sec-sub">La primera imagen es la <strong>portada</strong>. Usa las flechas para ordenar cómo se mostrarán y la ✕ para eliminar.</p>
      {error && <div className="admin-error">{error}</div>}
      <div className="img-manage">
        {imgs.map((img, i) => (
          <div className="img-tile" key={img.id}>
            {i === 0 && <span className="portada">Portada</span>}
            <img src={img.url} alt="" />
            <button className="tile-del" title="Eliminar" disabled={ocupado} onClick={() => eliminar(img)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <div className="tile-move">
              <button title="Mover antes" disabled={i === 0 || ocupado} onClick={() => mover(i, -1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button title="Mover después" disabled={i === imgs.length - 1 || ocupado} onClick={() => mover(i, 1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        ))}
        {imgs.length === 0 && <div className="img-empty-msg">Este producto no tiene imágenes. Sube la primera.</div>}
        <label className={`img-upload-tile ${subiendo ? 'subiendo' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          <span>{subiendo ? 'Subiendo…' : 'Subir imagen'}</span>
          <input type="file" accept="image/*" multiple onChange={subir} disabled={subiendo} />
        </label>
      </div>
    </>
  )
}

// ------------------------------------------------------------
// 2. Estado del producto
// ------------------------------------------------------------
function EstadoProductos({ token, productos, setProductos, toast }) {
  const [abiertos, setAbiertos] = useState({})
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')
  if (!productos) return <p className="cargando">Cargando productos…</p>

  async function cambiarProducto(p, disponible) {
    if (p.disponible === disponible) return
    setGuardando(`p${p.id}`); setError('')
    const r = await api(token, `/productos/${p.id}/disponible`, { method: 'PUT', body: { disponible } })
    setGuardando(null)
    if (!r.ok) { setError(r.datos.error || 'No se pudo guardar.'); return }
    setProductos((ps) => ps.map((x) => (x.id === p.id ? { ...x, disponible } : x)))
    toast(`${p.nombre}: ${disponible ? 'Disponible' : 'Agotado'}`)
  }
  async function cambiarVariante(p, v, disponible) {
    if (v.disponible === disponible) return
    setGuardando(`v${v.id}`); setError('')
    const r = await api(token, `/variantes/${v.id}/disponible`, { method: 'PUT', body: { disponible } })
    setGuardando(null)
    if (!r.ok) { setError(r.datos.error || 'No se pudo guardar.'); return }
    setProductos((ps) => ps.map((x) => (x.id === p.id
      ? { ...x, variantes: x.variantes.map((y) => (y.id === v.id ? { ...y, disponible } : y)) } : x)))
    toast(`Variante “${v.nombre}”: ${disponible ? 'Disponible' : 'Agotado'}`)
  }
  const seg = (activo, onDisp, onAgot, clave) => (
    <div className="seg">
      <button className={activo ? 'on-disp' : ''} disabled={guardando === clave} onClick={onDisp}>Disponible</button>
      <button className={!activo ? 'on-agot' : ''} disabled={guardando === clave} onClick={onAgot}>Agotado</button>
    </div>
  )
  const lista = productos.filter((p) => p.nombre.toLowerCase().includes(filtro.toLowerCase()))

  return (
    <>
      <h1 className="sec-title">Estado del producto</h1>
      <p className="sec-sub">Marca cada producto como disponible o agotado. Los productos con variantes pueden quedar parcialmente agotados.</p>
      {error && <div className="admin-error">{error}</div>}
      <input className="filtro" placeholder="Buscar producto…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      {lista.map((p) => {
        const [color, texto] = BADGE[estadoProducto(p)]
        const abierto = Boolean(abiertos[p.id])
        return (
          <div className="admin-card" key={p.id}>
            <div className="prod-row">
              {p.imagenes[0] ? <img className="prod-thumb" src={p.imagenes[0].url} alt="" loading="lazy" /> : <div className="prod-thumb" />}
              <div className="prod-id"><div className="cat">{CATEGORIA[p.categoria] || p.categoria}</div><div className="nom">{p.nombre}</div></div>
              <div className="estado-ctrl">
                <Badge color={color} texto={texto} />
                {p.variantes.length ? (
                  <button className={`btn-variantes ${abierto ? 'open' : ''}`} onClick={() => setAbiertos((a) => ({ ...a, [p.id]: !a[p.id] }))}>
                    Ver variantes <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                ) : seg(p.disponible, () => cambiarProducto(p, true), () => cambiarProducto(p, false), `p${p.id}`)}
              </div>
            </div>
            {p.variantes.length > 0 && (
              <div className={`variantes ${abierto ? 'open' : ''}`}>
                {p.variantes.map((v) => (
                  <div className="variante-row" key={v.id}>
                    <span className="vn">{v.nombre}</span>
                    {seg(v.disponible, () => cambiarVariante(p, v, true), () => cambiarVariante(p, v, false), `v${v.id}`)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

// ------------------------------------------------------------
// 3. Pedidos
// ------------------------------------------------------------
function ListaPedidos({ token, onVer }) {
  const [pedidos, setPedidos] = useState(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')
  useEffect(() => {
    let activo = true
    api(token, '/pedidos').then((r) => {
      if (!activo) return
      if (r.ok) setPedidos(r.datos.pedidos)
      else setError(r.datos.error || 'No se pudieron cargar los pedidos.')
    })
    return () => { activo = false }
  }, [token])

  if (error) return <div className="admin-error">{error}</div>
  if (!pedidos) return <p className="cargando">Cargando pedidos…</p>
  const f = filtro.toLowerCase()
  const lista = pedidos.filter((p) => !f || p.referencia.toLowerCase().includes(f) || p.cliente.toLowerCase().includes(f))

  return (
    <>
      <h1 className="sec-title">Pedidos</h1>
      <p className="sec-sub">Haz clic en un pedido para ver su detalle. Desde aquí puedes <strong>cancelar un pedido</strong> y <strong>registrar su reembolso</strong>. El estado de entrega lo actualizan el pago y la transportadora.</p>
      {pedidos.length === 0 ? (
        <div className="admin-empty"><h3>Aún no hay pedidos</h3><p>Cuando los clientes hagan pedidos, aparecerán aquí para que los gestiones.</p></div>
      ) : (
        <>
          <input className="filtro" placeholder="Buscar por pedido o cliente…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          <div className="pedidos-tabla">
            <div className="tabla-head"><span>Pedido</span><span>Fecha</span><span>Cliente</span><span>Estado</span><span>Total</span><span /></div>
            {lista.map((p) => (
              <div className="ped-fila" key={p.referencia} role="button" tabIndex={0} onClick={() => onVer(p.referencia)} onKeyDown={(e) => e.key === 'Enter' && onVer(p.referencia)}>
                <span className="pnum">#{p.referencia}</span>
                <span className="pfecha" style={{ fontSize: '0.84rem', color: 'var(--gris-calido)' }}>{fecha(p.creadoEn)}</span>
                <span className="pcel">{p.cliente}</span>
                <span className="pestado"><Badge color={p.estadoCliente.color} texto={p.estadoCliente.texto} /></span>
                <span className="ptot">{money(p.total)}</span>
                <span className="ped-ver">Ver</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function DetallePedido({ token, referencia, toast, onVolver }) {
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)        // { motivo, agotados: Set }
  const [ocupado, setOcupado] = useState(false)
  const [pendientes, setPendientes] = useState(null)

  const cargar = useCallback(() => api(token, `/pedidos/${encodeURIComponent(referencia)}`).then((r) => {
    if (r.ok) setPedido(r.datos)
    else setError(r.datos.error || 'No se pudo cargar el pedido.')
  }), [token, referencia])
  useEffect(() => { cargar() }, [cargar])

  if (error && !pedido) return <><button className="volver-link" onClick={onVolver}>← Volver a pedidos</button><div className="admin-error">{error}</div></>
  if (!pedido) return <><button className="volver-link" onClick={onVolver}>← Volver a pedidos</button><p className="cargando">Cargando pedido…</p></>

  const e = pedido.estadoCliente
  const c = pedido.cliente
  const env = pedido.envio
  const subtotal = pedido.productos.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const tienda = env.modalidad === 'tienda'
  const cancelable = pedido.estado === 'APROBADO' && !pedido.cancelacion

  function abrirCancelar() {
    const primero = pedido.productos[0]?.nombre || 'el producto'
    // Sin artículo ("el"/"la"): no se sabe el género de cada producto.
    setForm({ motivo: `se agotó «${primero}» justo después de tu compra y no alcanzamos a reservarlo.`, agotados: new Set([primero]) })
  }
  async function confirmarCancelar() {
    setOcupado(true); setError('')
    const r = await api(token, `/pedidos/${encodeURIComponent(referencia)}/cancelar`, { method: 'POST', body: { motivo: form.motivo, agotados: [...form.agotados] } })
    setOcupado(false)
    if (!r.ok) { setError(r.datos.error || 'No se pudo cancelar.'); return }
    setForm(null); setPendientes(r.datos.pendientes || [])
    toast(`Pedido #${referencia} cancelado`)
    cargar()
  }
  async function reembolsado() {
    if (!window.confirm('¿Ya devolviste el dinero al cliente en Wompi?')) return
    setOcupado(true); setError('')
    const r = await api(token, `/pedidos/${encodeURIComponent(referencia)}/reembolsado`, { method: 'POST' })
    setOcupado(false)
    if (!r.ok) { setError(r.datos.error || 'No se pudo guardar.'); return }
    setPendientes(null)
    toast(`Pedido #${referencia} marcado como reembolsado`)
    cargar()
  }

  return (
    <>
      <button className="volver-link" onClick={onVolver}>← Volver a pedidos</button>
      <h1 className="sec-title">Pedido #{pedido.referencia}</h1>
      <p className="sec-sub">{fechaHora(pedido.creadoEn)} · <Badge color={e.color} texto={e.texto} /></p>
      {error && <div className="admin-error">{error}</div>}

      <div className="det-grid">
        <div className="det-card">
          <h3>Productos</h3>
          {pedido.productos.map((i, n) => (
            <div className="det-prod" key={n}>
              <div><div className="dp-nom">{i.nombre}</div><div className="dp-cant">{i.variante ? `${i.variante} · ` : ''}{i.cantidad} × {money(i.precio)}</div></div>
              <div className="dp-val">{money(i.precio * i.cantidad)}</div>
            </div>
          ))}
          <div className="det-row"><span className="l">Subtotal</span><span className="v">{money(subtotal)}</span></div>
          {pedido.descuento?.monto > 0 && (
            <div className="det-row"><span className="l">Descuento {pedido.descuento.porcentaje}%</span><span className="v">-{money(pedido.descuento.monto)}</span></div>
          )}
          <div className="det-row"><span className="l">{tienda ? 'Recoge en tienda' : 'Envío'}</span><span className="v">{tienda || !env.costo ? 'Gratis' : money(env.costo)}{env.envioGratis ? ' (lo paga la tienda)' : ''}</span></div>
          <div className="det-total"><span className="l">Total</span><span className="v">{money(pedido.total)}</span></div>
          <div className="det-row" style={{ marginTop: '0.8rem' }}><span className="l">Pago</span><span className="v">{e.pago}{pedido.metodoPago ? ` · ${METODO[pedido.metodoPago] || pedido.metodoPago}` : ''}</span></div>
          {pedido.factura && <div className="det-row"><span className="l">Factura Alegra</span><span className="v">{pedido.factura.numero || pedido.factura.id} ({pedido.factura.estado})</span></div>}
          {pedido.guia && (
            <div className="det-row"><span className="l">Guía</span><span className="v">
              {pedido.guia.rastreoUrl ? <a href={pedido.guia.rastreoUrl} target="_blank" rel="noopener noreferrer">{pedido.guia.numeroGuia}</a> : pedido.guia.numeroGuia}
              {pedido.guia.ambiente === 'pruebas' ? ' (prueba)' : ''}
              {pedido.guia.etiquetaUrl && <> · <a href={pedido.guia.etiquetaUrl} target="_blank" rel="noopener noreferrer">etiqueta</a></>}
            </span></div>
          )}
        </div>

        <div className="det-card det-cliente">
          <h3>Cliente y entrega</h3>
          <div className="lbl">Cliente</div>
          <p>{c.nombre}{c.empresa ? <><br />NIT {c.empresa.nit}</> : c.documento ? <><br />{c.documento}</> : null}</p>
          {c.empresa && c.contacto && <><div className="lbl">Contacto</div><p>{c.contacto}</p></>}
          <div className="lbl">Celular y correo</div>
          <p>{c.telefono || '—'}{c.avisosWhatsapp ? ' (acepta WhatsApp)' : ''}<br /><a href={`mailto:${c.email}`}>{c.email}</a></p>
          <div className="lbl">{tienda ? 'Entrega' : 'Dirección de entrega'}</div>
          <p>{tienda ? 'Recoge en la tienda' : <>{env.direccion}<br />{[env.ciudad, env.departamento].filter(Boolean).join(', ')}{env.transportadora ? <><br />{env.transportadora}</> : null}</>}</p>
          {pedido.cancelacion && <><div className="lbl">Motivo de la cancelación</div><p>{pedido.cancelacion.motivo}</p></>}

          <div className="det-actions">
            {cancelable && !form && (
              <>
                <button className="btn-danger" onClick={abrirCancelar}>Cancelar pedido</button>
                <div className="det-nota">Cancelar el pedido lo marca como <strong>Cancelado</strong>, anula la guía de envío (si la transportadora no la ha recogido) y le escribe al cliente. Después podrás registrar el reembolso.</div>
              </>
            )}
            {cancelable && form && (
              <div className="cancelar-form">
                <label htmlFor="motivo">Motivo (lo verá el cliente)</label>
                <textarea id="motivo" value={form.motivo} onChange={(ev) => setForm((f) => ({ ...f, motivo: ev.target.value }))} />
                <label>Productos agotados</label>
                {pedido.productos.map((i) => (
                  <span className="agot" key={i.nombre}>
                    <input type="checkbox" checked={form.agotados.has(i.nombre)} onChange={(ev) => setForm((f) => {
                      const s = new Set(f.agotados)
                      if (ev.target.checked) s.add(i.nombre); else s.delete(i.nombre)
                      return { ...f, agotados: s }
                    })} />
                    {i.nombre}{i.variante ? ` · ${i.variante}` : ''}
                  </span>
                ))}
                <div className="botones">
                  <button className="btn-ghost-sm" onClick={() => setForm(null)} disabled={ocupado}>Volver</button>
                  <button className="btn-danger" onClick={confirmarCancelar} disabled={ocupado}>{ocupado ? 'Cancelando…' : 'Confirmar cancelación'}</button>
                </div>
              </div>
            )}
            {pedido.cancelacion?.estadoReembolso === 'en_proceso' && (
              <>
                <button className="btn-refund" onClick={reembolsado} disabled={ocupado}>Marcar como reembolsado</button>
                <div className="det-nota">El pedido está cancelado. Devuelve {money(pedido.cancelacion.monto)} en el panel de Wompi{pedido.transaccionId ? ` (transacción ${pedido.transaccionId})` : ''} y luego márcalo aquí.</div>
              </>
            )}
            {pedido.cancelacion?.estadoReembolso === 'reembolsado' && (
              <div className="det-nota">Pedido <strong>reembolsado</strong>. No hay más acciones pendientes.</div>
            )}
            {pendientes?.length > 0 && (
              <div className="det-nota"><strong>Falta a mano:</strong><ul className="pendientes">{pendientes.map((p) => <li key={p}>{p}</li>)}</ul></div>
            )}
            {!cancelable && !pedido.cancelacion && (
              <div className="det-nota">Solo se pueden cancelar pedidos pagados. Este está en estado <strong>{e.texto}</strong>.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
