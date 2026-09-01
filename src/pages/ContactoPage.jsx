import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useTiendaInfo } from '../hooks/useTiendaInfo'
import {
  ICON_FOOTER_LOCATION, ICON_WA_SUBMIT, ICON_MAIL, ICON_CLOCK, ICON_FLECHA_SIMPLE,
} from './catalogIcons'
import './ContactoPage.css'

// Solo se usan si la base no responde; el dato bueno está en tienda_info.
const POR_DEFECTO = {
  direccion: 'calle 66 No 21-50',
  ciudad: 'Bogotá, Colombia',
  whatsapp: '+57 313 890 9118',
  correo: 'contacto@russitex.com',
  horario_semana: '10:00 a.m. – 6:00 p.m.',
  horario_sabado: '10:00 a.m. – 5:00 p.m.',
  horario_domingo: 'Cerrado',
}

export default function ContactoPage() {
  const navigate = useNavigate()
  const info = useTiendaInfo()
  const v = (clave) => info[clave] ?? POR_DEFECTO[clave]

  // Google Maps admite centrar por dirección sin necesidad de clave ni de
  // un enlace "generado". Así el mapa sigue a tienda_info: si cambia la
  // dirección, el mapa se mueve solo.
  const consultaMapa = encodeURIComponent(`${v('direccion')}, ${v('ciudad')}`)
  const mapaUrl = `https://www.google.com/maps?q=${consultaMapa}&output=embed`

  const accesos = [
    { clase: 'loc',  icono: ICON_FOOTER_LOCATION, etiqueta: 'Tienda física',
      valor: <>{v('direccion')}<br />{v('ciudad')}</> },
    { clase: 'wa',   icono: ICON_WA_SUBMIT, etiqueta: 'WhatsApp',
      valor: <a href={info.whatsapp_link || `https://wa.me/${v('whatsapp').replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer">{v('whatsapp')}</a> },
    { clase: 'mail', icono: ICON_MAIL, etiqueta: 'Correo electrónico',
      valor: <a href={`mailto:${v('correo')}`}>{v('correo')}</a> },
  ]

  return (
    <div className="contacto-page">
      <SiteHeader activeLink="contacto" />

      <div className="breadcrumb-bar">
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>Inicio</a>
          <span className="sep">/</span>
          <span className="current">Contacto</span>
        </div>
      </div>

      <section className="page-banner">
        <div className="banner-inner">
          <div className="banner-eyebrow">Contigo en cada puntada</div>
          <h1 className="banner-title">¿Cómo podemos <em>ayudarte?</em></h1>
          <p className="banner-sub">
            Visítanos, escríbenos o envíanos un mensaje. Estamos en Bogotá desde 1987
            y siempre hay alguien listo para atenderte.
          </p>
        </div>
      </section>

      <section className="accesos-section">
        <div className="accesos-grid">
          {accesos.map((a) => (
            <div className="acceso-item" key={a.etiqueta}>
              <div className={`acceso-icon ${a.clase}`} dangerouslySetInnerHTML={{ __html: a.icono }} />
              <div className="acceso-text">
                <div className="acceso-label">{a.etiqueta}</div>
                <div className="acceso-value">{a.valor}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="main-section">
        <div className="map-side">
          <div className="map-header">
            <h2>Visítanos en nuestro almacén</h2>
            <p>
              Nuestra tienda física en el barrio 7 de Agosto es el lugar donde todo empezó.
              Puedes venir a ver los materiales de cerca, tocarlos y recibir orientación
              directa antes de decidir.
            </p>
          </div>

          <div className="map-wrap">
            <iframe
              src={mapaUrl}
              title={`Mapa de ${v('direccion')}`}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="info-grid">
            <div className="info-card">
              <div className="info-card-label">
                <span dangerouslySetInnerHTML={{ __html: ICON_CLOCK }} /> Horario de atención
              </div>
              <div className="info-card-value">
                <span>Lunes a viernes: {v('horario_semana')}</span>
                <span>Sábados: {v('horario_sabado')}</span>
                <span className="closed">Domingos y festivos: {v('horario_domingo').toLowerCase()}</span>
              </div>
            </div>

            <div className="info-card cta-card">
              <div className="info-card-label">
                <span dangerouslySetInnerHTML={{ __html: ICON_FLECHA_SIMPLE }} /> Asesoría personalizada
              </div>
              <div className="cta-card-title">¿Tu proyecto necesita una mano experta?</div>
              <p className="cta-card-text">
                Cuéntanos qué vas a confeccionar y te ayudamos a elegir el material exacto,
                con la experiencia de toda una vida.
              </p>
              <button className="btn-asesoria" onClick={() => navigate('/asesoria#solicitar')}>
                Ir a asesoría <span dangerouslySetInnerHTML={{ __html: ICON_FLECHA_SIMPLE }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
