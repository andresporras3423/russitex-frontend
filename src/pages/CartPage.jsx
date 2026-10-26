import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useCart } from '../context/useCart'
import { useProductos } from '../hooks/useProductos'
import { useTiendaInfo } from '../hooks/useTiendaInfo'
import { PORCENTAJE_DESCUENTO, umbralDescuento, calcularDescuento } from '../lib/descuento'
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

  // Descuento por compra grande: solo sobre los productos, el envío no lleva.
  const umbral = umbralDescuento(info.descuento_compra_desde)
  const faltaDescuento = umbral ? Math.max(0, umbral - subtotal) : null
  const progresoDescuento = umbral ? Math.min(100, Math.round((subtotal / umbral) * 100)) : 0
  const descuento = calcularDescuento(disponibles, umbral)

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
              <div className="vacio-icono">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ariaHidden="true"><path d="M22.713,4.077A2.993,2.993,0,0,0,20.41,3H4.242L4.2,2.649A3,3,0,0,0,1.222,0H1A1,1,0,0,0,1,2h.222a1,1,0,0,1,.993.883l1.376,11.7A5,5,0,0,0,8.557,19H19a1,1,0,0,0,0-2H8.557a3,3,0,0,1-2.82-2h11.92a5,5,0,0,0,4.921-4.113l.785-4.354A2.994,2.994,0,0,0,22.713,4.077ZM21.4,6.178l-.786,4.354A3,3,0,0,1,17.657,13H5.419L4.478,5H20.41A1,1,0,0,1,21.4,6.178Z" /><circle cx="7" cy="22" r="2" /><circle cx="17" cy="22" r="2" /></svg>
              </div>
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

            {hayAgotados && (
              <div className="cart-warning" role="alert">
                <span className="cw-dot" />
                <span>Tienes un producto <strong>agotado</strong> en tu carrito. Quítalo para poder continuar al pago.</span>
              </div>
            )}

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

                {umbral && faltaDescuento > 0 && (
                  <div className="envio-libre">
                    <div className="envio-libre-txt">
                      Te faltan <strong>{money(faltaDescuento)}</strong> para tener <strong>{PORCENTAJE_DESCUENTO}% de descuento</strong> en tus productos.
                    </div>
                    <div className="barra"><span style={{ width: `${progresoDescuento}%` }} /></div>
                  </div>
                )}
                {umbral && faltaDescuento === 0 && subtotal > 0 && (
                  <div className="envio-libre">
                    <div className="envio-libre-txt"><strong>¡Tienes {PORCENTAJE_DESCUENTO}% de descuento en tus productos!</strong> 🎉</div>
                  </div>
                )}
              </div>

              <aside className="resumen">
                <h2>Resumen</h2>
                <div className="res-fila">
                  <span>Subtotal ({disponibles.length} {disponibles.length === 1 ? 'producto' : 'productos'})</span>
                  <span>{money(subtotal)}</span>
                </div>
                {descuento > 0 && (
                  <div className="res-fila"><span>Descuento {PORCENTAJE_DESCUENTO}%</span><span className="res-desc">-{money(descuento)}</span></div>
                )}
                <div className="res-fila"><span>Envío</span><span className="res-nota">Se calcula al pagar</span></div>

                <div className="res-total">
                  <span className="res-total-label">Total</span>
                  <span className="res-total-valor">{money(subtotal - descuento)}</span>
                </div>

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
