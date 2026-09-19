import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useCart } from '../context/useCart'
import './CheckoutPage.css'

const money = (n) => `$${Number(n).toLocaleString('es-CO')}`

// Provisional: el costo real del domicilio lo devolverá MiPaquete según ciudad
// cuando se conecte el pago. Por ahora una tarifa fija para poder mostrar el total.
const ENVIO_DOMICILIO = 10000

function unidadBase(unidad) {
  return (unidad || '').replace(/^(venta\s+por|por)\s+/i, '').trim().toLowerCase()
}

const DEPARTAMENTOS = ['Cundinamarca', 'Antioquia', 'Valle del Cauca', 'Atlántico']
const CIUDADES = ['Bogotá D.C.', 'Soacha', 'Chía']

export default function CheckoutPage() {
  const { items, subtotal } = useCart()
  const navigate = useNavigate()

  const [envio, setEnvio] = useState('domicilio')     // 'domicilio' | 'tienda'
  const [acepta, setAcepta] = useState(false)
  const [enviado, setEnviado] = useState(false)       // muestra el aviso "próximamente"
  const [form, setForm] = useState({
    nombre: '', apellido: '', tipodoc: 'C.C.', doc: '', cel: '', correo: '',
    depto: DEPARTAMENTOS[0], ciudad: CIUDADES[0], dir: '', notas: '',
  })

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const costoEnvio = envio === 'domicilio' ? ENVIO_DOMICILIO : 0
  const total = subtotal + costoEnvio

  // Campos mínimos para poder facturar (Alegra) y cobrar (Wompi).
  const formularioValido = useMemo(() => {
    return (
      form.nombre.trim() && form.apellido.trim() && form.doc.trim() &&
      form.cel.trim() && /\S+@\S+\.\S+/.test(form.correo) &&
      (envio === 'tienda' || form.dir.trim()) && acepta
    )
  }, [form, envio, acepta])

  // Carrito vacío: no tiene sentido el checkout.
  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <SiteHeader activeLink="catalogo" />
        <section className="co-wrap">
          <div className="co-vacio">
            <h1 className="co-title">Finalizar compra</h1>
            <p>No hay nada en tu carrito todavía.</p>
            <Link className="btn-pagar" to="/catalogo" style={{ display: 'inline-block', width: 'auto', padding: '0.9rem 2rem' }}>
              Ver el catálogo
            </Link>
          </div>
        </section>
        <SiteFooter />
      </div>
    )
  }

  function pagar() {
    if (!formularioValido) return
    // TODO (etapa 3 — Wompi): llamar a POST /api/pagos/preparar con
    //   { carrito: items.map(i => ({ productoId, nombre, cantidad, precio })),
    //     cliente: { nombre: `${nombre} ${apellido}`, email: correo, telefono: cel },
    //     envio: { ciudad, direccion: dir, departamento: depto } }
    // y redirigir al widget de Wompi con la firma que devuelve.
    setEnviado(true)
  }

  return (
    <div className="checkout-page">
      <SiteHeader activeLink="catalogo" />

      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <Link to="/">Inicio</Link><span className="sep">/</span>
          <Link to="/carrito">Carrito</Link><span className="sep">/</span>
          <span className="current">Finalizar compra</span>
        </div>
      </div>

      <section className="co-wrap">
        <div className="pasos">
          <div className="paso hecho"><span className="paso-num">✓</span> <span>Carrito</span></div>
          <div className="paso-linea" />
          <div className="paso activo"><span className="paso-num">2</span> <span>Datos y envío</span></div>
          <div className="paso-linea" />
          <div className="paso"><span className="paso-num">3</span> <span>Pago</span></div>
        </div>

        <h1 className="co-title">Finalizar compra</h1>

        <div className="co-layout">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* ── TUS DATOS ── */}
            <div className="bloque">
              <h2>Tus datos</h2>
              <p className="bloque-sub">Los necesitamos para emitir la factura y para que la transportadora te ubique.</p>

              <div className="fila">
                <div className="campo">
                  <label htmlFor="nombre">Nombre</label>
                  <input id="nombre" type="text" placeholder="María" value={form.nombre} onChange={set('nombre')} />
                </div>
                <div className="campo">
                  <label htmlFor="apellido">Apellidos</label>
                  <input id="apellido" type="text" placeholder="Gómez Ruiz" value={form.apellido} onChange={set('apellido')} />
                </div>
              </div>

              <div className="fila">
                <div className="campo">
                  <label htmlFor="doc">Documento</label>
                  <div className="doc">
                    <select id="tipodoc" aria-label="Tipo de documento" value={form.tipodoc} onChange={set('tipodoc')}>
                      <option>C.C.</option><option>NIT</option><option>C.E.</option>
                    </select>
                    <input id="doc" type="text" placeholder="1020304050" value={form.doc} onChange={set('doc')} />
                  </div>
                  <span className="ayuda">Va en la factura.</span>
                </div>
                <div className="campo">
                  <label htmlFor="cel">Celular</label>
                  <input id="cel" type="tel" placeholder="300 123 4567" value={form.cel} onChange={set('cel')} />
                  <span className="ayuda">Por aquí avisa la transportadora.</span>
                </div>
              </div>

              <div className="fila una">
                <div className="campo">
                  <label htmlFor="correo">Correo electrónico</label>
                  <input id="correo" type="email" placeholder="maria@correo.com" value={form.correo} onChange={set('correo')} />
                  <span className="ayuda">Ahí te llega la confirmación y la guía del envío.</span>
                </div>
              </div>
            </div>

            {/* ── DIRECCIÓN ── */}
            <div className="bloque">
              <h2>Dirección de entrega</h2>
              <p className="bloque-sub">Con el departamento y la ciudad calculamos el costo del envío.</p>

              <div className="fila">
                <div className="campo">
                  <label htmlFor="depto">Departamento</label>
                  <select id="depto" value={form.depto} onChange={set('depto')}>
                    {DEPARTAMENTOS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor="ciudad">Ciudad</label>
                  <select id="ciudad" value={form.ciudad} onChange={set('ciudad')}>
                    {CIUDADES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="fila una">
                <div className="campo">
                  <label htmlFor="dir">Dirección</label>
                  <input id="dir" type="text" placeholder="Calle 66 # 21-50" value={form.dir} onChange={set('dir')} disabled={envio === 'tienda'} />
                  {envio === 'tienda' && <span className="ayuda">No hace falta: vas a recoger en la tienda.</span>}
                </div>
              </div>

              <div className="fila una">
                <div className="campo">
                  <label htmlFor="notas">Indicaciones para la entrega <span className="opt">(opcional)</span></label>
                  <textarea id="notas" placeholder="Apartamento, conjunto, punto de referencia, a qué horas hay alguien…" value={form.notas} onChange={set('notas')} />
                </div>
              </div>
            </div>

            {/* ── ENTREGA ── */}
            <div className="bloque">
              <h2>Forma de entrega</h2>
              <p className="bloque-sub">Las opciones cambian según la ciudad que elegiste.</p>

              <label className={`envio-op ${envio === 'domicilio' ? 'sel' : ''}`}>
                <input type="radio" name="envio" checked={envio === 'domicilio'} onChange={() => setEnvio('domicilio')} />
                <div className="envio-op-txt">
                  <div className="envio-op-nom">Domicilio</div>
                  <div className="envio-op-desc">Entrega el mismo día en Bogotá si pides antes de las 12:00 p.m. Si no, al día siguiente.</div>
                </div>
                <div className="envio-op-precio">{money(ENVIO_DOMICILIO)}</div>
              </label>

              <label className={`envio-op ${envio === 'tienda' ? 'sel' : ''}`}>
                <input type="radio" name="envio" checked={envio === 'tienda'} onChange={() => setEnvio('tienda')} />
                <div className="envio-op-txt">
                  <div className="envio-op-nom">Recoger en la tienda</div>
                  <div className="envio-op-desc">Calle 66 No 21-50, Bogotá. Te avisamos por WhatsApp cuando esté listo.</div>
                </div>
                <div className="envio-op-precio gratis">Gratis</div>
              </label>
            </div>

            {/* ── PAGO ── */}
            <div className="bloque">
              <h2>Pago</h2>
              <p className="bloque-sub">El cobro lo procesa Wompi. Nosotros nunca vemos los datos de tu tarjeta.</p>

              <div className="pago-caja">
                <svg viewBox="0 0 24 24"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8Z" /></svg>
                <div className="pago-txt">
                  Al confirmar te llevamos a <strong>Wompi</strong> para completar el pago. Cuando termines
                  vuelves acá con la confirmación del pedido.
                  <div className="medios">
                    <span className="medio">Tarjetas</span>
                    <span className="medio">PSE</span>
                    <span className="medio">Nequi</span>
                    <span className="medio">Daviplata</span>
                  </div>
                </div>
              </div>

              <label className="acepto">
                <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
                <span>Acepto los <Link to="/preguntas-frecuentes">Términos y condiciones</Link> y la <Link to="/preguntas-frecuentes">Política de privacidad</Link>.</span>
              </label>
            </div>
          </form>

          {/* ── RESUMEN ── */}
          <aside className="resumen">
            <h2>Tu pedido</h2>

            {items.map((l) => (
              <div className="res-item" key={l.clave}>
                <img src={l.imagen || 'https://placehold.co/48x48?text=R'} alt="" />
                <div>
                  <div className="res-item-nom">{l.nombre}</div>
                  <div className="res-item-det">
                    {l.variante ? `${l.variante.nombre} · ` : ''}{l.cantidad} {unidadBase(l.unidad) || 'u'}{l.cantidad !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="res-item-val">{money(l.precio * l.cantidad)}</div>
              </div>
            ))}

            <div className="res-fila"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="res-fila"><span>Envío</span><span>{costoEnvio === 0 ? 'Gratis' : money(costoEnvio)}</span></div>
            <div className="res-fila"><span>IVA</span><span>Incluido</span></div>

            <div className="res-total">
              <span className="res-total-label">Total a pagar</span>
              <span className="res-total-valor">{money(total)}</span>
            </div>

            {enviado ? (
              <div className="co-proximamente">
                💳 El pago con Wompi estará disponible muy pronto. Tus datos y tu pedido quedaron listos;
                por ahora puedes finalizar la compra escribiéndonos por WhatsApp.
              </div>
            ) : (
              <>
                <button className="btn-pagar" type="button" onClick={pagar} disabled={!formularioValido}>
                  Pagar con Wompi
                </button>
                {!formularioValido && (
                  <p className="co-nota-form">Completa tus datos, la dirección y acepta los términos para continuar.</p>
                )}
              </>
            )}
            <button className="btn-volver" type="button" onClick={() => navigate('/carrito')}>Volver al carrito</button>

            <div className="res-seguro">
              <svg viewBox="0 0 24 24"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8Z" /></svg>
              Conexión cifrada. Russitex no almacena datos de tarjetas.
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
