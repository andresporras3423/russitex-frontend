import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import './MiniCart.css'

// Panel lateral del carrito (diseño version2: russitexui.js "Mini carrito").
// Se monta una sola vez en App.jsx; lo abren el ícono del carrito y el botón
// "Agregar" (CartContext.agregar).

const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`

const IcoCarrito = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.713,4.077A2.993,2.993,0,0,0,20.41,3H4.242L4.2,2.649A3,3,0,0,0,1.222,0H1A1,1,0,0,0,1,2h.222a1,1,0,0,1,.993.883l1.376,11.7A5,5,0,0,0,8.557,19H19a1,1,0,0,0,0-2H8.557a3,3,0,0,1-2.82-2h11.92a5,5,0,0,0,4.921-4.113l.785-4.354A2.994,2.994,0,0,0,22.713,4.077ZM21.4,6.178l-.786,4.354A3,3,0,0,1,17.657,13H5.419L4.478,5H20.41A1,1,0,0,1,21.4,6.178Z" /><circle cx="7" cy="22" r="2" /><circle cx="17" cy="22" r="2" /></svg>
const IcoX = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>

export default function MiniCart() {
  const { items, totalArticulos, subtotal, cambiarCantidad, quitar, panelAbierto, cerrarPanel } = useCart()

  // Escape cierra; mientras está abierto la página de atrás no se desplaza.
  useEffect(() => {
    if (!panelAbierto) return undefined
    const alTeclear = (e) => { if (e.key === 'Escape') cerrarPanel() }
    document.addEventListener('keydown', alTeclear)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = antes
    }
  }, [panelAbierto, cerrarPanel])

  return (
    <>
      <div className={`mc-overlay ${panelAbierto ? 'visible' : ''}`} onClick={cerrarPanel} />
      <div className={`mini-cart ${panelAbierto ? 'open' : ''}`} role="dialog" aria-label="Carrito de compra" aria-hidden={!panelAbierto}>
        <div className="mc-header">
          <div>
            <div className="mc-title">Carrito de compra</div>
            <div className="mc-count">{totalArticulos === 1 ? '1 producto' : `${totalArticulos} productos`}</div>
          </div>
          <button className="mc-close" onClick={cerrarPanel} aria-label="Cerrar carrito"><IcoX /></button>
        </div>

        {items.length === 0 ? (
          <div className="mc-empty">
            <div className="mc-empty-icon"><IcoCarrito /></div>
            <h3>Tu carrito está vacío</h3>
            <p>Aún no has agregado ningún material. Explora el catálogo y encuentra lo que necesitas para tu proyecto.</p>
            <Link to="/catalogo" className="mc-btn-primary" onClick={cerrarPanel}>Explorar catálogo</Link>
          </div>
        ) : (
          <>
            <div className="mc-items">
              {items.map((i) => (
                <div className="mc-item" key={i.clave}>
                  {i.imagen ? <img className="mc-item-img" src={i.imagen} alt="" /> : <div className="mc-item-img" />}
                  <div className="mc-item-info">
                    {i.categoria && <div className="mc-item-cat">{i.categoria}</div>}
                    <div className="mc-item-name">{i.nombre}</div>
                    <div className="mc-item-variant">{i.variante?.nombre || `${money(i.precio)} c/u`}</div>
                    <div className="mc-item-bottom">
                      <div className="mc-qty">
                        <button className="mc-qty-btn" aria-label="Quitar uno"
                          onClick={() => (i.cantidad > 1 ? cambiarCantidad(i.clave, i.cantidad - 1) : quitar(i.clave))}>−</button>
                        <span className="mc-qty-num">{i.cantidad}</span>
                        <button className="mc-qty-btn" aria-label="Agregar uno" onClick={() => cambiarCantidad(i.clave, i.cantidad + 1)}>+</button>
                      </div>
                      <span className="mc-item-price">{money(i.precio * i.cantidad)}</span>
                      <button className="mc-item-remove" aria-label="Eliminar" onClick={() => quitar(i.clave)}><IcoX /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mc-footer">
              <div className="mc-summary-row"><span className="mc-summary-label">Subtotal</span><span className="mc-summary-value">{money(subtotal)}</span></div>
              <div className="mc-summary-row"><span className="mc-summary-label">Envío</span><span className="mc-summary-value">Se calcula al pagar</span></div>
              <div className="mc-divider" />
              <div className="mc-total-row"><span className="mc-total-label">Total</span><span className="mc-total-value">{money(subtotal)}</span></div>
              <div className="mc-actions">
                <Link to="/checkout" className="mc-btn-pagar" onClick={cerrarPanel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  Ir a pagar
                </Link>
                <Link to="/carrito" className="mc-btn-ver" onClick={cerrarPanel}>Ver carrito</Link>
              </div>
              <div className="mc-secure">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Compra segura con Wompi
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
