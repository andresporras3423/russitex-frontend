import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useTiendaInfo } from '../hooks/useTiendaInfo'
import { LEGALES } from '../data/legales'
import './LegalPage.css'

// Página de una política (envíos, devoluciones...). `doc` es la clave en LEGALES.
export default function LegalPage({ doc }) {
  const navigate = useNavigate()
  const info = useTiendaInfo()
  const d = LEGALES[doc]

  // El número sale de tienda_info (con el mismo respaldo del pie de página):
  // así la web tiene un solo WhatsApp.
  const whatsapp = `<a href="${info.whatsapp_link || 'https://wa.me/573138909118'}" target="_blank" rel="noopener noreferrer">${info.whatsapp || '+57 313 890 9118'}</a>`
  const correo = info.correo || 'contacto@russitex.com'
  const html = (t) => ({
    __html: t.split('{{whatsapp}}').join(whatsapp).split('{{correo}}').join(`<a href="mailto:${correo}">${correo}</a>`),
  })

  // Los enlaces internos del texto (p. ej. a la otra política) navegan sin
  // recargar la página.
  function clicEnTexto(e) {
    const a = e.target.closest('a')
    const href = a?.getAttribute('href')
    if (href?.startsWith('/')) { e.preventDefault(); navigate(href) }
  }

  return (
    <div className="legal-page">
      <SiteHeader />

      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}>Inicio</a><span className="sep">/</span>
          <span className="current">{d.migas}</span>
        </div>
      </div>

      <section className="page-banner">
        <div className="banner-inner">
          <div className="banner-eyebrow">{d.eyebrow}</div>
          <h1 className="banner-title">{d.titulo[0]}<em>{d.titulo[1]}</em></h1>
          <p className="banner-sub">{d.sub}</p>
        </div>
      </section>

      <section className="doc-layout">
        <article className="doc-content" onClick={clicEnTexto}>
          <p className="doc-intro" dangerouslySetInnerHTML={html(d.intro)} />
          {d.secciones.map((s) => (
            <div className="doc-section" key={s.titulo}>
              <h2 className="doc-section-title">{s.titulo}</h2>
              {s.parrafos.map((p, i) => <p className="doc-p" key={i} dangerouslySetInnerHTML={html(p)} />)}
            </div>
          ))}
        </article>
      </section>

      <SiteFooter />
    </div>
  )
}
