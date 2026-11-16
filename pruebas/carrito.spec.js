// Recorrido de compra hasta antes de pagar: catálogo -> agregar -> carrito -> checkout.
// Partió de la grabación de codegen; se cambió lo frágil y se agregaron comprobaciones.
import { test, expect } from '@playwright/test'

// "$10.000" -> 10000
const pesos = (texto) => Number(texto.replace(/\D/g, ''))

test('agregar un producto al carrito y llegar al pago', async ({ page }) => {
  // Directo al catálogo: en celular el enlace "Catálogo" está dentro del menú.
  await page.goto('/catalogo')

  // La primera tarjeta que se pueda agregar directo (sin variantes ni agotada).
  const tarjeta = page
    .locator('.prod-card')
    .filter({ has: page.getByRole('button', { name: 'Agregar', exact: true }) })
    .first()

  // Se leen nombre y precio de la página, para no depender de un producto fijo.
  const nombre = await tarjeta.locator('.prod-name').innerText()
  const precio = pesos(await tarjeta.locator('.prod-price').innerText())

  await tarjeta.getByRole('button', { name: 'Agregar', exact: true }).click()

  // Se abre el carrito lateral con el producto.
  const carrito = page.getByRole('dialog', { name: 'Carrito de compra' })
  await expect(carrito.locator('.mc-item-name')).toHaveText(nombre)

  // Subir a 3 unidades (la grabación usó doble clic; dos clics es más claro).
  const masUno = carrito.getByRole('button', { name: 'Agregar uno' })
  await masUno.click()
  await masUno.click()
  await expect(carrito.locator('.mc-qty-num')).toHaveText('3')

  // El total debe ser precio x 3.
  await expect(carrito.locator('.mc-total-value')).toHaveText(new RegExp(`${(precio * 3).toLocaleString('es-CO')}`))

  // Y "Ir a pagar" lleva al checkout.
  await carrito.getByRole('link', { name: 'Ir a pagar' }).click()
  await expect(page).toHaveURL(/\/checkout/)
})
