import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext, claveLinea } from './useCart'

const CLAVE_STORAGE = 'russitex_carrito'

/**
 * Lee el carrito guardado en el navegador. Se envuelve en try/catch porque
 * localStorage puede fallar (modo privado, permisos) o traer datos viejos con
 * otra forma; ante cualquier duda se arranca con el carrito vacío.
 */
function leerGuardado() {
  try {
    const crudo = localStorage.getItem(CLAVE_STORAGE)
    if (!crudo) return []
    const datos = JSON.parse(crudo)
    return Array.isArray(datos) ? datos : []
  } catch {
    return []
  }
}

/**
 * Estado global del carrito. Cada línea guarda lo mínimo para mostrarse y para
 * cobrar sin volver a pedir el catálogo: id de Alegra, nombre, precio unitario,
 * unidad, imagen, categoría, cantidad y (si aplica) la variante elegida.
 *
 * La disponibilidad NO se guarda: se recalcula contra el catálogo en vivo en la
 * página del carrito, porque algo puede agotarse mientras está guardado.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(leerGuardado)

  // Persistir en cada cambio. Si localStorage falla, el carrito sigue vivo en
  // memoria durante la sesión; solo se pierde al recargar.
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(items))
    } catch {
      /* sin persistencia, pero la app no debe romperse por esto */
    }
  }, [items])

  /**
   * Agrega un producto (o suma a la línea existente si ya está, respetando la
   * variante). `producto` trae { id, nombre, precio, unidad, imagen, categoria }
   * y `variante` es { id, nombre, hex } o null.
   */
  const agregar = useCallback((producto, cantidad = 1, variante = null) => {
    const cant = Math.max(1, Math.floor(Number(cantidad) || 1))
    const clave = claveLinea(producto.id, variante?.id)

    setItems((prev) => {
      const i = prev.findIndex((l) => l.clave === clave)
      if (i !== -1) {
        const copia = [...prev]
        copia[i] = { ...copia[i], cantidad: copia[i].cantidad + cant }
        return copia
      }
      return [
        ...prev,
        {
          clave,
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          unidad: producto.unidad || '',
          imagen: producto.imagen || '',
          categoria: producto.categoria || '',
          cantidad: cant,
          variante: variante
            ? { id: variante.id ?? null, nombre: variante.nombre, hex: variante.hex || null }
            : null,
        },
      ]
    })
  }, [])

  const cambiarCantidad = useCallback((clave, cantidad) => {
    const cant = Math.max(1, Math.floor(Number(cantidad) || 1))
    setItems((prev) => prev.map((l) => (l.clave === clave ? { ...l, cantidad: cant } : l)))
  }, [])

  const quitar = useCallback((clave) => {
    setItems((prev) => prev.filter((l) => l.clave !== clave))
  }, [])

  const vaciar = useCallback(() => setItems([]), [])

  // Derivados. Se recalculan solo cuando cambian las líneas.
  const { totalArticulos, subtotal } = useMemo(() => {
    return items.reduce(
      (acc, l) => ({
        totalArticulos: acc.totalArticulos + l.cantidad,
        subtotal: acc.subtotal + l.precio * l.cantidad,
      }),
      { totalArticulos: 0, subtotal: 0 }
    )
  }, [items])

  const valor = useMemo(
    () => ({
      items,
      lineas: items.length,
      totalArticulos,
      subtotal,
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
    }),
    [items, totalArticulos, subtotal, agregar, cambiarCantidad, quitar, vaciar]
  )

  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>
}
