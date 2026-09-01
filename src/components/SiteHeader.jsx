import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useTiendaInfo } from '../hooks/useTiendaInfo'
import { useProductos } from '../hooks/useProductos'
import {
  ICON_FORROS, ICON_ENTRETELAS, ICON_HOMBRERAS, ICON_GUATAS, ICON_TIZAS,
  ICON_CIERRES, ICON_OTROS, ICON_TODOS, ICON_MEGA_VER_TODO,
} from '../pages/catalogIcons'
import './SiteHeader.css'

// Los conteos NO se escriben acá: se calculan con los productos que
// devuelve /api/productos, para que no queden desactualizados cuando
// se agregue o quite un producto en Alegra.
const MEGA_CATS = [
  { filter: 'forros', icon: ICON_FORROS, name: 'Forros' },
  { filter: 'entretelas', icon: ICON_ENTRETELAS, name: 'Entretelas' },
  { filter: 'hombreras', icon: ICON_HOMBRERAS, name: 'Hombreras' },
  { filter: 'guatas', icon: ICON_GUATAS, name: 'Guatas' },
  { filter: 'tizas', icon: ICON_TIZAS, name: 'Tizas' },
  { filter: 'cierres', icon: ICON_CIERRES, name: 'Cierres' },
  { filter: 'otros', icon: ICON_OTROS, name: 'Otros materiales' },
  { filter: 'todos', icon: ICON_TODOS, name: 'Ver todo' },
]

function textoConteo(n) {
  if (n === null || n === undefined) return ' '   // espacio, evita que salte el layout
  return n === 1 ? '1 producto' : `${n} productos`
}

function getInitials(user) {
  const base = user?.nombre?.trim() || user?.email || ''
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

function getPrimerNombre(user) {
  const base = user?.nombre?.trim() || user?.email || ''
  return base.split(/\s+/)[0] || ''
}

export default function SiteHeader({ activeLink }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const tienda = useTiendaInfo()
  const productos = useProductos()

  const [navOpen, setNavOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const searchInputRef = useRef(null)
  const userMenuRef = useRef(null)
  const navToggleRef = useRef(null)

  // Conteos por categoría para el mega-menú. Si la petición falla, el menú
  // igual funciona: simplemente no muestra los números.
  const conteos = useMemo(() => {
    if (productos.length === 0) return null
    const acc = { todos: productos.length }
    for (const p of productos) acc[p.categoria] = (acc[p.categoria] || 0) + 1
    return acc
  }, [productos])

  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [searchOpen])

  // Menú de "Mi cuenta": se cierra al hacer click afuera o al presionar Escape.
  useEffect(() => {
    if (!userOpen) return
    function onDocClick(e) {
      if (!userMenuRef.current?.contains(e.target)) setUserOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setUserOpen(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [userOpen])

  function closeMobileNav() {
    setNavOpen(false)
    setCatalogOpen(false)
  }

  // En escritorio el mega-menú se ve al hacer hover, así que el click en "Catálogo"
  // navega directo a la página. En móvil/tablet (donde no hay hover) el click abre el acordeón.
  function handleCatalogClick(e) {
    e.preventDefault()
    const isMobile = navToggleRef.current && getComputedStyle(navToggleRef.current).display !== 'none'
    if (isMobile) {
      setCatalogOpen((v) => !v)
    } else {
      navigate('/catalogo')
    }
  }

  function goToCatalogFilter(filter) {
    closeMobileNav()
    if (filter === 'todos') navigate('/catalogo')
    else navigate(`/catalogo?cat=${filter}`)
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-set topbar-set-desktop">
            <div className="topbar-msg">📦 <strong>Entrega el mismo día</strong> — {tienda.envio_mismo_dia ?? 'En Bogotá, para pedidos hechos antes de las 12:00 p.m.'}</div>
            <div className="topbar-msg">🎁 <strong>Envío gratis</strong> — {tienda.envio_gratis_desde ?? 'Compras superiores a $350.000 COP'}</div>
          </div>
          <div className="topbar-set topbar-set-mobile">
            <div className="topbar-msg">📦 {tienda.envio_mismo_dia ?? 'En Bogotá, para pedidos hechos antes de las 12:00 p.m.'}</div>
            <div className="topbar-msg">🎁 <strong>Envío gratis</strong> — {tienda.envio_gratis_desde ?? 'Compras superiores a $350.000 COP'}</div>
          </div>
        </div>
      </div>

      <header>
        <div className="header-inner">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); navigate('/') }}>Russi<span>tex</span></a>
          <nav id="mainNav" className={navOpen ? 'open' : ''}>
            <a href="#" className={activeLink === 'inicio' ? 'active' : ''} onClick={(e) => { e.preventDefault(); closeMobileNav(); navigate('/') }}>Inicio</a>

            <div className={`nav-catalog-wrap ${catalogOpen ? 'open' : ''}`}>
              <a href="#" className={activeLink === 'catalogo' ? 'active' : ''} onClick={handleCatalogClick}>
                Catálogo
                <svg className="mega-cat-arrow" width="10" height="6" fill="none" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </a>

              <div className="mega-menu">
                <div className="mega-menu-title">Explorar por categoría</div>
                <div className="mega-cats">
                  {MEGA_CATS.map((cat) => (
                    <a href="#" className="mega-cat" data-filter={cat.filter} key={cat.filter} onClick={(e) => { e.preventDefault(); goToCatalogFilter(cat.filter) }}>
                      <span className="mega-cat-icon" dangerouslySetInnerHTML={{ __html: cat.icon }} />
                      <span className="mega-cat-name">{cat.name}</span>
                      <span className="mega-cat-count">{textoConteo(conteos?.[cat.filter])}</span>
                    </a>
                  ))}
                </div>
                <div className="mega-footer">
                  <a href="#" className="mega-ver-todo" onClick={(e) => { e.preventDefault(); goToCatalogFilter('todos') }}>Ver todos los materiales <span dangerouslySetInnerHTML={{ __html: ICON_MEGA_VER_TODO }} /></a>
                </div>
              </div>

              <div className="mega-mobile">
                {MEGA_CATS.map((cat) => (
                  <a href="#" className="mega-mobile-cat" data-filter={cat.filter} key={cat.filter} onClick={(e) => { e.preventDefault(); goToCatalogFilter(cat.filter) }}>
                    {cat.filter === 'todos' ? 'Todos los materiales' : cat.name}
                  </a>
                ))}
              </div>
            </div>

            <a href="#" className={activeLink === 'asesoria' ? 'active' : ''} onClick={(e) => { e.preventDefault(); closeMobileNav(); navigate('/asesoria') }}>Asesoría</a>
            <a href="#" className={activeLink === 'sobre-nosotros' ? 'active' : ''} onClick={(e) => { e.preventDefault(); closeMobileNav(); navigate('/sobre-nosotros') }}>Sobre nosotros</a>
            <a href="#" className={activeLink === 'contacto' ? 'active' : ''} onClick={(e) => { e.preventDefault(); closeMobileNav(); navigate('/contacto') }}>Contacto</a>
          </nav>

          <div className="header-icons">
            <button ref={navToggleRef} className="nav-toggle" aria-label="Abrir menú" aria-expanded={navOpen} title="Menú" onClick={() => { setNavOpen((v) => !v); setSearchOpen(false) }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <button className={`icon-btn ${searchOpen ? 'active' : ''}`} title="Buscar" aria-label="Buscar" aria-expanded={searchOpen} onClick={() => { setSearchOpen((v) => !v); setNavOpen(false) }}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.707,22.293l-5.969-5.969a10.016,10.016,0,1,0-1.414,1.414l5.969,5.969a1,1,0,0,0,1.414-1.414ZM10,18a8,8,0,1,1,8-8A8.009,8.009,0,0,1,10,18Z" /></svg>
            </button>
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                className={`icon-btn ${user ? 'user-logged' : ''} ${userOpen ? 'active' : ''}`}
                title="Mi cuenta"
                aria-label="Mi cuenta"
                aria-expanded={userOpen}
                aria-haspopup="true"
                onClick={(e) => { e.stopPropagation(); setUserOpen((v) => !v) }}
              >
                {user ? (
                  <span className="user-initials">{getInitials(user)}</span>
                ) : (
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                )}
              </button>
              <div className={`user-menu ${userOpen ? 'open' : ''}`}>
                {user ? (
                  <>
                    <div className="user-menu-head">
                      <span className="user-avatar">{getInitials(user)}</span>
                      <div className="user-id">
                        <strong>Hola, {getPrimerNombre(user)}</strong>
                      </div>
                    </div>
                    <a href="#" onClick={(e) => { e.preventDefault(); setUserOpen(false) }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12,12A6,6,0,1,0,6,6,6.006,6.006,0,0,0,12,12ZM12,2A4,4,0,1,1,8,6,4,4,0,0,1,12,2Z" /><path d="M12,14a9.01,9.01,0,0,0-9,9,1,1,0,0,0,2,0,7,7,0,0,1,14,0,1,1,0,0,0,2,0A9.01,9.01,0,0,0,12,14Z" /></svg>
                      Mi cuenta
                    </a>
                    <a href="#" className="user-menu-out" onClick={(e) => { e.preventDefault(); setUserOpen(false); logout() }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.476,15a1,1,0,0,0-1,1v3a3,3,0,0,1-3,3H5a3,3,0,0,1-3-3V5A3,3,0,0,1,5,2H7.476a3,3,0,0,1,3,3V8a1,1,0,0,0,2,0V5a5.006,5.006,0,0,0-5-5H5A5.006,5.006,0,0,0,0,5V19a5.006,5.006,0,0,0,5,5H7.476a5.006,5.006,0,0,0,5-5V16A1,1,0,0,0,11.476,15Z" /><path d="M22.867,9.879,18.281,5.293a1,1,0,1,0-1.414,1.414l4.262,4.263L6,11a1,1,0,0,0,0,2H6l15.188-.031-4.323,4.324a1,1,0,1,0,1.414,1.414l4.586-4.586A3,3,0,0,0,22.867,9.879Z" /></svg>
                      Cerrar sesión
                    </a>
                  </>
                ) : (
                  <>
                    <a href="#" onClick={(e) => { e.preventDefault(); setUserOpen(false); navigate('/login') }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9,0H5.1A5.055,5.055,0,0,0,0,5V8A1,1,0,0,0,2,8V5A3.054,3.054,0,0,1,5.1,2H18.9A3.054,3.054,0,0,1,22,5V19a3.054,3.054,0,0,1-3.1,3H5.1A3.054,3.054,0,0,1,2,19V16a1,1,0,0,0-2,0v3a5.055,5.055,0,0,0,5.1,5H18.9A5.055,5.055,0,0,0,24,19V5A5.055,5.055,0,0,0,18.9,0Z" /><path d="M3,12a1,1,0,0,0,1,1H4l13.188-.03-4.323,4.323a1,1,0,1,0,1.414,1.414l4.586-4.586a3,3,0,0,0,0-4.242L14.281,5.293a1,1,0,0,0-1.414,1.414l4.262,4.263L4,11A1,1,0,0,0,3,12Z" /></svg>
                      Iniciar sesión
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); setUserOpen(false); navigate('/login', { state: { tab: 'register' } }) }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23,11H21V9a1,1,0,0,0-2,0v2H17a1,1,0,0,0,0,2h2v2a1,1,0,0,0,2,0V13h2a1,1,0,0,0,0-2Z" /><path d="M9,12A6,6,0,1,0,3,6,6.006,6.006,0,0,0,9,12ZM9,2A4,4,0,1,1,5,6,4,4,0,0,1,9,2Z" /><path d="M9,14a9.01,9.01,0,0,0-9,9,1,1,0,0,0,2,0,7,7,0,0,1,14,0,1,1,0,0,0,2,0A9.01,9.01,0,0,0,9,14Z" /></svg>
                      Crear cuenta
                    </a>
                  </>
                )}
              </div>
            </div>
            <button className="icon-btn cart-btn" title="Carrito">
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" /><path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" /></svg>
              <span className="cart-badge">0</span>
            </button>
          </div>
        </div>
        <div className={`header-search ${searchOpen ? 'open' : ''}`}>
          <div className="header-search-inner">
            <div className="header-search-box">
              <svg fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              <input ref={searchInputRef} type="text" className="header-search-input" placeholder="Buscar material..." aria-label="Buscar material" />
            </div>
            <button className="header-search-close" aria-label="Cerrar búsqueda" onClick={() => setSearchOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
