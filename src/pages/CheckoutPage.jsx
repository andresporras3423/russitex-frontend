import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useCart } from '../context/useCart'
import { useAuth } from '../context/useAuth'
import { digitoVerificacion } from '../lib/nit'
import './CheckoutPage.css'

const API_URL = import.meta.env.VITE_API_URL
const money = (n) => `$${Number(n).toLocaleString('es-CO')}`

// Compras sin cuenta: el formulario se recuerda en ESTE navegador para la
// próxima vez (localStorage, no cookies: no viaja al servidor). Nunca datos
// de pago: esos los maneja Wompi. "No soy yo" lo borra.
const CLAVE_DATOS = 'russitex_datos_checkout'
function leerDatosLocales() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_DATOS) || 'null')
    return d && typeof d === 'object' && d.form ? d : null
  } catch {
    return null
  }
}
const FORM_VACIO = {
  nombre: '', apellido: '', tipodoc: 'C.C.', doc: '', cel: '', correo: '',
  ciudad: '', dir: '', notas: '',
  razon: '', nit: '', nitdv: '', regimen: '',   // solo con "Datos de empresa"
}

function unidadBase(unidad) {
  return (unidad || '').replace(/^(venta\s+por|por)\s+/i, '').trim().toLowerCase()
}

export default function CheckoutPage() {
  const { items, subtotal } = useCart()
  const { token } = useAuth()
  const navigate = useNavigate()

  // Sin sesión: lo que quedó guardado en este navegador la última vez.
  const [locales] = useState(() => (token ? null : leerDatosLocales()))
  const [recordados, setRecordados] = useState(Boolean(locales))   // muestra "No soy yo"

  const [envio, setEnvio] = useState(locales?.envio === 'tienda' ? 'tienda' : 'domicilio')   // 'domicilio' | 'tienda'
  const [acepta, setAcepta] = useState(false)
  const [pagando, setPagando] = useState(false)       // preparando el pago / redirigiendo
  const [errorPago, setErrorPago] = useState('')
  const [totalAceptado, setTotalAceptado] = useState(null)   // total del servidor ya avisado
  const [form, setForm] = useState(() => ({ ...FORM_VACIO, ...(locales?.form || {}) }))
  const [esEmpresa, setEsEmpresa] = useState(Boolean(locales?.esEmpresa))

  // Municipios (con código DANE). Se elige en dos pasos: departamento y municipio.
  const [ciudades, setCiudades] = useState([])
  const [deptoSel, setDeptoSel] = useState(locales?.depto || '')            // departamento elegido
  const [daneDestino, setDaneDestino] = useState(locales?.dane || null)     // municipio elegido (código DANE)

  function olvidarDatos() {
    try { localStorage.removeItem(CLAVE_DATOS) } catch { /* nada que borrar */ }
    setForm(FORM_VACIO); setEsEmpresa(false); setDeptoSel(''); setDaneDestino(null)
    setEnvio('domicilio'); setRecordados(false)
  }

  // Cotización del envío en vivo.
  const [cotizando, setCotizando] = useState(false)
  const [envioCotizado, setEnvioCotizado] = useState(null)   // { costoTotal, transportadora }
  const [errorEnvio, setErrorEnvio] = useState('')

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  // El DV se llena solo al escribir el NIT (se puede corregir a mano).
  const cambiarNit = (e) => {
    const nit = e.target.value
    const limpio = nit.replace(/\D/g, '')
    setForm((f) => ({ ...f, nit, nitdv: limpio ? digitoVerificacion(limpio) : '' }))
  }
  const nitLimpio = form.nit.replace(/\D/g, '')
  const dvCalculado = nitLimpio ? digitoVerificacion(nitLimpio) : ''
  const dvErrado = esEmpresa && form.nitdv !== '' && dvCalculado !== '' && form.nitdv !== dvCalculado

  // Cargar la lista de municipios una vez.
  useEffect(() => {
    let activo = true
    fetch(`${API_URL}/api/envios/ciudades`)
      .then((r) => r.json())
      .then((d) => { if (activo) setCiudades(d.ciudades || []) })
      .catch(() => {})
    return () => { activo = false }
  }, [])

  // Departamentos únicos, ordenados (primer selector).
  const departamentos = useMemo(() => {
    return [...new Set(ciudades.map((c) => c.departamento))].sort((a, b) => a.localeCompare(b, 'es'))
  }, [ciudades])

  // Municipios del departamento elegido, ordenados (segundo selector).
  const municipios = useMemo(() => {
    return ciudades
      .filter((c) => c.departamento === deptoSel)
      .sort((a, b) => a.ciudad.localeCompare(b.ciudad, 'es'))
  }, [ciudades, deptoSel])

  // Al cambiar de departamento se limpia el municipio elegido.
  function elegirDepartamento(dep) {
    setDirGuardada('otra')
    setDeptoSel(dep)
    setDaneDestino(null)
    setForm((f) => ({ ...f, ciudad: '' }))
  }

  // ── Datos de la cuenta (si inició sesión): se prellenan los datos
  //    personales vacíos y la dirección principal guardada. ──
  const [direccionesGuardadas, setDireccionesGuardadas] = useState([])
  const [dirGuardada, setDirGuardada] = useState('otra')   // id | 'otra'

  function aplicarDireccion(d) {
    setDirGuardada(d ? d.id : 'otra')
    setDeptoSel(d ? d.departamento : '')
    setDaneDestino(d ? d.codigoDane : null)
    setForm((f) => ({
      ...f,
      ciudad: d ? d.ciudad : '',
      dir: d ? (d.indicaciones ? `${d.direccion} (${d.indicaciones})` : d.direccion) : '',
    }))
  }
  const elegirDireccionGuardada = (id) => aplicarDireccion(direccionesGuardadas.find((d) => d.id === id) || null)

  useEffect(() => {
    if (!token) return
    let activo = true
    const pedir = (ruta) => fetch(`${API_URL}${ruta}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null)).catch(() => null)
    Promise.all([pedir('/api/cuenta/perfil'), pedir('/api/cuenta/direcciones')]).then(([perfil, dirs]) => {
      if (!activo) return
      if (perfil) {
        const [nombre, ...resto] = String(perfil.nombre || '').trim().split(/\s+/)
        const tipodoc = { CC: 'C.C.', CE: 'C.E.' }[perfil.tipoDocumento]
        // Solo se llenan los campos que el cliente no haya escrito ya.
        setForm((f) => ({
          ...f,
          nombre: f.nombre || nombre || '',
          apellido: f.apellido || resto.join(' '),
          correo: f.correo || perfil.email || '',
          cel: f.cel || perfil.telefono || '',
          doc: f.doc || perfil.documento || '',
          tipodoc: f.doc ? f.tipodoc : (tipodoc || f.tipodoc),
          // La empresa guardada se llena siempre (oculta si no se marca la casilla).
          razon: f.razon || perfil.empresa?.razonSocial || '',
          nit: f.nit || perfil.empresa?.nit || '',
          nitdv: f.nit ? f.nitdv : (perfil.empresa?.nit ? digitoVerificacion(perfil.empresa.nit) : ''),
          regimen: f.regimen || perfil.empresa?.regimen || '',
        }))
        if (perfil.facturarComoEmpresa) setEsEmpresa(true)
      }
      const lista = dirs?.direcciones || []
      setDireccionesGuardadas(lista)
      if (lista.length) aplicarDireccion(lista.find((d) => d.principal) || lista[0])
    })
    return () => { activo = false }
  }, [token])

  // Al elegir municipio se fija el DANE del destino (dispara la cotización).
  function elegirMunicipio(dane) {
    setDirGuardada('otra')
    const c = municipios.find((m) => m.dane === dane)
    setDaneDestino(dane || null)
    setForm((f) => ({ ...f, ciudad: c ? c.ciudad : '' }))
  }

  // Cotizar el envío cada vez que hay ciudad + carrito (solo para domicilio).
  // La lógica va dentro de una función async para no llamar setState en el
  // cuerpo del efecto (igual que CatalogPage).
  useEffect(() => {
    let activo = true
    async function cotizar() {
      if (envio !== 'domicilio' || !daneDestino || items.length === 0) {
        setEnvioCotizado(null); setErrorEnvio(''); setCotizando(false)
        return
      }
      setCotizando(true); setErrorEnvio(''); setEnvioCotizado(null)
      try {
        const r = await fetch(`${API_URL}/api/envios/cotizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carrito: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
            destino: { codigoDane: daneDestino, valorDeclarado: subtotal },
          }),
        })
        const data = await r.json()
        if (!activo) return
        if (data.cotizacion) setEnvioCotizado(data.cotizacion)
        else setErrorEnvio(data.aviso || 'No hay cobertura de envío para esa ciudad.')
      } catch {
        if (activo) setErrorEnvio('No se pudo calcular el envío. Intenta de nuevo.')
      } finally {
        if (activo) setCotizando(false)
      }
    }
    cotizar()
    return () => { activo = false }
  }, [envio, daneDestino, items, subtotal])

  // Costo del envío: gratis si recoge en tienda; si no, lo que cotizó Envia.
  // (Es solo para mostrarlo: el backend lo vuelve a cotizar al preparar el pago.)
  const costoEnvio = envio === 'tienda' ? 0 : (envioCotizado?.costoTotal ?? null)
  // El backend marca envioGratis cuando el subtotal llega al umbral de la tienda.
  const envioGratis = envio === 'domicilio' && Boolean(envioCotizado?.envioGratis)
  const textoEnvio = (valor) => (valor === 0 ? 'Gratis' : money(valor))
  const total = subtotal + (costoEnvio || 0)

  // Campos mínimos para facturar (Alegra) y cobrar (Wompi). Para domicilio,
  // además hace falta una ciudad válida y un envío ya cotizado.
  const formularioValido = useMemo(() => {
    // Con empresa, la identidad fiscal es el NIT: la cédula deja de ser obligatoria.
    const identidad = esEmpresa
      ? form.razon.trim() && /^\d{5,}$/.test(form.nit.replace(/\D/g, '')) && form.regimen
      : form.doc.trim()
    const datos = form.nombre.trim() && form.apellido.trim() && identidad &&
      form.cel.trim() && /\S+@\S+\.\S+/.test(form.correo) && acepta
    if (!datos) return false
    if (envio === 'tienda') return true
    return Boolean(form.dir.trim() && daneDestino && envioCotizado && !cotizando)
  }, [form, esEmpresa, envio, acepta, daneDestino, envioCotizado, cotizando])

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

  async function guardarDatosParaLaProxima() {
    const empresa = esEmpresa
      ? { razonSocial: form.razon.trim(), nit: form.nit.replace(/\D/g, ''), regimen: form.regimen }
      : null
    if (token) {
      try { localStorage.removeItem(CLAVE_DATOS) } catch { /* nada que borrar */ }
      // Se espera (máx. 4 s) antes de irse a Wompi: si la página se va, el
      // navegador corta la petición. (keepalive no sirve: con el encabezado
      // de sesión Chrome la descarta en silencio.)
      const guardar = fetch(`${API_URL}/api/cuenta/desde-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre: `${form.nombre} ${form.apellido}`.trim(), telefono: form.cel,
          tipoDocumento: form.tipodoc === 'C.E.' ? 'CE' : 'CC', documento: form.doc.trim(),
          empresa,
          // Una dirección guardada elegida tal cual no se vuelve a mandar.
          direccion: envio === 'domicilio' && dirGuardada === 'otra'
            ? { destinatario: `${form.nombre} ${form.apellido}`.trim(), direccion: form.dir.trim(), codigoDane: daneDestino }
            : null,
        }),
      }).catch(() => { /* no es grave: solo no queda prellenado */ })
      await Promise.race([guardar, new Promise((r) => setTimeout(r, 4000))])
      return
    }
    try {
      localStorage.setItem(CLAVE_DATOS, JSON.stringify({
        form: { ...form, notas: '' }, esEmpresa, envio, depto: deptoSel, dane: daneDestino,
      }))
    } catch { /* sin storage: la próxima vez se llena de nuevo */ }
  }

  // Prepara el pago en el backend y redirige al checkout web de Wompi.
  async function pagar() {
    if (!formularioValido || pagando) return
    setPagando(true); setErrorPago('')
    try {
      const res = await fetch(`${API_URL}/api/pagos/preparar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Solo qué y cuánto: el precio y el nombre los pone el servidor.
          carrito: items.map((i) => ({
            productoId: i.productoId, cantidad: i.cantidad,
            variante: i.variante?.nombre || null,   // p. ej. el color: hace falta para despachar
          })),
          cliente: {
            nombre: `${form.nombre} ${form.apellido}`.trim(), nombres: form.nombre.trim(), apellidos: form.apellido.trim(),
            email: form.correo, telefono: form.cel,
            tipoDocumento: form.tipodoc === 'C.E.' ? 'CE' : 'CC', documento: form.doc.trim(),
            // La factura sale a nombre de la empresa (ver services/alegra.js).
            empresa: esEmpresa
              ? { razonSocial: form.razon.trim(), nit: form.nit.replace(/\D/g, ''), dv: dvCalculado, regimen: form.regimen }
              : null,
          },
          envio: {
            modalidad: envio,
            ciudad: form.ciudad, direccion: form.dir, departamento: deptoSel,
            codigoDane: daneDestino, costo: costoEnvio || 0, transportadora: envioCotizado?.transportadora || null,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo preparar el pago.')

      // El servidor cobra con los precios del catálogo. Si no coinciden con los
      // que el carrito tenía guardados (un precio cambió), se avisa antes de
      // ir a Wompi; el segundo clic ya sigue con el total nuevo.
      const totalServidor = data.resumen?.totalPesos
      if (totalServidor != null && totalServidor !== total && totalAceptado !== totalServidor) {
        setTotalAceptado(totalServidor)
        setPagando(false)
        setErrorPago(`Algunos precios se actualizaron: el total a pagar es ${money(totalServidor)}. Vuelve a hacer clic en "Pagar" para continuar.`)
        return
      }

      // Guardamos la referencia para leer el estado al volver de Wompi.
      try { localStorage.setItem('russitex_ultima_ref', data.referencia) } catch { /* sin persistencia, no pasa nada */ }

      // Recordar los datos para la próxima compra (y por si el pago falla y
      // vuelve). Con cuenta, en la cuenta; sin cuenta, en este navegador.
      await guardarDatosParaLaProxima()

      // Datos para la página de confirmación que el backend no devuelve a
      // propósito (contacto y dirección: no se exponen por una URL) y fotos
      // de los productos. sessionStorage: solo esta pestaña, se borra al
      // cerrar el navegador. Wompi vuelve a esta misma pestaña.
      try {
        sessionStorage.setItem('russitex_ultimo_checkout', JSON.stringify({
          referencia: data.referencia,
          contacto: {
            nombre: `${form.nombre} ${form.apellido}`.trim(), telefono: form.cel, correo: form.correo,
            direccion: envio === 'domicilio' ? form.dir : '', ciudad: form.ciudad, departamento: deptoSel,
          },
          items: items.map((i) => ({
            productoId: i.productoId, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio,
            variante: i.variante?.nombre || null, unidad: i.unidad || '', imagen: i.imagen || null,
          })),
        }))
      } catch { /* sin storage: la confirmación muestra lo que dé el backend */ }

      // Checkout web de Wompi. Se arma la query a mano para no encodear los
      // dos puntos de "signature:integrity" y "customer-data:...".
      const p = [
        `public-key=${encodeURIComponent(data.publicKey)}`,
        `currency=${data.moneda}`,
        `amount-in-cents=${data.montoCentavos}`,
        `reference=${encodeURIComponent(data.referencia)}`,
        `signature:integrity=${data.firma}`,
        `redirect-url=${encodeURIComponent(data.redirectUrl)}`,
        `customer-data:email=${encodeURIComponent(data.email || '')}`,
        `customer-data:full-name=${encodeURIComponent(data.nombre || '')}`,
        `customer-data:phone-number=${encodeURIComponent(data.telefono || '')}`,
      ].join('&')
      window.location.href = `https://checkout.wompi.co/p/?${p}`
    } catch (e) {
      setErrorPago(e.message)
      setPagando(false)
    }
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
              {recordados && (
                <p className="datos-recordados">
                  Llenamos el formulario con los datos de tu última compra en este navegador.{' '}
                  <button type="button" onClick={olvidarDatos}>¿No eres tú? Borrar estos datos</button>
                </p>
              )}

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
                      <option>C.C.</option><option>C.E.</option>
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

              <label className="empresa-check">
                <input type="checkbox" checked={esEmpresa} onChange={(e) => setEsEmpresa(e.target.checked)} />
                <span>Datos de empresa</span>
              </label>

              {esEmpresa && (
                <div className="empresa-extra">
                  <div className="fila una">
                    <div className="campo">
                      <label htmlFor="razon">Razón social</label>
                      <input id="razon" type="text" placeholder="Ej: Textiles ABC S.A.S." value={form.razon} onChange={set('razon')} />
                    </div>
                  </div>
                  <div className="fila">
                    <div className="campo">
                      <label htmlFor="nit">NIT</label>
                      <div className="nit-grid">
                        <input id="nit" type="text" inputMode="numeric" placeholder="Ej: 900123456" value={form.nit} onChange={cambiarNit} />
                        <input id="nitdv" type="text" inputMode="numeric" maxLength={1} placeholder="DV" aria-label="Dígito de verificación"
                          value={form.nitdv} onChange={set('nitdv')} />
                      </div>
                      {dvErrado && <span className="ayuda">El dígito de verificación de ese NIT debería ser {dvCalculado}.</span>}
                    </div>
                    <div className="campo">
                      <label htmlFor="regimen">Responsabilidad de IVA</label>
                      <select id="regimen" value={form.regimen} onChange={set('regimen')}>
                        <option value="">Selecciona…</option>
                        <option value="COMMON_REGIME">Responsable de IVA</option>
                        <option value="SIMPLIFIED_REGIME">No responsable de IVA</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── DIRECCIÓN ── */}
            <div className="bloque">
              <h2>Dirección de entrega</h2>
              <p className="bloque-sub">Elige tu ciudad y con ella calculamos el costo real del envío.</p>

              {direccionesGuardadas.length > 0 && envio === 'domicilio' && (
                <div className="fila una">
                  <div className="campo">
                    <label htmlFor="dirGuardada">Tus direcciones guardadas</label>
                    <select id="dirGuardada" value={dirGuardada} onChange={(e) => elegirDireccionGuardada(e.target.value)}>
                      {direccionesGuardadas.map((d) => (
                        <option key={d.id} value={d.id}>{d.destinatario} — {d.direccion}, {d.ciudad}{d.principal ? ' (principal)' : ''}</option>
                      ))}
                      <option value="otra">Usar otra dirección</option>
                    </select>
                    <span className="ayuda">Las administras en <Link to="/mi-cuenta/direcciones">Mi cuenta</Link>.</span>
                  </div>
                </div>
              )}

              <div className="fila">
                <div className="campo">
                  <label htmlFor="depto">Departamento</label>
                  <select
                    id="depto"
                    value={deptoSel}
                    onChange={(e) => elegirDepartamento(e.target.value)}
                    disabled={envio === 'tienda' || ciudades.length === 0}
                  >
                    <option value="">{ciudades.length ? 'Elige un departamento…' : 'Cargando…'}</option>
                    {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor="municipio">Municipio</label>
                  <select
                    id="municipio"
                    value={daneDestino || ''}
                    onChange={(e) => elegirMunicipio(e.target.value)}
                    disabled={envio === 'tienda' || !deptoSel}
                  >
                    <option value="">{deptoSel ? 'Elige un municipio…' : 'Primero el departamento'}</option>
                    {municipios.map((m) => <option key={m.dane} value={m.dane}>{m.ciudad}</option>)}
                  </select>
                </div>
              </div>

              <div className="fila una">
                <div className="campo">
                  <label htmlFor="dir">Dirección</label>
                  <input id="dir" type="text" placeholder="Calle 66 # 21-50" value={form.dir} onChange={(e) => { setDirGuardada('otra'); set('dir')(e) }} disabled={envio === 'tienda'} />
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
                  <div className="envio-op-desc">
                    {envioGratis
                      ? 'Tu compra tiene envío gratis a toda Colombia.'
                      : 'Lo entrega una transportadora. El costo se calcula según tu ciudad.'}
                    {envioCotizado?.transportadora && ` Vía ${envioCotizado.transportadora}.`}
                  </div>
                </div>
                <div className={`envio-op-precio ${envioGratis ? 'gratis' : ''}`}>
                  {envio !== 'domicilio' ? '' : cotizando ? 'Calculando…' : (costoEnvio != null ? textoEnvio(costoEnvio) : 'Según ciudad')}
                </div>
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
            <div className="res-fila">
              <span>Envío</span>
              <span>
                {envio === 'tienda'
                  ? 'Gratis'
                  : cotizando
                    ? 'Calculando…'
                    : costoEnvio != null
                      ? textoEnvio(costoEnvio)
                      : <span className="res-nota">Elige tu ciudad</span>}
              </span>
            </div>
            {errorEnvio && envio === 'domicilio' && (
              <div className="res-fila"><span /><span className="res-nota" style={{ color: 'var(--rojo)' }}>{errorEnvio}</span></div>
            )}
            <div className="res-fila"><span>IVA</span><span>Incluido</span></div>

            <div className="res-total">
              <span className="res-total-label">Total a pagar</span>
              <span className="res-total-valor">{money(total)}</span>
            </div>

            <button className="btn-pagar" type="button" onClick={pagar} disabled={!formularioValido || pagando}>
              {pagando ? 'Redirigiendo a Wompi…' : 'Pagar con Wompi'}
            </button>
            {errorPago && <p className="co-nota-form" style={{ color: 'var(--rojo)' }}>{errorPago}</p>}
            {!formularioValido && !errorPago && (
              <p className="co-nota-form">Completa tus datos, la dirección y acepta los términos para continuar.</p>
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
