// Las 8 categorías del catálogo, en el orden del menú. Salen de las fichas
// de producto de Paula (2026-11-21). Deben coincidir con las del backend
// (services/categorias.js), que es lo que acepta la base de datos.
export const CATEGORIAS = [
  { key: 'entretelas', label: 'Entretelas' },
  { key: 'forros', label: 'Forros' },
  { key: 'refuerzos', label: 'Refuerzos para saco y pantalón' },
  { key: 'telas', label: 'Telas para bolsillo y lonas' },
  { key: 'hombreras', label: 'Hombreras' },
  { key: 'tizas', label: 'Tizas' },
  { key: 'botones', label: 'Botones y cremalleras' },
  { key: 'otros', label: 'Otros materiales' },
]

// { entretelas: 'Entretelas', ... } para mostrar el nombre de una clave.
export const CAT_LABELS = Object.fromEntries(CATEGORIAS.map((c) => [c.key, c.label]))
