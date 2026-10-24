import { useNavigate } from 'react-router-dom'
import { useTiendaInfo } from '../hooks/useTiendaInfo'
import { ICON_FOOTER_WA, ICON_CLOCK, ICON_FOOTER_LOCATION } from '../pages/catalogIcons'
import './SiteFooter.css'

// Valores de respaldo por si el backend no responde: así el pie nunca
// queda vacío. Coinciden con lo sembrado en tienda_info.
const POR_DEFECTO = {
  descripcion_corta: 'Materiales para confección en Bogotá, Colombia.',
  lema: '39 años siendo tu mano amiga en confección.',
  whatsapp: '+57 313 890 9118',
  whatsapp_link: 'https://wa.me/573138909118',
  horario_semana: '10:00 a.m. – 6:00 p.m.',
  horario_sabado: '10:00 a.m. – 5:00 p.m.',
  ciudad: 'Bogotá, Colombia',
}

// Logos en public/logos-pago (diseño version2). Todos los procesa Wompi.
const MEDIOS_PAGO = [
  ['visa.webp', 'Visa'], ['mastercard.svg', 'Mastercard'], ['amex.svg', 'American Express'],
  ['nequi.svg', 'Nequi'], ['daviplata.svg', 'DaviPlata'], ['pse.svg', 'PSE'], ['bancolombia.svg', 'Bancolombia'],
]

export default function SiteFooter() {
  const navigate = useNavigate()
  const info = useTiendaInfo()
  const v = (clave) => info[clave] ?? POR_DEFECTO[clave] ?? ''

  return (
    <footer>
      <div className="footer-grid">
        <div>
          <span className="f-logo">Russi<span>tex</span></span>
          <p className="footer-desc">{v('descripcion_corta')}</p>
          <p className="footer-slogan">{v('lema')}</p>
          <div className="f-pagos">
            <div className="f-pagos-head">
              <span className="f-pagos-label">Medios de pago</span>
              <span className="f-pagos-wompi-txt">procesados por <strong>Wompi</strong></span>
            </div>
            <div className="f-pagos-logos">
              {MEDIOS_PAGO.map(([archivo, nombre]) => (
                <span key={archivo} className={`pago-logo ${archivo === 'pse.svg' ? 'pago-pse' : ''}`}>
                  <img src={`/logos-pago/${archivo}`} alt={nombre} loading="lazy" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="f-col">
          <h4>Información</h4>
          <ul>
            <li>
              <a href="/preguntas-frecuentes" onClick={(e) => { e.preventDefault(); navigate('/preguntas-frecuentes') }}>
                Preguntas frecuentes
              </a>
            </li>
            <li>
              <a href="/politica-de-envios" onClick={(e) => { e.preventDefault(); navigate('/politica-de-envios') }}>
                Políticas de envío
              </a>
            </li>
            <li>
              <a href="/cambios-y-devoluciones" onClick={(e) => { e.preventDefault(); navigate('/cambios-y-devoluciones') }}>
                Cambios y devoluciones
              </a>
            </li>
            <li>
              <a href="/terminos-y-condiciones" onClick={(e) => { e.preventDefault(); navigate('/terminos-y-condiciones') }}>
                Términos y condiciones
              </a>
            </li>
            <li>
              <a href="/politica-de-privacidad" onClick={(e) => { e.preventDefault(); navigate('/politica-de-privacidad') }}>
                Política de privacidad
              </a>
            </li>
          </ul>
        </div>

        <div className="f-col">
          <h4>Contacto</h4>
          <div className="f-contact">
            <div className="f-ci-item">
              <span className="f-ci" dangerouslySetInnerHTML={{ __html: ICON_FOOTER_WA }} />
              <div>WhatsApp: <a href={v('whatsapp_link')}>{v('whatsapp')}</a></div>
            </div>

            <div className="f-ci-item">
              <span className="f-ci" dangerouslySetInnerHTML={{ __html: ICON_CLOCK }} />
              <div>
                Lun–Vie: {v('horario_semana')}<br />
                Sábados: {v('horario_sabado')}
                {info.horario_domingo && <><br />Domingos y festivos: {info.horario_domingo}</>}
              </div>
            </div>

            <div className="f-ci-item">
              <span className="f-ci" dangerouslySetInnerHTML={{ __html: ICON_FOOTER_LOCATION }} />
              <div>{[info.direccion, v('ciudad')].filter(Boolean).join(', ')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Almacén Russitex P. L. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
