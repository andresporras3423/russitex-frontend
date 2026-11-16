// Configuración de las pruebas de punta a punta con Playwright.
// Correr:            npm run pruebas
// Ver paso a paso:   npm run pruebas:ui
// Grabar una nueva:  npm run pruebas:grabar
import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './pruebas',
  // Render gratis puede tardar hasta un minuto en despertar.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // Por defecto se prueba la web publicada; para probar la local:
    // URL_PRUEBAS=http://localhost:5173 npm run pruebas
    baseURL: process.env.URL_PRUEBAS || 'https://russitex.com',
    locale: 'es-CO',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // channel 'chrome' usa el Google Chrome instalado: en este Windows el
  // Chromium que descarga Playwright no arranca (no está firmado y Windows
  // lo bloquea). Los equipos de GitHub Actions también traen Chrome.
  projects: [
    { name: 'computador', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'celular', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
})
