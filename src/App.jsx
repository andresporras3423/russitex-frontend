import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AsesoriaPage from './pages/AsesoriaPage'
import CatalogPage from './pages/CatalogPage'
import SobreNosotrosPage from './pages/SobreNosotrosPage'
import ProductoDetallePage from './pages/ProductoDetallePage'
import FloatingActions from './components/FloatingActions'
import ScrollToTop from './ScrollToTop'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/asesoria" element={<AsesoriaPage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
          <Route path="/producto/:id" element={<ProductoDetallePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        {/* Fuera de <Routes> a propósito: se monta una sola vez, así los
            botones salen en todas las páginas y el chat no pierde la
            conversación al navegar. */}
        <FloatingActions />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
