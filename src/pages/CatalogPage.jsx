import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import './CatalogPage.css'
import { ICON_WA_FLOAT } from './catalogIcons'

const API_URL = import.meta.env.VITE_API_URL

// Imagen de reemplazo mientras un producto no tenga foto cargada en Supabase.
const IMAGEN_POR_DEFECTO = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=75'


const CATEGORIES = [
  { key: 'todos', label: 'Todos los materiales' },
  { key: 'forros', label: 'Forros' },
  { key: 'entretelas', label: 'Entretelas' },
  { key: 'hombreras', label: 'Hombreras' },
  { key: 'guatas', label: 'Guatas' },
  { key: 'tizas', label: 'Tizas' },
  { key: 'cierres', label: 'Cierres' },
  { key: 'otros', label: 'Otros materiales' },
]

function contarPorCategoria(productos) {
  return CATEGORIES.reduce((acc, c) => {
    acc[c.key] = c.key === 'todos'
      ? productos.length
      : productos.filter((p) => p.cat === c.key).length
    return acc
  }, {})
}

const CAT_LABELS = { forros: 'Forros', entretelas: 'Entretelas', hombreras: 'Hombreras', guatas: 'Guatas', tizas: 'Tizas', cierres: 'Cierres', otros: 'Otros' }

const money = (n) => `$${n.toLocaleString('es-CO')}`

export default function CatalogPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCat = searchParams.get('cat') || 'todos'

  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('default')
  const [availOnly, setAvailOnly] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchInputRef = useRef(null)

  // El catálogo viene del backend, que une Alegra (nombre/precio)
  // con Supabase (categoría/imagen).
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)

  useEffect(() => {
    let activo = true
    async function cargar() {
      setCargando(true)
      setErrorCarga(null)
      try {
        const res = await fetch(`${API_URL}/api/productos`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar el catálogo')
        if (!activo) return
        setProductos(
          (data.productos || []).map((p) => ({
            id: p.id,
            cat: p.categoria,
            name: p.nombre,
            unit: p.unidad,
            price: p.precio,
            img: p.imagen || IMAGEN_POR_DEFECTO,
          }))
        )
      } catch (e) {
        if (activo) setErrorCarga(e.message)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [])

  const catCounts = useMemo(() => contarPorCategoria(productos), [productos])

  function setFilter(cat) {
    if (cat === 'todos') {
      searchParams.delete('cat')
      setSearchParams(searchParams)
    } else {
      setSearchParams({ cat })
    }
    setSidebarOpen(false)
    document.querySelector('.catalog-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function clearFilters() {
    searchParams.delete('cat')
    setSearchParams(searchParams)
    setSearchTerm('')
    setSortOrder('default')
  }

  const visible = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    let list = productos.filter((p) => (activeCat === 'todos' || p.cat === activeCat) && p.name.toLowerCase().includes(term))
    if (sortOrder === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (sortOrder === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    else if (sortOrder === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [productos, activeCat, searchTerm, sortOrder])

  const showPromos = activeCat === 'todos' && searchTerm === ''
  const hasFilters = activeCat !== 'todos' || searchTerm !== '' || sortOrder !== 'default'

  return (
    <div className="catalog-page">
      <SiteHeader activeLink="catalogo" />

      <div className="page-banner">
        <div>
          <div className="breadcrumb">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>Inicio</a>
            <span>/</span>
            <span style={{ color: 'rgba(255,255,255,0.75)' }}>Catálogo</span>
          </div>
          <h1 className="banner-title">Catálogo de materiales</h1>
          <p className="banner-sub">Materiales para confección en Bogotá</p>
        </div>
        <div className="banner-count"><strong>{visible.length}</strong> productos disponibles</div>
      </div>

      <div className="catalog-layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-title">
            Filtros
            <button className={`sidebar-clear ${hasFilters ? 'visible' : ''}`} onClick={clearFilters}>Limpiar todo</button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></svg>
              Categorías
            </div>
            <div className="cat-filters">
              {CATEGORIES.map((c) => (
                <button key={c.key} className={`cat-filter-btn ${activeCat === c.key ? 'active' : ''}`} onClick={() => setFilter(c.key)}>
                  {c.label} <span className="cat-count">{catCounts[c.key]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d="M7 4v16" /><path d="m3.5 8 3.5-4 3.5 4" /><path d="M17 20V4" /><path d="m13.5 16 3.5 4 3.5-4" /></svg>
              Ordenar por precio
            </div>
            <div className="sort-options">
              {[
                { value: 'default', label: 'Relevancia' },
                { value: 'price-asc', label: 'Menor a mayor' },
                { value: 'price-desc', label: 'Mayor a menor' },
                { value: 'name-asc', label: 'Nombre A → Z' },
              ].map((o) => (
                <label key={o.value} className={`sort-opt ${sortOrder === o.value ? 'selected' : ''}`}>
                  <input type="radio" name="sort" value={o.value} checked={sortOrder === o.value} onChange={() => setSortOrder(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
              Disponibilidad
            </div>
            <div className="toggle-row">
              <span className="toggle-label">Solo disponibles</span>
              <button className={`toggle ${availOnly ? 'on' : ''}`} onClick={() => setAvailOnly((v) => !v)} aria-pressed={availOnly}>
                <span className="toggle-thumb"></span>
              </button>
            </div>
          </div>
        </aside>

        <main className="catalog-main">
          <div className="catalog-topbar">
            <button className="filtros-toggle" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M3 5h18" /><path d="M6 12h12" /><path d="M10 19h4" /></svg>
              Filtros
            </button>
            <div className="search-box">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              <input ref={searchInputRef} type="text" className="search-input" placeholder="Buscar material..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <p className="results-text">Mostrando <strong>{visible.length}</strong> de <strong>{productos.length}</strong> productos</p>
          </div>

          <div className="active-chips">
            {activeCat !== 'todos' && (
              <div className="chip">{CAT_LABELS[activeCat]} <button onClick={() => setFilter('todos')}>✕</button></div>
            )}
            {searchTerm && (
              <div className="chip">"{searchTerm}" <button onClick={() => setSearchTerm('')}>✕</button></div>
            )}
          </div>

          <div className="products-grid">
            {cargando && (
              <div className="empty-state visible">
                <h3>Cargando catálogo…</h3>
                <p>Estamos trayendo los productos y precios actualizados.</p>
              </div>
            )}

            {!cargando && errorCarga && (
              <div className="empty-state visible">
                <div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg></div>
                <h3>No pudimos cargar el catálogo</h3>
                <p>{errorCarga}</p>
                <button onClick={() => window.location.reload()}>Reintentar</button>
              </div>
            )}

            {!cargando && !errorCarga && visible.map((p) => (
              <div className="prod-card" key={p.id}>
                <div className="prod-img">
                  <img src={p.img} alt={p.name} loading="lazy" />
                  <span className="prod-cat-tag">{CAT_LABELS[p.cat]}</span>
                </div>
                <div className="prod-body">
                  <div className="prod-name">{p.name}</div>
                  <div className="prod-unit">{p.unit}</div>
                  <div className="prod-price">{money(p.price)}</div>
                  <div className="prod-actions">
                    <button className="btn-add">Agregar</button>
                    <button className="btn-consultar">Consultar</button>
                  </div>
                </div>
              </div>
            ))}

            {!cargando && !errorCarga && showPromos && (
              <>
                <div className="promo-card consult">
                  <div className="promo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /></svg></div>
                  <div className="promo-title">¿No encuentras lo que buscas?</div>
                  <div className="promo-desc">Cuéntanos tu proyecto y te ayudamos a encontrar el material exacto.</div>
                  <a className="promo-btn" href="https://wa.me/573138909118" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
                </div>
                <div className="promo-card shipping">
                  <div className="promo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d="M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1" /><path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-1" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /><path d="M9 18h6" /></svg></div>
                  <div className="promo-title">Envío gratis en compras +$350.000</div>
                  <div className="promo-desc">Entrega el mismo día en Bogotá para pedidos antes de las 12 p.m.</div>
                  <button className="promo-btn" onClick={() => navigate('/asesoria')}>Ver más info</button>
                </div>
              </>
            )}

            {!cargando && !errorCarga && visible.length === 0 && (
              <div className="empty-state visible">
                <div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg></div>
                <h3>No encontramos ese material</h3>
                <p>Intenta con otro nombre o explora todas las categorías.</p>
                <button onClick={clearFilters}>Ver todos los productos</button>
              </div>
            )}
          </div>
        </main>
      </div>

      <SiteFooter />

      <a href="https://wa.me/573138909118" className="wa-float" target="_blank" rel="noopener noreferrer">
        <span className="wa-float-tooltip">¿Tienes dudas? Escríbenos</span>
        <span dangerouslySetInnerHTML={{ __html: ICON_WA_FLOAT }} />
        <span className="wa-float-badge">1</span>
      </a>
    </div>
  )
}
