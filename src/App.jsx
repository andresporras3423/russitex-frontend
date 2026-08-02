import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AsesoriaPage from './pages/AsesoriaPage'
import CatalogPage from './pages/CatalogPage'
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
          <Route path="*" element={<HomePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
