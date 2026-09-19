import { createContext, useContext } from 'react'

/**
 * Carrito de compra. El contexto y el hook viven acá; el Provider (con toda
 * la lógica y la persistencia) está en CartContext.jsx.
 *
 * Mismo patrón que useAuth / useChat: así React Refresh no se queja de que
 * un archivo exporte a la vez componentes y hooks.
 */
export const CartContext = createContext(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}

/**
 * Clave única de una línea del carrito. Un mismo producto en dos variantes
 * (p. ej. Negro y Beige) son dos líneas distintas; sin variante, la clave es
 * solo el id del producto.
 */
export function claveLinea(productoId, varianteId) {
  return `${productoId}::${varianteId ?? ''}`
}
