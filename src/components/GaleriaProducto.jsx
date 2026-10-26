import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Galería del detalle de producto (diseño version2, russitex-caja-tiza.html):
 * - Carrusel que se desliza con el dedo o el mouse, en bucle infinito.
 * - Miniaturas debajo; en tablet y celular el CSS las vuelve puntitos.
 * - Tocar la foto abre la vista grande, donde también se desliza y un
 *   toque acerca la imagen para ver la textura de la tela.
 *
 * El bucle usa un clon de la última foto al principio y de la primera al
 * final: al llegar a un clon se salta sin animación a la foto real.
 */
function useCarrusel(n, inicio = 0) {
  const bucle = n > 1
  const [pos, setPos] = useState(bucle ? inicio + 1 : inicio)
  const [animar, setAnimar] = useState(false)
  const [dx, setDx] = useState(0)
  const real = bucle ? (((pos - 1) % n) + n) % n : 0

  const ir = (p, conAnimacion = true) => {
    // Con flechas o deslizando muy rápido se podría pasar del clon antes
    // del salto; fuera de rango se ignora (el salto llega en un instante).
    if (bucle && (p < 0 || p > n + 1)) return
    setDx(0); setAnimar(conAnimacion); setPos(p)
  }
  // Al llegar a un clon, salto silencioso a la foto real cuando termina la
  // animación (0.4s). Con un temporizador y no con transitionend, que no
  // llega si la pestaña queda en segundo plano a mitad del movimiento.
  useEffect(() => {
    if (!bucle || (pos !== 0 && pos !== n + 1)) return
    const t = setTimeout(() => { setAnimar(false); setPos(pos === 0 ? n : 1) }, 450)
    return () => clearTimeout(t)
  }, [pos, bucle, n])
  const estilo = {
    transform: `translateX(calc(${-pos * 100}% + ${dx}px))`,
    transition: animar && dx === 0 ? undefined : 'none',
  }
  return { pos, real, bucle, ir, setDx, estilo }
}

// Arrastre con pointer events: devuelve { dx, dy, tap } al soltar.
function usePuntero({ alMover, alSoltar }) {
  const inicio = useRef(null)
  return {
    onPointerDown: (e) => {
      inicio.current = { x: e.clientX, y: e.clientY }
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sin captura */ }
    },
    onPointerMove: (e) => {
      if (!inicio.current) return
      alMover(e, e.clientX - inicio.current.x)
    },
    onPointerUp: (e) => {
      if (!inicio.current) return
      const dx = e.clientX - inicio.current.x, dy = e.clientY - inicio.current.y
      inicio.current = null
      alSoltar(e, { dx, dy, tap: Math.abs(dx) < 10 && Math.abs(dy) < 10 })
    },
    onPointerCancel: () => { inicio.current = null; alSoltar(null, { dx: 0, dy: 0, tap: false }) },
  }
}

const conClones = (imgs) => (imgs.length > 1 ? [imgs[imgs.length - 1], ...imgs, imgs[0]] : imgs)

export default function GaleriaProducto({ imagenes, alt, badge }) {
  const n = imagenes.length
  const c = useCarrusel(n)
  const [lbAbierto, setLbAbierto] = useState(false)
  const cerrarVista = useCallback(() => setLbAbierto(false), [])
  const principal = useRef(null)

  const puntero = usePuntero({
    alMover: (_, dx) => { if (c.bucle) c.setDx(dx) },
    alSoltar: (_, { dx, tap }) => {
      const w = principal.current?.offsetWidth || 300
      if (c.bucle && Math.abs(dx) > Math.max(45, w * 0.18)) c.ir(c.pos + (dx < 0 ? 1 : -1))
      else { c.ir(c.pos); if (tap) setLbAbierto(true) }
    },
  })

  return (
    <div className="gallery-media">
      <div className="gallery-main" ref={principal} {...puntero}>
        <div className="gallery-track" style={c.estilo}>
          {conClones(imagenes).map((src, i) => (
            <div className="gallery-slide" key={i}>
              <img src={src} alt={alt} draggable={false} />
            </div>
          ))}
        </div>
        {badge && <span className="gallery-badge">{badge}</span>}
      </div>

      {n > 1 && (
        <div className="gallery-thumbs">
          {imagenes.map((src, i) => (
            <button
              type="button"
              className={`thumb ${c.real === i ? 'active' : ''}`}
              key={`${src}-${i}`}
              onClick={() => c.ir(c.bucle ? i + 1 : i)}
              aria-label={`Ver foto ${i + 1}`}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}

      {lbAbierto && (
        <VistaGrande imagenes={imagenes} alt={alt} inicial={c.real} onCerrar={cerrarVista} />
      )}
    </div>
  )
}

function VistaGrande({ imagenes, alt, inicial, onCerrar }) {
  const n = imagenes.length
  const c = useCarrusel(n, inicial)   // abre en la foto que se estaba viendo
  const [zoom, setZoom] = useState(null)   // { slide, origen } de la foto acercada
  const viewport = useRef(null)

  // Mientras está abierta: sin scroll en la página y Escape para cerrar.
  useEffect(() => {
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const tecla = (e) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', tecla)
    return () => { document.body.style.overflow = antes; document.removeEventListener('keydown', tecla) }
  }, [onCerrar])

  // Flechas ‹ › en pantalla y del teclado: foto anterior / siguiente.
  const mover = (paso) => {
    if (!c.bucle) return
    setZoom(null)
    c.ir(c.pos + paso)
  }
  useEffect(() => {
    const tecla = (e) => {
      if (e.key === 'ArrowLeft') mover(-1)
      else if (e.key === 'ArrowRight') mover(1)
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  })

  const origenEn = (e) => {
    const r = e.target.closest('.lightbox-slide')?.querySelector('img')?.getBoundingClientRect()
    if (!r) return '50% 50%'
    const px = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
    const py = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100))
    return `${px}% ${py}%`
  }

  const puntero = usePuntero({
    alMover: (e, dx) => {
      if (zoom) setZoom({ ...zoom, origen: origenEn(e) })   // con zoom, mover recorre la textura
      else if (c.bucle) c.setDx(dx)
    },
    alSoltar: (e, { dx, tap }) => {
      if (zoom) { if (tap) setZoom(null); return }
      const w = viewport.current?.offsetWidth || 400
      if (c.bucle && Math.abs(dx) > Math.max(50, w * 0.15)) c.ir(c.pos + (dx < 0 ? 1 : -1))
      else if (tap && e) { c.ir(c.pos); setZoom({ slide: c.pos, origen: origenEn(e) }) }
      else c.ir(c.pos)
    },
  })

  return (
    <div className="lightbox open" aria-hidden="false" onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}>
      <button className="lightbox-close" onClick={onCerrar} aria-label="Cerrar">&times;</button>
      {c.bucle && (
        <>
          <button className="lightbox-nav prev" onClick={() => mover(-1)} aria-label="Foto anterior">&#8249;</button>
          <button className="lightbox-nav next" onClick={() => mover(1)} aria-label="Foto siguiente">&#8250;</button>
        </>
      )}
      <div className="lightbox-viewport" ref={viewport} {...puntero}>
        <div className="lightbox-track" style={c.estilo}>
          {conClones(imagenes).map((src, i) => {
            const acercada = zoom?.slide === i
            return (
              <div className="lightbox-slide" key={i}>
                <img
                  src={src}
                  alt={`${alt} ampliada`}
                  draggable={false}
                  className={acercada ? 'zoomed' : ''}
                  style={acercada ? { transform: 'scale(2.4)', transformOrigin: zoom.origen } : undefined}
                />
              </div>
            )
          })}
        </div>
      </div>
      <p className="lightbox-hint">Desliza para ver las demás fotos · toca la imagen para acercar y ver la textura</p>
    </div>
  )
}
