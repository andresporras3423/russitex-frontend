import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useChat } from '../context/useChat'
import './HomePage.css'

// "filter" mapea al valor de categoría real del catálogo (src/pages/CatalogPage.jsx).
// Pretinas y Botones no son categorías propias en el catálogo (Pretina vive dentro de
// "Otros materiales", y no hay productos de Botones todavía), así que esas dos tarjetas
// llevan al catálogo completo en vez de a un filtro que no existe.
const categorias = [
  { nombre: 'Forros', filter: 'forros', img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=440&q=80' },
  { nombre: 'Entretelas', filter: 'entretelas', img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=440&q=80' },
  { nombre: 'Hombreras', filter: 'hombreras', img: 'https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=440&q=80' },
  { nombre: 'Guatas', filter: 'guatas', img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=440&q=80' },
  { nombre: 'Tizas', filter: 'tizas', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4a4a?w=440&q=80' },
  { nombre: 'Pretinas', filter: 'otros', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=440&q=80' },
  { nombre: 'Cierres', filter: 'cierres', img: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=440&q=80' },
  { nombre: 'Botones', filter: null, img: 'https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=440&q=80' },
]

const AUTO_DELAY = 3000
const ANIM_DURATION = 750

// Píxeles que debe recorrer el mouse para que el gesto cuente como arrastre
// del carrusel y no como clic. Un arrastre real mueve mucho más que esto.
const UMBRAL_ARRASTRE = 10

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export default function HomePage() {
  const navigate = useNavigate()
  const { abrirChat } = useChat()
  const galleryRef = useRef(null)

  // Carrusel: auto-scroll cada 3s + arrastre manual con el mouse.
  // Réplica del script original de russitex-home.html, adaptado a un ref de React.
  useEffect(() => {
    const gallery = galleryRef.current
    if (!gallery) return

    let autoTimer = null
    let raf = null
    let isDown = false
    let startX = 0
    let startScroll = 0
    let moved = 0

    function getStep() {
      const card = gallery.querySelector('.cat-card, .cat-card-all')
      return card ? card.offsetWidth + 18 : 240
    }

    function animateScrollTo(target, duration) {
      if (raf) cancelAnimationFrame(raf)
      const start = gallery.scrollLeft
      const change = target - start
      let startTime = null
      function frame(ts) {
        if (!startTime) startTime = ts
        const progress = Math.min((ts - startTime) / duration, 1)
        gallery.scrollLeft = start + change * easeInOutCubic(progress)
        raf = progress < 1 ? requestAnimationFrame(frame) : null
      }
      raf = requestAnimationFrame(frame)
    }

    function tick() {
      const maxScroll = gallery.scrollWidth - gallery.clientWidth
      const target = gallery.scrollLeft >= maxScroll - 5
        ? 0
        : Math.min(gallery.scrollLeft + getStep(), maxScroll)
      animateScrollTo(target, ANIM_DURATION)
    }
    function startAuto() {
      stopAuto()
      autoTimer = setInterval(tick, AUTO_DELAY)
    }
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null }
      if (raf) { cancelAnimationFrame(raf); raf = null }
    }

    function onMouseDown(e) {
      isDown = true; moved = 0
      startX = e.pageX
      startScroll = gallery.scrollLeft
      gallery.classList.add('dragging')
      stopAuto()
    }
    function onMouseMove(e) {
      if (!isDown) return
      e.preventDefault()
      const delta = e.pageX - startX
      moved = Math.max(moved, Math.abs(delta))
      gallery.scrollLeft = startScroll - delta
    }
    function endDrag() {
      if (!isDown) return
      isDown = false
      gallery.classList.remove('dragging')
      startAuto()
    }
    function onClickCapture(e) {
      // Solo cancelamos el clic si de verdad hubo arrastre. Con el umbral en
      // 6px, el temblor normal de la mano al hacer clic bastaba para anular
      // la navegación de las tarjetas.
      if (moved > UMBRAL_ARRASTRE) { e.preventDefault(); e.stopPropagation() }
    }
    function onDragStart(e) { e.preventDefault() }

    gallery.addEventListener('mouseenter', stopAuto, { passive: true })
    gallery.addEventListener('touchstart', stopAuto, { passive: true })
    gallery.addEventListener('mouseleave', startAuto, { passive: true })
    gallery.addEventListener('touchend', startAuto, { passive: true })
    gallery.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', endDrag)
    gallery.addEventListener('click', onClickCapture, true)
    gallery.addEventListener('dragstart', onDragStart)

    startAuto()

    return () => {
      stopAuto()
      gallery.removeEventListener('mouseenter', stopAuto)
      gallery.removeEventListener('touchstart', stopAuto)
      gallery.removeEventListener('mouseleave', startAuto)
      gallery.removeEventListener('touchend', startAuto)
      gallery.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', endDrag)
      gallery.removeEventListener('click', onClickCapture, true)
      gallery.removeEventListener('dragstart', onDragStart)
    }
  }, [])

  return (
    <div className="home-page">
      <SiteHeader activeLink="inicio" />

      <section className="hero">
        <div className="hero-left">
          <h1 className="hero-title">Materiales para confección<br className="br-hero" /> en Bogotá</h1>
          <p className="hero-slogan">39 años siendo tu mano amiga en confección.</p>
          <p className="hero-desc">Encuentra forros, entretelas, hombreras, guatas, tizas y otros insumos para tus proyectos de confección, con asesoría cercana y experiencia familiar.</p>
          <div className="hero-btns">
            <div className="hero-float-card">
              <div className="float-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d="M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1" /><path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-1" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /><path d="M9 18h6" /></svg></div>
              <div className="float-text">
                <small>Cobertura en toda Bogotá</small>
                <strong>Domicilios con seguimiento</strong>
              </div>
            </div>
            <button className="btn-primary" onClick={() => navigate('/catalogo')}>Ver catálogo →</button>
          </div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">39</span><span className="stat-label">años de<br />experiencia</span></div>
            <div className="stat"><span className="stat-num">+50</span><span className="stat-label">materiales<br />disponibles</span></div>
            <div className="stat"><span className="stat-num">&lt;5'</span><span className="stat-label">respuesta por<br />WhatsApp</span></div>
          </div>
        </div>

        <div className="hero-right">
          <div className="img-block">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" /><path d="M3 15l5-5 4 4 2-2 5 5" stroke="currentColor" strokeWidth="1.5" /></svg>
            <span>Foto interior del almacén</span>
          </div>
          <div className="img-block">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" /><path d="M3 15l5-5 4 4 2-2 5 5" stroke="currentColor" strokeWidth="1.5" /></svg>
            <span>Detalle de materiales</span>
          </div>
        </div>
      </section>

      <section className="section categorias">
        <div className="cat-header">
          <div>
            <div className="s-label">Nuestros materiales</div>
            <h2 className="s-title">Encuentra lo que necesitas<br />para <em>confeccionar</em></h2>
            <p className="s-sub">Explora nuestras principales categorías de materiales.</p>
          </div>
        </div>
        <div className="cat-gallery-wrap" ref={galleryRef}>
          <div className="cat-gallery">
            {categorias.map((cat) => (
              <a
                href="#"
                className="cat-card"
                key={cat.nombre}
                onClick={(e) => { e.preventDefault(); navigate(cat.filter ? `/catalogo?cat=${cat.filter}` : '/catalogo') }}
              >
                <img src={cat.img} alt={cat.nombre} loading="lazy" />
                <div className="cat-overlay"></div>
                <div className="cat-info"><span className="cat-name">{cat.nombre}</span><span className="cat-cta">Ver productos</span></div>
              </a>
            ))}
            <a href="#" className="cat-card-all" onClick={(e) => { e.preventDefault(); navigate('/catalogo') }}>
              <div className="cat-all-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></div>
              <span className="cat-all-label">Ver todos los materiales</span>
            </a>
          </div>
        </div>
      </section>

      <section className="section asesoria">
        <div className="asesoria-layout">
          <div className="asesoria-copy">
            <div className="s-label">Estamos para ayudarte</div>
            <h2 className="s-title">¿No sabes qué material necesitas?</h2>
            <p className="s-sub">Te ayudamos a acertar con el material, ya sea una consulta rápida o un proyecto que necesita más detalle.</p>

            {/* Abre el chat flotante, que vive en <FloatingActions>. */}
            <p
              className="asesoria-hint"
              role="button"
              tabIndex={0}
              onClick={abrirChat}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirChat() } }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
              <span>¿Una duda puntual? Habla con nuestro asistente y te responde al instante.</span>
            </p>
          </div>

          <div className="asesoria-card">
            <div className="asesoria-card-head">
              <span className="a-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6" /><path d="M9 16h6" /></svg></span>
              <h3>Asesoría personalizada</h3>
            </div>
            <p>Cuéntanos los detalles de tu proyecto y un asesor de Russitex te contacta directamente para recomendarte lo que necesitas.</p>
            <button className="btn-card-white" onClick={() => navigate('/asesoria#solicitar')}>Ir al formulario →</button>
          </div>
        </div>
      </section>

      <section className="section beneficios">
        <div className="s-label">Nuestro diferencial</div>
        <h2 className="s-title">¿Por qué comprar<br />en <em>Russitex?</em></h2>
        <p className="s-sub">No solo vendemos materiales: acompañamos tus proyectos de confección.</p>
        <div className="beneficios-grid">
          <div className="bene-card">
            <span className="bene-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7"><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2" /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /></svg></span>
            <h3>Asesoría cercana</h3>
            <p>Te orientamos para que elijas el material correcto según tu proyecto, sin gastar de más ni perder tiempo.</p>
          </div>
          <div className="bene-card">
            <span className="bene-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d="M2 7h20l-1.5 4.5a2 2 0 0 1-2 1.5h-13a2 2 0 0 1-2-1.5Z" /><path d="M4 13v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M2 7l1.5-3A2 2 0 0 1 5.4 3h13.2a2 2 0 0 1 1.9 1L22 7" /><path d="M10 21v-5h4v5" /></svg></span>
            <h3>Experiencia familiar</h3>
            <p>39 años de conocimiento acumulado en materiales para confección, transmitido de generación en generación.</p>
          </div>
          <div className="bene-card">
            <span className="bene-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg></span>
            <h3>Compra fácil</h3>
            <p>Explora el catálogo y paga como prefieras: PSE, Nequi, Daviplata, efectivo, tarjeta de crédito o débito.</p>
          </div>
          <div className="bene-card">
            <span className="bene-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg></span>
            <h3>Atención en Bogotá</h3>
            <p>Compra online o visítanos en nuestra tienda física. Toca los materiales antes de decidir.</p>
          </div>
        </div>
      </section>

      <section className="sobre">
        <div className="sobre-left">
          <div className="s-label">Quiénes somos</div>
          <h2 className="s-title">Una historia familiar<br />dedicada a la <em>confección</em></h2>
          <p className="sobre-text">Russitex nació de la sastrería familiar y creció como un almacén especializado en materiales para confección. Hoy seguimos acompañando a estudiantes, sastres, diseñadores y talleres con atención cercana y conocimiento práctico.</p>
          <a
            href="#"
            className="btn-secondary"
            onClick={(e) => { e.preventDefault(); navigate('/sobre-nosotros') }}
          >
            Conoce nuestra historia →
          </a>
        </div>
        <div className="sobre-right">
          <div className="timeline">
            <div className="tl-item">
              <div className="tl-left"><div className="tl-dot"></div><div className="tl-line"></div></div>
              <div><div className="tl-year">1987</div><div className="tl-text">Apertura del almacén familiar en Bogotá, nacido desde la sastrería</div></div>
            </div>
            <div className="tl-item">
              <div className="tl-left"><div className="tl-dot"></div><div className="tl-line"></div></div>
              <div><div className="tl-year">2000s</div><div className="tl-text">Crecimiento como proveedor de referencia para sastres y diseñadores</div></div>
            </div>
            <div className="tl-item">
              <div className="tl-left"><div className="tl-dot"></div><div className="tl-line"></div></div>
              <div><div className="tl-year">2020s</div><div className="tl-text">Incorporación de catálogo digital, asesorías online y domicilios</div></div>
            </div>
            <div className="tl-item">
              <div className="tl-left"><div className="tl-dot"></div></div>
              <div><div className="tl-year">Hoy</div><div className="tl-text">Microempresa familiar con 39 años de oficio y presencia digital en crecimiento</div></div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

    </div>
  )
}
