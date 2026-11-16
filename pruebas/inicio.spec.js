// Primera prueba: la página de inicio carga y muestra lo esencial.
import { test, expect } from '@playwright/test'

test('el inicio carga con su título y los años calculados', async ({ page }) => {
  // 1. Abrir la página (baseURL + "/").
  await page.goto('/')

  // 2. Verificar el título principal.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Materiales para confección')

  // 3. Las cifras se calculan: los años desde 1987 deben ser los de hoy.
  const anios = String(new Date().getFullYear() - 1987)
  await expect(page.getByText(anios, { exact: true }).first()).toBeVisible()
})

test('una página que no existe muestra el aviso de no encontrada', async ({ page }) => {
  await page.goto('/esta-pagina-no-existe')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta página no existe')
})
