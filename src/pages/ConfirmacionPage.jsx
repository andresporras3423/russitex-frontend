import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useCart } from '../context/useCart'
import './ConfirmacionPage.css'

const API_URL = import.meta.env.VITE_API_URL
const money = (n) => `$${Number(n).toLocaleString('es-CO')}`

export default function ConfirmacionPage() {
  const { vaciar } = useCart()
  const [cargando, setCargando] = useState(true)
  const [pedido, setPedido] = useState(null)   // { referencia, estado, total, cliente }
  const [sinRef, setSinRef] = useState(false)

  useEffect(() => {
    let activo = true
    async function consultar() {
      let ref = null
      try { ref = localStorage.getItem('russitex_ultima_ref') } catch { /* sin storage */ }
      if (!ref) { if (activo) { setSinRef(true); setCargando(false) } return }

      // El webhook de Wompi puede tardar un momento; se reintenta unas veces.
      for (let intento = 0; intento < 4 && activo; intento++) {
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
      if (activo) setCargando(false)
    }
    consultar()
    return () => { activo = false }
  }, [vaciar])

  const estado = pedido?.estado

  return (
    <div className="confirmacion-page">
      <SiteHeader activeLink="catalogo" />
      <section className="cf-wrap">
        <div className="cf-card">
          {cargando ? (
            <>
              <div className="cf-icono cf-espera">⏳</div>
              <h1 className="cf-titulo">Confirmando tu pago…</h1>
              <p className="cf-texto">Un momento, estamos verificando el estado de tu pedido.</p>
            </>
          ) : sinRef ? (
            <>
              <div className="cf-icono">🧾</div>
              <h1 className="cf-titulo">Gracias por tu compra</h1>
              <p className="cf-texto">Si completaste el pago, te llegará la confirmación por correo. Si tienes dudas, escríbenos por WhatsApp.</p>
            </>
          ) : estado === 'APROBADO' ? (
            <>
              <div className="cf-icono cf-ok">✅</div>
              <h1 className="cf-titulo">¡Pago aprobado!</h1>
              <p className="cf-texto">Tu pedido <strong>{pedido.referencia}</strong> quedó confirmado{pedido.total ? ` por ${money(pedido.total)}` : ''}. Te enviaremos la guía del envío a tu correo.</p>
            </>
          ) : estado === 'PENDIENTE' ? (
            <>
              <div className="cf-icono cf-espera">⏳</div>
              <h1 className="cf-titulo">Estamos confirmando tu pago</h1>
              <p className="cf-texto">Recibimos tu pedido <strong>{pedido.referencia}</strong> y estamos esperando la confirmación de Wompi. En cuanto se apruebe te avisamos por correo.</p>
            </>
          ) : (
            <>
              <div className="cf-icono cf-error">⚠️</div>
              <h1 className="cf-titulo">El pago no se completó</h1>
              <p className="cf-texto">Tu pedido {pedido?.referencia ? <strong>{pedido.referencia}</strong> : ''} quedó como <strong>{estado || 'no confirmado'}</strong>. Puedes intentar de nuevo desde el carrito.</p>
            </>
          )}

          <div className="cf-acciones">
            <Link className="cf-btn" to="/catalogo">Seguir comprando</Link>
            {!cargando && estado && estado !== 'APROBADO' && estado !== 'PENDIENTE' && (
              <Link className="cf-btn cf-btn-sec" to="/carrito">Volver al carrito</Link>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
