import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useCart } from '../context/useCart'
import { useProductos } from '../hooks/useProductos'
import { useTiendaInfo } from '../hooks/useTiendaInfo'
import './CartPage.css'

const money = (n) => `$${Number(n).toLocaleString('es-CO')}`

// "por metro" / "venta por caja" -> "metro". El catálogo guarda la unidad con
// o sin el "por" delante, así que lo quitamos para mostrarla en singular.
function unidadBase(unidad) {
  return (unidad || '').replace(/^(venta\s+por|por)\s+/i, '').trim().toLowerCase()
}

// Plural sencillo en español para la etiqueta de cantidad (metros, cajas…).
function unidadPlural(unidad) {
  const base = unidadBase(unidad)
  if (!base) return 'unidades'
  if (/[aeiou]$/.test(base)) return `${base}s`
  return `${base}es`
}

// Saca el umbral de envío gratis de un texto libre como
// "Compras superiores a $350.000 COP". Si no hay número, devuelve null y la
// barra no se muestra (mejor callar que inventar una cifra).
function umbralEnvioGratis(texto) {
  if (!texto) return null
  const soloDigitos = String(texto).replace(/[^\d]/g, '')
  const n = Number(soloDigitos)
  return Number.isFinite(n) && n > 0 ? n : null
}

// Una línea está disponible si el catálogo en vivo dice que el producto y la
// variante elegida lo están. Mientras el catálogo carga (productos = []) no se
// marca nada como agotado, para no parpadear.
function lineaDisponible(item, productos) {
  const p = productos.find((pp) => String(pp.id) === String(item.productoId))
  if (!p) return true
  if (p.disponible === false) return false
  if (item.variante?.id != null) {
    const v = (p.variantes || []).find((vv) => String(vv.id) === String(item.variante.id))
    if (v) return v.disponible !== false
  }
  return true
}

export default function CartPage() {
  const { items, cambiarCantidad, quitar } = useCart()
  const productos = useProductos()
  const info = useTiendaInfo()
  const navigate = useNavigate()

  // Anota cada línea con su disponibilidad actual.
  const lineas = useMemo(
    () => items.map((l) => ({ ...l, disponible: lineaDisponible(l, productos) })),
    [items, productos]
  )

  const disponibles = lineas.filter((l) => l.disponible)
  const hayAgotados = lineas.some((l) => !l.disponible)

  // El total solo suma lo que de verdad se puede comprar.
  const subtotal = disponibles.reduce((s, l) => s + l.precio * l.cantidad, 0)
  const totalArticulos = lineas.reduce((s, l) => s + l.cantidad, 0)

  const umbral = umbralEnvioGratis(info.envio_gratis_desde)
  const faltaEnvioGratis = umbral ? Math.max(0, umbral - subtotal) : null
  const progresoEnvio = umbral ? Math.min(100, Math.round((subtotal / umbral) * 100)) : 0

  function irAlPago() {
    if (hayAgotados || subtotal <= 0) return
    navigate('/checkout')
  }

  return (
    <div className="cart-page">
      <SiteHeader activeLink="catalogo" />

      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <Link to="/">Inicio</Link><span className="sep">/</span>
          <span className="current">Carrito</span>
        </div>
      </div>

      <section className="cart-wrap">
        {items.length === 0 ? (
          /* ── VACÍO ── */
          <>
            <div className="cart-head"><h1 className="cart-title">Tu carrito</h1></div>
            <div className="cart-vacio">
              <div className="vacio-icono">🧺</div>
              <div className="vacio-titulo">Todavía no has agregado nada</div>
              <p className="vacio-texto">
                Cuando encuentres el material que buscas, aparecerá acá.
                Si no sabes cuál te conviene, escríbenos y te orientamos sin costo.
              </p>
              <Link className="btn-catalogo" to="/catalogo">Ver el catálogo</Link>
            </div>
          </>
        ) : (
          /* ── CON PRODUCTOS ── */
          <>
            <div className="cart-head">
              <h1 className="cart-title">Tu carrito</h1>
              <div className="cart-count">
                {lineas.length} {lineas.length === 1 ? 'producto' : 'productos'} · {totalArticulos} artículos en total
              </div>
            </div>

            <div className="cart-layout">
              <div>
                <div className="cart-items">
                  {lineas.map((l) => (
                    <div className={`cart-item ${l.disponible ? '' : 'agotado'}`} key={l.clave}>
                      <img
                        className="ci-img"
                        src={l.imagen || 'https://placehold.co/96x96?text=Russitex'}
                        alt={l.nombre}
                      />
                      <div className="ci-info">
                        {!l.disponible && (
                          <div className="ci-alert">
                            <span className="ci-alert-dot" />
                            Se agotó mientras estaba en tu carrito. Quítalo para continuar.
                          </div>
                        )}
                        <div className="ci-name">
                          <Link to={`/producto/${l.productoId}`}>{l.nombre}</Link>
                        </div>
                        {l.variante && (
                          <div className="ci-variant">
                            {l.variante.hex && (
                              <span className="ci-swatch" style={{ background: l.variante.hex }} />
                            )}
                            {l.variante.nombre}
                          </div>
                        )}
                        {unidadBase(l.unidad) && (
                          <div className="ci-unit">Venta <strong>por {unidadBase(l.unidad)}</strong></div>
                        )}

                        {l.disponible ? (
                          <div className="ci-actions">
                            <div className="qty">
                              <button
                                type="button"
                                aria-label="Quitar uno"
                                onClick={() => cambiarCantidad(l.clave, l.cantidad - 1)}
                                disabled={l.cantidad <= 1}
                              >−</button>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={l.cantidad}
                                aria-label="Cantidad"
                                onChange={(e) => {
                                  const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10)
                                  if (!Number.isNaN(n)) cambiarCantidad(l.clave, n)
                                }}
                              />
                              <button
                                type="button"
                                aria-label="Añadir uno"
                                onClick={() => cambiarCantidad(l.clave, l.cantidad + 1)}
                              >+</button>
                            </div>
                            <span className="qty-label">{unidadPlural(l.unidad)}</span>
                            <button className="ci-remove" type="button" onClick={() => quitar(l.clave)}>
                              Quitar
                            </button>
                          </div>
                        ) : (
                          <div className="ci-actions">
                            <button className="ci-remove" type="button" onClick={() => quitar(l.clave)}>
                              Quitar del carrito
                            </button>
                            <Link className="ci-remove" to={`/producto/${l.productoId}`}>
                              Avísame cuando vuelva
                            </Link>
                          </div>
                        )}
                      </div>
                      <div className="ci-price">
                        <div className="ci-total" style={l.disponible ? undefined : { color: 'var(--gris-calido)' }}>
                          {money(l.precio * l.cantidad)}
                        </div>
                        <div className="ci-each">{money(l.precio)} c/{unidadBase(l.unidad) || 'u'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {umbral && faltaEnvioGratis > 0 && (
                  <div className="envio-libre">
                    <div className="envio-libre-txt">
                      Te faltan <strong>{money(faltaEnvioGratis)}</strong> para tener <strong>envío gratis</strong> a toda Colombia.
                    </div>
                    <div className="barra"><span style={{ width: `${progresoEnvio}%` }} /></div>
                  </div>
                )}
                {umbral && faltaEnvioGratis === 0 && subtotal > 0 && (
                  <div className="envio-libre">
                    <div className="envio-libre-txt"><strong>¡Tienes envío gratis!</strong> 🎉</div>
                  </div>
                )}
              </div>

              <aside className="resumen">
                <h2>Resumen</h2>
                <div className="res-fila">
                  <span>Subtotal ({disponibles.length} {disponibles.length === 1 ? 'producto' : 'productos'})</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="res-fila"><span>Envío</span><span className="res-nota">Se calcula al pagar</span></div>
                <div className="res-fila"><span>IVA</span><span className="res-nota">Incluido</span></div>

                <div className="res-total">
                  <span className="res-total-label">Total</span>
                  <span className="res-total-valor">{money(subtotal)}</span>
                </div>

                {hayAgotados && (
                  <p className="res-aviso">Quita el producto agotado para continuar al pago.</p>
                )}

                <button
                  className="btn-pagar"
                  type="button"
                  onClick={irAlPago}
                  disabled={hayAgotados || subtotal <= 0}
                >
                  Continuar al pago
                </button>
                <Link className="btn-seguir" to="/catalogo">Seguir comprando</Link>

                <div className="res-seguro">
                  <svg viewBox="0 0 24 24"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8Z" /></svg>
                  Pago protegido con Wompi
                </div>
              </aside>
            </div>
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  )
}
