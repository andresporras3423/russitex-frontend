import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { CartProvider } from './context/CartContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AsesoriaPage from './pages/AsesoriaPage'
import CatalogPage from './pages/CatalogPage'
import SobreNosotrosPage from './pages/SobreNosotrosPage'
import LegalPage from './pages/LegalPage'
import ProductoDetallePage from './pages/ProductoDetallePage'
import NuevaContrasenaPage from './pages/NuevaContrasenaPage'
import ContactoPage from './pages/ContactoPage'
import FaqPage from './pages/FaqPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ConfirmacionPage from './pages/ConfirmacionPage'
import MiCuentaPage from './pages/MiCuentaPage'
import AdminPage from './pages/AdminPage'
import NoEncontradaPage from './pages/NoEncontradaPage'
import FloatingActions from './components/FloatingActions'
import MiniCart from './components/MiniCart'
import ScrollToTop from './ScrollToTop'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Envuelve a las páginas y a FloatingActions, para que cualquiera
            pueda abrir el chat aunque el panel lo pinte el componente. */}
        <ChatProvider>
         <CartProvider>
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
            <Route path="/preguntas-frecuentes" element={<FaqPage />} />
            <Route path="/politica-de-envios" element={<LegalPage doc="envios" />} />
            <Route path="/cambios-y-devoluciones" element={<LegalPage doc="devoluciones" />} />
            <Route path="/terminos-y-condiciones" element={<LegalPage doc="terminos" />} />
            <Route path="/politica-de-privacidad" element={<LegalPage doc="privacidad" />} />
            <Route path="/producto/:id" element={<ProductoDetallePage />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/confirmacion" element={<ConfirmacionPage />} />
            <Route path="/pedido-cancelado" element={<ConfirmacionPage cancelado />} />
            {/* Una sola ruta: Resumen, Mis pedidos y el detalle comparten la carga de pedidos. */}
            <Route path="/mi-cuenta/*" element={<MiCuentaPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
            {/* Cualquier URL desconocida. Antes caía en HomePage, así que
                un enlace mal escrito mostraba el inicio sin avisar de nada. */}
            <Route path="*" element={<NoEncontradaPage />} />
          </Routes>
          {/* Fuera de <Routes> a propósito: se monta una sola vez, así los
              botones salen en todas las páginas y el chat no pierde la
              conversación al navegar. */}
          <FloatingActions />
          <MiniCart />
         </CartProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
