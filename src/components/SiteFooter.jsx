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
        </div>

        <div className="f-col">
          <h4>Información</h4>
          <ul>
            {/* Envíos y devoluciones no tienen página propia todavía, pero la
                FAQ ya los responde, así que apuntan a su grupo. Mejor eso que
                un enlace muerto; el día que se redacte la política formal se
                cambia el destino. Términos y privacidad siguen sin nada (RC1-T4). */}
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/preguntas-frecuentes') }}>
                Preguntas frecuentes
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/preguntas-frecuentes#grupo-envios') }}>
                Políticas de envío
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/preguntas-frecuentes#grupo-devoluciones') }}>
                Cambios y devoluciones
              </a>
            </li>
            <li><a href="#">Términos y condiciones</a></li>
            <li><a href="#">Política de privacidad</a></li>
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
              <div>
                {info.direccion && <>{info.direccion}<br /></>}
                {v('ciudad')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Russitex. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
