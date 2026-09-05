import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AsesoriaPage from './pages/AsesoriaPage'
import CatalogPage from './pages/CatalogPage'
import SobreNosotrosPage from './pages/SobreNosotrosPage'
import ProductoDetallePage from './pages/ProductoDetallePage'
import NuevaContrasenaPage from './pages/NuevaContrasenaPage'
import ContactoPage from './pages/ContactoPage'
import NoEncontradaPage from './pages/NoEncontradaPage'
import FloatingActions from './components/FloatingActions'
import ScrollToTop from './ScrollToTop'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Envuelve a las páginas y a FloatingActions, para que cualquiera
            pueda abrir el chat aunque el panel lo pinte el componente. */}
        <ChatProvider>
          <ScrollToTop />
          <Routes>
            {/* El inicio necesita su propia ruta. Antes no la tenía: caía en
                el comodín de abajo, que apuntaba a HomePage. */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* A esta ruta llega el enlace del correo de recuperación.
                Debe coincidir con el redirectTo de routes/auth.js. */}
            <Route path="/nueva-contrasena" element={<NuevaContrasenaPage />} />
            <Route path="/asesoria" element={<AsesoriaPage />} />
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
            <Route path="/contacto" element={<ContactoPage />} />
            <Route path="/producto/:id" element={<ProductoDetallePage />} />
            {/* Cualquier URL desconocida. Antes caía en HomePage, así que
                un enlace mal escrito mostraba el inicio sin avisar de nada. */}
            <Route path="*" element={<NoEncontradaPage />} />
          </Routes>
          {/* Fuera de <Routes> a propósito: se monta una sola vez, así los
              botones salen en todas las páginas y el chat no pierde la
              conversación al navegar. */}
          <FloatingActions />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
