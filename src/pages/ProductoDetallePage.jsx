import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useProductos } from '../hooks/useProductos'
import { useTiendaInfo } from '../hooks/useTiendaInfo'
import { useAuth } from '../context/useAuth'
import {
  ICON_CARRITO, ICON_CAJA, ICON_REGLA, ICON_PALETA, ICON_ENVIO,
  ICON_CUIDADOS, ICON_INFO, ICON_FLECHA_DER,
} from './detalleIcons'
import './ProductoDetallePage.css'

const API_URL = import.meta.env.VITE_API_URL
const WA_POR_DEFECTO = 'https://wa.me/573138909118'
const IMAGEN_POR_DEFECTO = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80'

const CAT_LABELS = {
  forros: 'Forros', entretelas: 'Entretelas', hombreras: 'Hombreras',
  guatas: 'Guatas', tizas: 'Tizas', cierres: 'Cierres', otros: 'Otros materiales',
}

const money = (n) => `$${Number(n).toLocaleString('es-CO')}`

// "Por metro" -> "metro(s)" para la etiqueta junto al selector de cantidad.
// Las palabras terminadas en consonante llevan "(es)", no "(s)".
function unidadContable(unidad) {
  const base = (unidad || '').replace(/^(por|venta por)\s+/i, '').trim().toLowerCase()
  if (!base) return 'unidad(es)'
  return /[aeiou]$/.test(base) ? `${base}(s)` : `${base}(es)`
}

/**
 * Al pasar de un producto a otro (por ejemplo desde "También te puede
 * interesar") queremos empezar de cero: cantidad en 1, sin color elegido,
 * primera foto y primer acordeón. Con `key={id}` React desmonta y vuelve a
 * montar la ficha, que es más simple que resetear cada estado a mano.
 */
export default function ProductoDetallePage() {
  const { id } = useParams()
  return <FichaProducto id={id} key={id} />
}

function FichaProducto({ id }) {
  const navigate = useNavigate()
  const productos = useProductos()
  const tienda = useTiendaInfo()
  const { user } = useAuth()
  const waLink = tienda.whatsapp_link || WA_POR_DEFECTO

  const producto = useMemo(() => productos.find((p) => String(p.id) === String(id)), [productos, id])

  const [cantidad, setCantidad] = useState(1)
  const [variante, setVariante] = useState(null)
  const [avisoVariante, setAvisoVariante] = useState(false)
  const [imagenActiva, setImagenActiva] = useState(null)
  const [accAbierto, setAccAbierto] = useState('descripcion')
  const [agregado, setAgregado] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  // null = el cliente todavía no ha tocado el campo. Se guarda así, y no
  // con el correo de la sesión como valor inicial, porque la sesión llega
  // asincrónica: al primer render `user` suele ser null todavía. Derivarlo
  // (más abajo, `correo`) evita tener que sincronizarlo con un efecto.
  const [correoAviso, setCorreoAviso] = useState(null)
  const [avisoEnviado, setAvisoEnviado] = useState(false)
  const [enviandoAviso, setEnviandoAviso] = useState(false)
  const [errorAviso, setErrorAviso] = useState('')

  if (productos.length === 0) {
    return (
      <div className="detalle-page">
        <SiteHeader activeLink="catalogo" />
        <div className="detalle-estado">Cargando producto…</div>
        <SiteFooter />
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="detalle-page">
        <SiteHeader activeLink="catalogo" />
        <div className="detalle-estado">
          <h2>No encontramos ese producto</h2>
          <p>Puede que ya no esté en el catálogo.</p>
          <button className="btn-add-big" onClick={() => navigate('/catalogo')}>Ver el catálogo</button>
        </div>
        <SiteFooter />
      </div>
    )
  }

  // Disponibilidad del producto entero. El backend ya la calculó: tiene en
  // cuenta el interruptor manual y, si hay variantes, que quede al menos una.
  const productoDisponible = producto.disponible !== false

  const categoriaLabel = CAT_LABELS[producto.categoria] || 'Materiales'

  // Variantes: colores, estampados... El nombre del grupo lo pone la tienda
  // en productos_meta.variante_etiqueta, así que no asumimos "Color".
  const variantes = producto.variantes || []
  const tieneVariantes = variantes.length > 0
  const varianteEtiqueta = producto.varianteEtiqueta || 'Opción'
  const varianteElegida = variantes.find((v) => v.nombre === variante) || null

  // producto_imagenes devuelve objetos { url, alt }. Antes eran cadenas
  // sueltas, así que se aceptan las dos formas mientras quede algún dato viejo.
  const urlDe = (i) => (typeof i === 'string' ? i : i?.url)
  const listaUrls = (arr) => (arr || []).map(urlDe).filter(Boolean)

  // La galería sigue a la variante elegida. Si esa variante no tiene fotos
  // propias, el backend ya le pasó las del producto; y si no hay ninguna,
  // queda la foto de la tarjeta del catálogo.
  const galeria = varianteElegida
    ? listaUrls(varianteElegida.imagenes)
    : listaUrls(producto.imagenes)
  const imagenes = galeria.length > 0 ? galeria : [producto.imagen || IMAGEN_POR_DEFECTO]
  const imagenPrincipal = imagenActiva ?? imagenes[0]

  // Lo que manda en la parte de compra: si eligieron una variante agotada,
  // la ficha pasa al modo agotado aunque el producto en general sí esté.
  const disponible = productoDisponible && (!varianteElegida || varianteElegida.disponible)

  // Si el cliente no ha escrito nada, se muestra el correo de su sesión.
  const correo = correoAviso ?? (user?.email || '')

  // Anota al cliente para el aviso de reingreso. Si hay una variante
  // elegida se manda su id: quien espera el Beige no debe recibir el
  // correo porque volvió el Negro. Sin variante elegida, el aviso es del
  // producto entero y sale cuando vuelva cualquiera de sus opciones.
  async function pedirAviso(e) {
    e.preventDefault()
    setErrorAviso('')
    setEnviandoAviso(true)
    try {
      const res = await fetch(`${API_URL}/api/avisos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo,
          alegraId: producto.id,
          varianteId: varianteElegida?.id ?? null,
        }),
      })
      const datos = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(datos.error || 'No pudimos guardar tu aviso.')
      setAvisoEnviado(true)
    } catch (err) {
      setErrorAviso(err.message || 'No pudimos guardar tu aviso.')
    } finally {
      setEnviandoAviso(false)
    }
  }

  const descripcionLarga = producto.descripcionLarga || producto.descripcion

  const relacionados = productos
    .filter((p) => p.id !== producto.id)
    .sort((a, b) => (a.categoria === producto.categoria ? -1 : 0) - (b.categoria === producto.categoria ? -1 : 0))
    .slice(0, 5)

  // El carrito todavía no existe. Cuando exista, acá va la llamada real;
  // por ahora validamos la variante y confirmamos en pantalla, que es lo
  // que hacía el mockup.
  function agregarAlCarrito() {
    if (tieneVariantes && !variante) { setAvisoVariante(true); return }
    const detalle = `${cantidad} ${unidadContable(producto.unidad)}${variante ? ` — ${variante}` : ''}`
    setAgregado(detalle)
  }

  function consultarPorWhatsApp() {
    const que = variante ? `${producto.nombre} (${variante})` : producto.nombre
    window.open(`${waLink}?text=${encodeURIComponent(`Hola, quiero consultar por ${que}.`)}`, '_blank', 'noopener')
  }

  function elegirVariante(v) {
    setVariante(v.nombre)
    setAvisoVariante(false)
    setImagenActiva(null)   // la galería vuelve a la primera foto de la variante
    setAgregado(null)
  }

  const acordeon = [
    descripcionLarga && {
      clave: 'descripcion', titulo: 'Descripción',
      contenido: <p>{descripcionLarga}</p>,
    },
    producto.usos?.length > 0 && {
      clave: 'usos', titulo: 'Usos recomendados',
      contenido: (
        <div className="usos-grid">
          {producto.usos.map((u) => <div className="uso-item" key={u}>{u}</div>)}
        </div>
      ),
    },
    (producto.detalles?.length > 0 || producto.cuidados || tieneVariantes) && {
      clave: 'material', titulo: 'Detalles del material',
      contenido: (
        <>
          {producto.detalles?.length > 0 && (
            <div className="details-grid">
              {producto.detalles.map((d) => (
                <div className="detail-item" key={d.etiqueta}>
                  <div className="detail-label">{d.etiqueta}</div>
                  <div className="detail-value">{d.valor}</div>
                </div>
              ))}
            </div>
          )}
          {tieneVariantes && (
            <div className="color-samples">
              {variantes.map((v) => (
                <div className="color-sample" key={v.id ?? v.nombre}>
                  {v.hex && <div className="sample-dot" style={{ background: v.hex, borderColor: 'rgba(0,0,0,0.15)' }} />}
                  {v.nombre}{!v.disponible && ' (agotado)'}
                </div>
              ))}
            </div>
          )}
          {producto.cuidados && (
            <div className="cuidados-note">
              <strong><span dangerouslySetInnerHTML={{ __html: ICON_CUIDADOS }} /> Cuidados</strong>
              {producto.cuidados}
            </div>
          )}
        </>
      ),
    },
    {
      clave: 'compra', titulo: 'Detalles de compra',
      contenido: (
        <>
          <div className="compra-items">
            <div className="compra-item">
              <span className="compra-icon" dangerouslySetInnerHTML={{ __html: ICON_REGLA }} />
              <div className="compra-text">
                <strong>Unidad de venta:</strong> {(producto.unidad || 'unidad').replace(/^por\s+/i, '')}. Elige la cantidad exacta desde el selector.
              </div>
            </div>
            {tieneVariantes && (
              <div className="compra-item">
                <span className="compra-icon" dangerouslySetInnerHTML={{ __html: ICON_PALETA }} />
                <div className="compra-text">
                  <strong>{varianteEtiqueta}:</strong>{' '}
                  {variantes.filter((v) => v.disponible).map((v) => v.nombre).join(', ') || 'sin opciones disponibles por ahora'}.
                  {' '}Elige una antes de pedir.
                </div>
              </div>
            )}
            <div className="compra-item">
              <span className="compra-icon" dangerouslySetInnerHTML={{ __html: ICON_ENVIO }} />
              <div className="compra-text">
                <strong>Disponible para:</strong> recogida en tienda o domicilio en {tienda.cobertura || 'Bogotá'}.
              </div>
            </div>
          </div>
          <div className="compra-note">
            <span dangerouslySetInnerHTML={{ __html: ICON_INFO }} />
            Si necesitas una referencia exacta o cantidad mayor, confirma por WhatsApp antes de hacer el pedido.
          </div>
        </>
      ),
    },
  ].filter(Boolean)

  return (
    <div className="detalle-page">
      <SiteHeader activeLink="catalogo" />

      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>Inicio</a>
          <span className="sep">/</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/catalogo') }}>Catálogo</a>
          <span className="sep">/</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/catalogo?cat=${producto.categoria}`) }}>{categoriaLabel}</a>
          <span className="sep">/</span>
          <span className="current">{producto.nombre}</span>
        </div>
      </div>

      <section className="product-section">
        <div className="gallery">
          <div className="gallery-main">
            <img src={imagenPrincipal} alt={producto.nombre} />
            <span className="gallery-badge">{categoriaLabel}</span>
          </div>
          {imagenes.length > 1 && (
            <div className="gallery-thumbs">
              {imagenes.map((src, i) => (
                <div
                  className={`thumb ${imagenPrincipal === src ? 'active' : ''}`}
                  key={`${src}-${i}`}
                  onClick={() => setImagenActiva(src)}
                >
                  <img src={src} alt="" />
                </div>
              ))}
            </div>
          )}
          <div className="help-block">
            <p>
              <strong>¿Necesitas una medida o cantidad específica?</strong>
              Si tienes un requerimiento exacto, comunícate con nosotros por WhatsApp
              usando el botón verde en la esquina inferior derecha.
            </p>
          </div>
        </div>

        <div className="product-info">
          <span className="prod-cat-tag">{categoriaLabel}</span>
          <h1 className="prod-name">{producto.nombre}</h1>
          <div className="prod-price">{money(producto.precio)}</div>
          <div className="prod-unit">{producto.unidad || 'Venta por unidad'}</div>

          <div className={`avail-badge ${disponible ? 'available' : 'unavailable'}`}>
            <span className="avail-dot"></span> {disponible ? 'Disponible' : 'Agotado'}
          </div>

          {producto.descripcion && <p className="prod-desc">{producto.descripcion}</p>}

          {tieneVariantes ? (
            <div className="estampado-section">
              <div className="estampado-label">
                {varianteEtiqueta}
                <span className="estampado-selected">
                  {variante
                    ? `— ${variante}${varianteElegida && !varianteElegida.disponible ? ' (agotado)' : ''}`
                    : `— Selecciona ${varianteEtiqueta.toLowerCase()}`}
                </span>
              </div>
              <div className="estampado-grid">
                {variantes.map((v) => {
                  const primeraFoto = listaUrls(v.imagenes)[0]
                  const chip = v.swatch || primeraFoto
                  return (
                    <button
                      type="button"
                      className={`est-swatch ${variante === v.nombre ? 'active' : ''}`}
                      data-stock={v.disponible ? undefined : 'agotado'}
                      key={v.id ?? v.nombre}
                      onClick={() => elegirVariante(v)}
                      aria-pressed={variante === v.nombre}
                      aria-label={`${v.nombre}${v.disponible ? '' : ' (agotado)'}`}
                    >
                      {/* Si no hay foto ni color, el recuadro queda neutro y
                          el nombre de abajo es lo que identifica la opción. */}
                      <span
                        className={`est-thumb ${chip || v.hex ? '' : 'sin-imagen'}`}
                        style={!chip && v.hex ? { background: v.hex } : undefined}
                      >
                        {chip && <img src={chip} alt="" loading="lazy" />}
                      </span>
                      <span className="est-name">{v.nombre}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="single-presentation">
              <span className="sp-main">
                <span className="sp-icon" dangerouslySetInnerHTML={{ __html: ICON_CAJA }} />
                Presentación única
                {producto.presentacion && <span className="sp-sep">&nbsp;·&nbsp;</span>}
              </span>
              {producto.presentacion && <span className="sp-detail">{producto.presentacion}</span>}
            </div>
          )}

          {disponible && (
            <div className="qty-row">
              <span className="qty-label">Cantidad</span>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setCantidad((q) => Math.max(1, q - 1))} aria-label="Quitar uno">−</button>
                <span className="qty-num">{cantidad}</span>
                <button className="qty-btn" onClick={() => setCantidad((q) => q + 1)} aria-label="Agregar uno">+</button>
              </div>
              <span className="qty-unit-tag">{unidadContable(producto.unidad)}</span>
            </div>
          )}

          {avisoVariante && (
            <p className="color-required-msg visible" role="alert">
              ⚠️ Elige {varianteEtiqueta.toLowerCase()} antes de agregar al carrito.
            </p>
          )}

          {agregado && (
            <div className="confirm-banner visible" role="status">
              ✅ {agregado} agregado(s) al carrito.
            </div>
          )}

          {disponible ? (
            <button className="btn-add-big" onClick={agregarAlCarrito}>
              <span dangerouslySetInnerHTML={{ __html: ICON_CARRITO }} />
              Agregar al carrito
            </button>
          ) : (
            <div className="out-of-stock-actions">
              <button className="btn-notify" onClick={() => { setModalAbierto(true); setAvisoEnviado(false) }}>
                🔔 Avísame cuando esté disponible
              </button>
              <button className="btn-alt-wa" onClick={consultarPorWhatsApp}>
                💬 Consultar alternativas por WhatsApp
              </button>
            </div>
          )}

          <div className="prod-accordion">
            {acordeon.map((item) => (
              <div className={`acc-item ${accAbierto === item.clave ? 'open' : ''}`} key={item.clave}>
                <button
                  className="acc-head"
                  type="button"
                  aria-expanded={accAbierto === item.clave}
                  onClick={() => setAccAbierto((a) => (a === item.clave ? null : item.clave))}
                >
                  <span>{item.titulo}</span>
                  <svg className="acc-chevron" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <div className="acc-panel">
                  <div className="acc-panel-inner">{item.contenido}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {relacionados.length > 0 && (
        <section className="related-section">
          <div className="section-header">
            <div>
              <div className="s-label">Complementa tu proyecto</div>
              <h2 className="s-title">También te puede <em>interesar</em></h2>
            </div>
            <a href="#" className="ver-todo" onClick={(e) => { e.preventDefault(); navigate('/catalogo') }}>
              Ver catálogo completo <span dangerouslySetInnerHTML={{ __html: ICON_FLECHA_DER }} />
            </a>
          </div>
          <div className="related-grid">
            {relacionados.map((p) => (
              <a href="#" className="rel-card" key={p.id} onClick={(e) => { e.preventDefault(); navigate(`/producto/${p.id}`) }}>
                <div className="rel-img"><img src={p.imagen || IMAGEN_POR_DEFECTO} alt="" loading="lazy" /></div>
                <div className="rel-body">
                  <div className="rel-name">{p.nombre}</div>
                  <div className="rel-unit">{p.unidad}</div>
                  <div className="rel-price">{money(p.precio)}</div>
                  <div className="rel-btn">Ver producto</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Aviso de reingreso. Solo se llega acá cuando un producto está
          agotado, cosa que hoy no pasa porque Alegra no lleva inventario.
          El correo se guarda en avisos_disponibilidad (POST /api/avisos).
          El envío no es automático todavía: lo dispara la pantalla de
          administración cuando exista, o scripts/enviar-avisos.js. */}
      <div className={`modal-overlay ${modalAbierto ? 'open' : ''}`} onClick={() => setModalAbierto(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Avísame cuando esté disponible">
          <button className="modal-close" onClick={() => setModalAbierto(false)} aria-label="Cerrar">✕</button>
          {!avisoEnviado ? (
            <form className="modal-form" onSubmit={pedirAviso}>
              <div className="modal-icon">🔔</div>
              <h3 className="modal-title">Te avisamos cuando vuelva</h3>
              <p className="modal-sub">
                Déjanos tu correo y te escribimos apenas {producto.nombre}
                {varianteElegida ? ` en ${varianteElegida.nombre}` : ''} esté disponible de nuevo.
              </p>
              <input
                type="email"
                className="modal-input"
                placeholder="tu@correo.com"
                value={correo}
                onChange={(e) => setCorreoAviso(e.target.value)}
                required
              />
              <button type="submit" className="btn-modal-submit" disabled={enviandoAviso}>
                {enviandoAviso ? 'Anotando…' : 'Avísenme'}
              </button>
              {errorAviso && <p className="modal-error">{errorAviso}</p>}
              <p className="modal-privacy">Solo lo usamos para este aviso. No enviamos publicidad.</p>
            </form>
          ) : (
            <div className="modal-confirm" style={{ display: 'flex' }}>
              <div className="confirm-icon">✅</div>
              <h3>¡Listo!</h3>
              <p>Te escribiremos a {correo} apenas vuelva a estar disponible.</p>
              <button className="btn-close-confirm" onClick={() => setModalAbierto(false)}>Cerrar</button>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
