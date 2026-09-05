import { useLocation, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import './NoEncontradaPage.css'

// Atajos a lo que la gente suele estar buscando cuando cae acá.
const SUGERENCIAS = [
  { texto: 'Ver el catálogo completo', ruta: '/catalogo' },
  { texto: 'Pedir asesoría sobre un material', ruta: '/asesoria' },
  { texto: 'Cómo contactarnos', ruta: '/contacto' },
]

export default function NoEncontradaPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="nf-page">
      <SiteHeader />

      <section className="nf-main">
        <div className="nf-code" aria-hidden="true">404</div>

        <h1 className="nf-title">Esta página no existe</h1>

        <p className="nf-text">
          Puede que el enlace esté mal escrito, o que la página haya cambiado de sitio.
          Nada se perdió: el catálogo sigue completo.
        </p>

        {/* Mostrar la ruta ayuda a quien llegó por un enlace roto: puede
            ver la errata, y sirve para reportarla. */}
        <div className="nf-ruta">
          <span>Buscabas</span>
          <code>{pathname}</code>
        </div>

        <div className="nf-acciones">
          <button className="nf-btn-primario" onClick={() => navigate('/catalogo')}>
            Ver el catálogo
          </button>
          <button className="nf-btn-secundario" onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>

        <ul className="nf-sugerencias">
          {SUGERENCIAS.map((s) => (
            <li key={s.ruta}>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); navigate(s.ruta) }}
              >
                {s.texto}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </div>
  )
}
