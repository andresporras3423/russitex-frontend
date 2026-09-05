import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useChat } from '../context/useChat'
import { useTiendaInfo } from '../hooks/useTiendaInfo'
import './FaqPage.css'

// Solo se usan si la base no responde; el dato bueno está en tienda_info.
const POR_DEFECTO = {
  direccion: 'calle 66 No 21-50',
  ciudad: 'Bogotá, Colombia',
  whatsapp: '+57 313 890 9118',
  horario_semana: '10:00 a.m. – 6:00 p.m.',
  horario_sabado: '10:00 a.m. – 5:00 p.m.',
  horario_domingo: 'Cerrado',
  envio_gratis_desde: 'Compras superiores a $350.000 COP',
}

/**
 * Las preguntas van como DATOS y no como maquetación, para que cambiar un
 * texto o añadir una pregunta no obligue a tocar el HTML.
 *
 * `respuesta` recibe las herramientas que necesita cada una: `v` para leer
 * tienda_info, y `ir` / `abrirChat` para los enlaces. Así los datos del
 * almacén (dirección, horarios, WhatsApp) salen de la base y no quedan
 * escritos a mano en dos sitios.
 *
 * `destacado` es el recuadro azul del final; con tono 'terracota' se usa
 * para lo que conviene leer antes de actuar.
 */
const GRUPOS = [
  {
    id: 'pagos',
    etiqueta: 'Pagos',
    preguntas: [
      {
        p: '¿Cuáles son los métodos de pago aceptados?',
        respuesta: () => (
          <>
            Los pagos en nuestra tienda online se procesan a través de <strong>Wompi</strong>, una
            pasarela de pago segura que acepta tarjetas de crédito y débito (Visa, Mastercard,
            American Express), PSE, Nequi y Daviplata. En nuestra <strong>tienda física</strong> también
            recibimos efectivo y tarjeta.
          </>
        ),
        destacado: () => <>Todas las transacciones online están encriptadas y protegidas por Wompi.</>,
      },
      {
        p: '¿Los precios incluyen IVA?',
        respuesta: () => (
          <>
            Sí. Todos los precios que ves en el catálogo ya incluyen IVA. No habrá cobros
            adicionales por impuestos al momento de pagar.
          </>
        ),
      },
      {
        p: '¿Hay un monto mínimo de compra?',
        respuesta: () => (
          <>
            No hay monto mínimo de compra. Sin embargo, ten en cuenta que el costo del envío se
            calcula según tu ubicación y se muestra antes de confirmar el pago — te recomendamos
            revisarlo antes de finalizar tu pedido.
          </>
        ),
        destacado: ({ v }) => <>En nuestra tienda física en {v('ciudad').split(',')[0]} tampoco hay monto mínimo.</>,
      },
    ],
  },
  {
    id: 'envios',
    etiqueta: 'Envíos',
    preguntas: [
      {
        p: '¿Hacen envíos a todo Colombia?',
        respuesta: () => (
          <>
            Sí, hacemos envíos a todo el territorio nacional a través de empresas de mensajería.
            El costo y el tiempo de entrega varían según tu ubicación y se calculan automáticamente
            al ingresar tu dirección en el proceso de pago.
          </>
        ),
      },
      {
        p: '¿Cuánto cuesta el envío y cuánto demora?',
        respuesta: () => (
          <>
            El costo exacto se calcula al ingresar tu dirección. Como referencia aproximada:
            <br /><br />
            <strong>Bogotá:</strong> entre $8.000 y $12.000 COP. Entrega el mismo día o al día siguiente.<br />
            <strong>Ciudades principales</strong> (Medellín, Cali, Barranquilla, etc.): entre $12.000 y
            $18.000 COP. Entrega en 2 a 5 días hábiles.<br />
            <strong>Municipios pequeños o zonas de difícil acceso:</strong> entre $15.000 y $25.000 COP.
            Entrega en 5 a 10 días hábiles.
          </>
        ),
        // tienda_info guarda la frase entera ("Compras superiores a $350.000 COP"),
        // pensada para la barra superior. Se usa TAL CUAL, abriendo la oración
        // con ella: meterla en mitad de una frase obligaría a pasarla a
        // minúsculas y eso destroza la sigla COP.
        destacado: ({ v }) => (
          <><strong>{v('envio_gratis_desde')}</strong> tienen envío gratis a toda Colombia.</>
        ),
      },
    ],
  },
  {
    id: 'devoluciones',
    etiqueta: 'Devoluciones',
    preguntas: [
      {
        p: '¿Puedo devolver o cambiar un producto?',
        respuesta: () => (
          <>
            Aceptamos devoluciones únicamente en los siguientes casos:
            <br /><br />
            — El producto llegó con un <strong>defecto de fabricación</strong>.<br />
            — Se envió un <strong>material diferente</strong> al que pediste.<br />
            — La <strong>cantidad recibida no corresponde</strong> a la solicitada.
            <br /><br />
            Los materiales cortados a la medida solicitada por el cliente no son susceptibles de
            devolución por arrepentimiento, de acuerdo con el artículo 47 de la Ley 1480 de 2011.
          </>
        ),
        tonoDestacado: 'terracota',
        destacado: ({ v }) => (
          <>
            Para gestionar una devolución, escríbenos por WhatsApp al <strong>{v('whatsapp')}</strong> dentro
            de los 5 días hábiles siguientes a la recepción del pedido.
          </>
        ),
      },
    ],
  },
  {
    id: 'asesoria',
    etiqueta: 'Asesoría',
    preguntas: [
      {
        p: '¿Cómo sé qué material necesito para mi proyecto?',
        respuesta: ({ ir, abrirChat }) => (
          <>
            Contamos con un servicio de asesoría gratuito. Puedes usar nuestro{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); abrirChat() }}>asistente con IA</a>{' '}
            para resolver dudas al instante, o diligenciar el{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); ir('/asesoria') }}>formulario de asesoría personalizada</a>{' '}
            para que uno de nuestros asesores te oriente por correo o WhatsApp. También puedes
            visitarnos en el local y te atendemos en persona.
          </>
        ),
        destacado: () => (
          <>
            Te recomendamos asesorarte antes de comprar para evitar adquirir materiales que no se
            ajusten a tu proyecto.
          </>
        ),
      },
      {
        p: '¿La asesoría tiene costo?',
        respuesta: () => (
          <>
            No. La asesoría es completamente gratuita, tanto la rápida con IA como la personalizada.
            Orientarte para que elijas bien tus materiales es parte de lo que hacemos en Russitex.
          </>
        ),
      },
      {
        p: '¿Qué puedo esperar de la asesoría y del asistente?',
        respuesta: () => (
          <>
            El asistente con IA resuelve tus dudas al instante sobre materiales, precios, envíos y
            horarios, y con la asesoría personalizada te orientamos en proyectos que necesitan más
            detalle. En ambos casos te ayudamos a elegir mejor tus materiales y a decidir con más
            información.
          </>
        ),
        destacado: () => (
          <>
            Ten presente que son una guía, no una garantía de resultado: cómo queda tu prenda al
            final también depende de la confección y del uso que le des a cada material. La decisión
            final siempre es tuya.
          </>
        ),
      },
    ],
  },
  {
    id: 'tienda',
    etiqueta: 'Tienda física',
    preguntas: [
      {
        p: '¿Tienen tienda física? ¿Puedo ir a ver los materiales?',
        respuesta: ({ v }) => (
          <>
            Sí. Nuestra tienda está ubicada en la <strong>{v('direccion')}, {v('ciudad').split(',')[0]}</strong>,
            cerca a la Plaza del 7 de Agosto. Puedes venir a ver y tocar los materiales antes de
            comprar, y recibirás atención directa en el mostrador.
          </>
        ),
        destacado: ({ v }) => (
          <>
            <strong>Horario de atención:</strong><br />
            Lunes a viernes: {v('horario_semana')}<br />
            Sábados: {v('horario_sabado')}<br />
            Domingos y festivos: {v('horario_domingo').toLowerCase()}
          </>
        ),
      },
    ],
  },
]

/**
 * El ancla de la URL decide qué grupo se abre, y eso se lee UNA VEZ al
 * montar. Si el visitante ya está en esta página y pincha otra ancla, el
 * componente no se volvería a montar y no pasaría nada; por eso se remonta
 * con `key`, el mismo recurso que usa la ficha de producto al cambiar de id.
 */
export default function FaqPage() {
  const { hash } = useLocation()
  return <ContenidoFaq key={hash} hash={hash} />
}

function ContenidoFaq({ hash }) {
  const navigate = useNavigate()
  const info = useTiendaInfo()
  const { abrirChat } = useChat()

  // Solo una abierta a la vez, como en el diseño. Se guarda la clave
  // "grupo/índice" en vez de un booleano por pregunta.
  //
  // Si la URL apunta a un grupo (#grupo-envios), se abre su primera
  // pregunta: quien llega desde "Políticas de envío" quiere leer, no
  // buscar. Se calcula en el inicializador y no en un efecto, para no
  // pintar primero todo cerrado y abrirlo después.
  const [abierta, setAbierta] = useState(() => {
    const id = (hash || '').replace(/^#grupo-/, '')
    return GRUPOS.some((g) => g.id === id) ? `${id}/0` : null
  })

  useEffect(() => {
    if (!hash) return
    const destino = document.querySelector(hash)
    // El desfase por la cabecera fija lo pone `scroll-margin-top` en el CSS.
    if (destino) destino.scrollIntoView({ block: 'start' })
  }, [hash])

  const v = (clave) => info[clave] ?? POR_DEFECTO[clave]
  const herramientas = { v, ir: navigate, abrirChat }

  return (
    <div className="faq-page">
      <SiteHeader />

      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>Inicio</a>
          <span className="sep">/</span>
          <span className="current">Preguntas frecuentes</span>
        </div>
      </div>

      <section className="page-banner">
        <div className="banner-inner">
          <div className="banner-eyebrow">Estamos para ayudarte</div>
          <h1 className="banner-title">Preguntas <em>frecuentes</em></h1>
          <p className="banner-sub">
            Resolvemos las dudas más comunes sobre compras, envíos, pagos y devoluciones en Russitex.
          </p>
        </div>
      </section>

      <section className="faq-layout">
        <div className="faq-content">
          {GRUPOS.map((grupo) => (
            <div className="faq-group" id={`grupo-${grupo.id}`} key={grupo.id}>
              <div className="group-label">{grupo.etiqueta}</div>

              {grupo.preguntas.map((item, i) => {
                const clave = `${grupo.id}/${i}`
                const abierto = abierta === clave
                return (
                  <div className={`faq-item ${abierto ? 'open' : ''}`} key={clave}>
                    <button
                      className="faq-q"
                      aria-expanded={abierto}
                      onClick={() => setAbierta(abierto ? null : clave)}
                    >
                      <span className="faq-q-text">{item.p}</span>
                      <span className="faq-icon" aria-hidden="true">+</span>
                    </button>

                    <div className={`faq-a ${abierto ? 'open' : ''}`}>
                      <div className="faq-a-inner">
                        {item.respuesta(herramientas)}
                        {item.destacado && (
                          <div className={`faq-highlight ${item.tonoDestacado || ''}`}>
                            {item.destacado(herramientas)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
