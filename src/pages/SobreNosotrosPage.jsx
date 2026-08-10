import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useProductos } from '../hooks/useProductos'
import './SobreNosotrosPage.css'

const ANIO_FUNDACION = 1987

// Marcador de foto: el diseño de mi hermana deja estos huecos hasta que
// haya fotos reales del almacén.
function FotoPlaceholder({ size = 34 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M3 15l5-5 4 4 2-2 5 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const HITOS = [
  {
    anio: '1987',
    titulo: 'Nace Russitex en Bogotá',
    texto: 'El primer almacén abre sus puertas en la Calle 66. Una microempresa familiar que empieza con lo esencial de la sastrería.',
  },
  {
    anio: '1990',
    titulo: 'La reputación se construye por voz a voz',
    texto: 'Sin publicidad, el almacén crece gracias a la confianza. Cada cliente que encuentra el material correcto regresa y trae a otro.',
  },
  {
    anio: '2012',
    titulo: 'Una mujer al frente del negocio',
    texto: 'Desde 2012, una mujer lidera el almacén y conserva el trato cercano y el conocimiento del oficio que siempre lo distinguió.',
  },
  {
    anio: 'Hoy',
    titulo: 'Tradición que se adapta sin perder su esencia',
    texto: 'Catálogo en línea, asesoría por WhatsApp y domicilios en Bogotá. Lo que cambia es el canal; el oficio y la cercanía siguen intactos.',
  },
]

const PARTES_NOMBRE = [
  {
    letras: 'Russi',
    titulo: 'El apellido del fundador',
    texto: 'Quien tuvo la visión de convertir un taller de sastrería en un almacén especializado.',
  },
  {
    letras: 'tex',
    titulo: 'Del mundo textil',
    texto: 'La raíz que define el oficio: materiales, telas, insumos para confección.',
  },
  {
    letras: 'P.L.',
    titulo: 'Quien lo dirige hoy',
    texto: 'Las iniciales de quien ha mantenido vivo el almacén desde el primer día hasta hoy.',
  },
]

const VALORES = [
  { num: '01', nombre: 'Cercanía', texto: 'Atendemos con paciencia y disposición. No somos un punto de venta anónimo — somos un almacén donde la persona que te atiende conoce los materiales y te orienta sin apuro.' },
  { num: '02', nombre: 'Experiencia', texto: 'Venimos del oficio de la confección y conocemos los materiales desde la práctica. No vendemos lo que no conocemos — cada producto del catálogo fue elegido porque confiamos en él.' },
  { num: '03', nombre: 'Confianza', texto: 'Buscamos que cada cliente compre con seguridad y sin gastar de más. Si algo no te sirve para tu proyecto, te lo decimos antes de que lo compres.' },
  { num: '04', nombre: 'Tradición e innovación', texto: 'Conservamos el trato familiar de siempre mientras abrimos nuevos canales digitales. La esencia no cambia — el acceso mejora.' },
]

// Los logos de clientes son marcadores hasta que haya permiso de uso de marca.
// La clase controla el color del subrayado, según antigüedad de la relación.
const CLIENTES = ['years-25', 'years-25', 'years-4', 'years-3']

export default function SobreNosotrosPage() {
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const productos = useProductos()

  // Años de trayectoria y total de materiales salen de datos reales, no de
  // números escritos a mano que se quedan viejos solos.
  const anios = new Date().getFullYear() - ANIO_FUNDACION
  const totalMateriales = productos.length

  // Aparición progresiva al hacer scroll (mismo efecto del HTML original).
  useEffect(() => {
    const raiz = rootRef.current
    if (!raiz) return

    const elementos = raiz.querySelectorAll('.reveal, .reveal-left, .reveal-right')

    // Si el navegador no lo soporta, se muestra todo de una en vez de
    // dejar la página en blanco.
    if (typeof IntersectionObserver === 'undefined') {
      elementos.forEach((el) => el.classList.add('revealed'))
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })

    elementos.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="sobre-page" ref={rootRef}>
      <SiteHeader activeLink="sobre-nosotros" />

      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>Inicio</a>
          <span className="sep">/</span>
          <span className="current">Sobre nosotros</span>
        </div>
      </div>

      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title reveal">Un negocio de familia,<em>construido con oficio.</em></h1>
          <p className="hero-desc reveal delay-1">
            Russitex nació de la sastrería y creció gracias al voz a voz. Casi cuatro décadas después,
            seguimos siendo el mismo almacén: cercano, honesto y especializado en lo que hacemos.
          </p>
          <div className="hero-stats reveal delay-2">
            <div className="hero-stat">
              <div className="hero-stat-num">{ANIO_FUNDACION}</div>
              <div className="hero-stat-label">Año de fundación</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">{anios}</div>
              <div className="hero-stat-label">Años de trayectoria</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">{totalMateriales ? `+${totalMateriales}` : '—'}</div>
              <div className="hero-stat-label">Materiales en catálogo</div>
            </div>
          </div>
        </div>
      </section>

      <section className="galeria-band reveal">
        <div className="galeria-grid">
          {[0, 1, 2, 3].map((i) => (
            <div className="galeria-foto" key={i}><FotoPlaceholder /></div>
          ))}
        </div>
      </section>

      <section className="historia-section">
        <div className="historia-grid">
          <div className="historia-left reveal-left">
            <div className="s-label-tc">Nuestra historia</div>
            <h2>Una historia que nació<br />en la <em>sastrería</em></h2>
            <p>
              Russitex nació de la sastrería familiar. Antes de ser almacén, sus fundadores confeccionaban
              prendas sobre medida y compraban materiales al por mayor para sus propios trabajos. Con el
              tiempo, otros colegas empezaron a pedirles esos materiales, y lo que comenzó como una solución
              entre sastres se convirtió en un almacén especializado en insumos para confección.
            </p>
            <div className="historia-pullquote">
              &ldquo;Para todo el que confecciona, Russitex es esa mano amiga con {anios} años de experiencia
              que resuelve la frustración al comprar: te conseguimos los materiales que buscas y te asesoramos
              para que ahorres tiempo y avances en tu proyecto con confianza.&rdquo;
            </div>
          </div>
          <div className="historia-right reveal-right">
            <div className="timeline-v">
              {HITOS.map((h) => (
                <div className="tl-item" key={h.anio}>
                  <div className="tl-left"><div className="tl-dot"></div></div>
                  <div className="tl-body">
                    <div className="tl-year">{h.anio}</div>
                    <h4>{h.titulo}</h4>
                    <p>{h.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="nombre-strip reveal">
          <div className="nombre-strip-head">
            <div className="s-label-tc">El nombre lo dice todo</div>
            <h3>Russitex P.L. lleva en su nombre la historia de quienes lo fundaron</h3>
            <p>
              Detrás de cada letra hay una historia de trabajo y dedicación. El nombre no fue elegido al azar:
              es la unión de dos personas que lo construyeron juntas desde cero.
            </p>
          </div>
          <div className="nombre-strip-parts">
            {PARTES_NOMBRE.map((p) => (
              <div className="nombre-card" key={p.letras}>
                <span className="nombre-letters">{p.letras}</span>
                <strong>{p.titulo}</strong>
                <span className="nombre-desc">{p.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="valores-section">
        <div className="valores-intro reveal">
          <div>
            <div className="s-label-tc">En lo que creemos</div>
            <h2>No solo vendemos materiales,<br className="br-md" /><em>acompañamos proyectos</em></h2>
          </div>
          <p>
            Sabemos que elegir materiales puede ser confuso. Por eso combinamos experiencia textil, trato
            cercano y herramientas digitales para que comprar sea más fácil, claro y confiable.
          </p>
        </div>
        <div className="valores-list">
          {VALORES.map((v, i) => (
            <div className={`valor-row reveal${i > 0 ? ` delay-${i}` : ''}`} key={v.num}>
              <div className="valor-num">{v.num}</div>
              <div className="valor-name">{v.nombre}</div>
              <div className="valor-desc">{v.texto}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="clientes-section">
        <div className="clientes-header reveal">
          <div>
            <div className="s-label-tc">Empresas que confían en nosotros</div>
            <h2>Más que proveedores,<br className="br-md" /><em>somos tus aliados de largo plazo</em></h2>
          </div>
          <p>
            La experiencia de Russitex se refleja en las relaciones que hemos construido con clientes del
            sector textil. Buscamos ser aliados que acompañan el trabajo diario de quienes diseñan, producen y crean.
          </p>
        </div>
        <div className="clientes-band reveal delay-1">
          {CLIENTES.map((clase, i) => (
            <div className={`cliente-item ${clase}`} key={i}>
              <div className="cliente-logo"><FotoPlaceholder size={22} /><span>Logo</span></div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />

    </div>
  )
}
