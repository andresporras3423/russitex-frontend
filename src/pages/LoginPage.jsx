import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import SiteHeader from '../components/SiteHeader'
import './LoginPage.css'
import {
  ICON_CLOCK, ICON_FOOTER_WA, ICON_FOOTER_LOCATION, ICON_WA_FLOAT,
} from './catalogIcons'

function calcularFortaleza(val) {
  if (!val) return { score: 0, label: 'Ingresa una contraseña' }
  let score = 0
  if (val.length >= 8) score++
  if (/[A-Z]/.test(val) || /[0-9]/.test(val)) score++
  if (/[^A-Za-z0-9]/.test(val) && val.length >= 10) score++

  const labels = { 1: 'Contraseña débil', 2: 'Contraseña regular', 3: 'Contraseña segura' }
  return { score, label: labels[score] || 'Contraseña débil' }
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.271,9.419C21.72,6.893,18.192,2.655,12,2.655S2.28,6.893.729,9.419a4.908,4.908,0,0,0,0,5.162C2.28,17.107,5.808,21.345,12,21.345s9.72-4.238,11.271-6.764A4.908,4.908,0,0,0,23.271,9.419Zm-1.705,4.115C20.234,15.7,17.219,19.345,12,19.345S3.766,15.7,2.434,13.534a2.918,2.918,0,0,1,0-3.068C3.766,8.3,6.781,4.655,12,4.655s8.234,3.641,9.566,5.811A2.918,2.918,0,0,1,21.566,13.534Z" /><path d="M12,7a5,5,0,1,0,5,5A5.006,5.006,0,0,0,12,7Zm0,8a3,3,0,1,1,3-3A3,3,0,0,1,12,15Z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.271,9.419A15.866,15.866,0,0,0,19.9,5.51l2.8-2.8a1,1,0,0,0-1.414-1.414L18.241,4.345A12.054,12.054,0,0,0,12,2.655C5.809,2.655,2.281,6.893.729,9.419a4.908,4.908,0,0,0,0,5.162A15.866,15.866,0,0,0,4.1,18.49l-2.8,2.8a1,1,0,1,0,1.414,1.414l3.052-3.052A12.054,12.054,0,0,0,12,21.345c6.191,0,9.719-4.238,11.271-6.764A4.908,4.908,0,0,0,23.271,9.419ZM2.433,13.534a2.918,2.918,0,0,1,0-3.068C3.767,8.3,6.782,4.655,12,4.655A10.1,10.1,0,0,1,16.766,5.82L14.753,7.833a4.992,4.992,0,0,0-6.92,6.92l-2.31,2.31A13.723,13.723,0,0,1,2.433,13.534ZM15,12a3,3,0,0,1-3,3,2.951,2.951,0,0,1-1.285-.3L14.7,10.715A2.951,2.951,0,0,1,15,12ZM9,12a3,3,0,0,1,3-3,2.951,2.951,0,0,1,1.285.3L9.3,13.285A2.951,2.951,0,0,1,9,12Zm12.567,1.534C20.233,15.7,17.218,19.345,12,19.345A10.1,10.1,0,0,1,7.234,18.18l2.013-2.013a4.992,4.992,0,0,0,6.92-6.92l2.31-2.31a13.723,13.723,0,0,1,3.09,3.529A2.918,2.918,0,0,1,21.567,13.534Z" /></svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, register, loginConProveedor, forgotPassword } = useAuth()

  const [tab, setTab] = useState(location.state?.tab === 'register' ? 'register' : 'login')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'error' | 'success', text }

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPwd, setLoginPwd] = useState('')
  const [showLoginPwd, setShowLoginPwd] = useState(false)

  const [registerNombre, setRegisterNombre] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPwd, setRegisterPwd] = useState('')
  const [showRegisterPwd, setShowRegisterPwd] = useState(false)

  const fortaleza = calcularFortaleza(registerPwd)

  // Tras un login social (Google/Facebook), Supabase redirige de vuelta a /login
  // con el token en la URL. En cuanto el usuario quede disponible, lo mandamos al inicio.
  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  async function handleLogin(e) {
    e.preventDefault()
    setFeedback(null)
    setBusy(true)
    try {
      await login(loginEmail, loginPwd)
      navigate('/')
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setFeedback(null)
    setBusy(true)
    try {
      const data = await register(registerNombre, registerEmail, registerPwd)
      setFeedback({ type: 'success', text: data.mensaje })
      setTab('login')
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function handleSocial(provider) {
    setFeedback(null)
    try {
      await loginConProveedor(provider)
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    }
  }

  async function handleForgotPassword() {
    setFeedback(null)
    if (!loginEmail) {
      setFeedback({ type: 'error', text: 'Escribe tu correo arriba para poder enviarte el enlace.' })
      return
    }
    setBusy(true)
    try {
      const data = await forgotPassword(loginEmail)
      setFeedback({ type: 'success', text: data.mensaje })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <SiteHeader />

      <div className="auth-main">
        <div className="auth-box">
          <a href="#" className="volver-link" onClick={(e) => { e.preventDefault(); navigate('/') }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Volver
          </a>
          <div className="auth-card">
            <h2 className="auth-title" style={{ textAlign: 'center' }}>Accede a tu cuenta</h2>
            <p className="auth-subtitle" style={{ textAlign: 'center' }}>Elige cómo quieres entrar o registrarte en Russitex.</p>

            <div className="social-buttons">
              <button type="button" className="btn-social" disabled={busy} onClick={() => handleSocial('google')}>
                <span className="btn-social-icon">
                  <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                </span>
                Continuar con Google
              </button>
              <button type="button" className="btn-social" disabled={busy} onClick={() => handleSocial('facebook')}>
                <span className="btn-social-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" /></svg>
                </span>
                Continuar con Facebook
              </button>
            </div>

            <div className="auth-divider"><span>o continúa con tu correo</span></div>

            <div className="auth-tabs">
              <button type="button" className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setFeedback(null) }}>Iniciar sesión</button>
              <button type="button" className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setFeedback(null) }}>Crear cuenta</button>
            </div>

            {feedback && (
              <div className={`auth-feedback ${feedback.type}`}>{feedback.text}</div>
            )}

            {tab === 'login' && (
              <form className="auth-pane active" onSubmit={handleLogin}>
                <div className="form-fields">
                  <div className="form-group">
                    <label className="form-label">Correo electrónico</label>
                    <input type="email" className="form-input" placeholder="tucorreo@ejemplo.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña</label>
                    <div className="input-wrap">
                      <input type={showLoginPwd ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={loginPwd} onChange={(e) => setLoginPwd(e.target.value)} required />
                      <button type="button" className="pwd-toggle" tabIndex={-1} onClick={() => setShowLoginPwd((v) => !v)}>
                        <EyeIcon open={!showLoginPwd} />
                      </button>
                    </div>
                  </div>
                  <div className="form-footer-row">
                    <label className="remember-label"><input type="checkbox" /> Recordarme</label>
                    <button type="button" className="forgot-link" onClick={handleForgotPassword}>¿Olvidaste tu contraseña?</button>
                  </div>
                </div>
                <button type="submit" className="btn-submit" disabled={busy}>{busy ? 'Ingresando...' : 'Iniciar sesión'}</button>
              </form>
            )}

            {tab === 'register' && (
              <form className="auth-pane active" onSubmit={handleRegister}>
                <div className="form-fields">
                  <div className="form-group">
                    <label className="form-label">Nombre completo</label>
                    <input type="text" className="form-input" placeholder="Tu nombre" value={registerNombre} onChange={(e) => setRegisterNombre(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo electrónico</label>
                    <input type="email" className="form-input" placeholder="tucorreo@ejemplo.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña</label>
                    <div className="input-wrap">
                      <input type={showRegisterPwd ? 'text' : 'password'} className="form-input" placeholder="Mínimo 8 caracteres" value={registerPwd} onChange={(e) => setRegisterPwd(e.target.value)} required />
                      <button type="button" className="pwd-toggle" tabIndex={-1} onClick={() => setShowRegisterPwd((v) => !v)}>
                        <EyeIcon open={!showRegisterPwd} />
                      </button>
                    </div>
                    <div className="pwd-strength">
                      <div className="pwd-strength-bar">
                        <div className={`pwd-bar-seg ${fortaleza.score === 1 ? 'weak' : fortaleza.score === 2 ? 'medium' : fortaleza.score >= 3 ? 'strong' : ''}`}></div>
                        <div className={`pwd-bar-seg ${fortaleza.score === 2 ? 'medium' : fortaleza.score >= 3 ? 'strong' : ''}`}></div>
                        <div className={`pwd-bar-seg ${fortaleza.score >= 3 ? 'strong' : ''}`}></div>
                      </div>
                      <span className="pwd-strength-label">{fortaleza.label}</span>
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn-submit" disabled={busy}>{busy ? 'Creando...' : 'Crear cuenta'}</button>
                <p className="terms-note">Al crear una cuenta aceptas nuestros <a href="#">Términos y condiciones</a> y nuestra <a href="#">Política de privacidad</a>.</p>
              </form>
            )}
          </div>
        </div>
      </div>

      <footer>
        <div className="footer-grid">
          <div>
            <span className="f-logo">Russi<span>tex</span></span>
            <p className="footer-desc">Materiales para confección en Bogotá, Colombia.</p>
            <p className="footer-slogan">39 años siendo tu mano amiga en confección.</p>
          </div>
          <div className="f-col">
            <h4>Información</h4>
            <ul>
              <li><a href="#">Preguntas frecuentes</a></li>
              <li><a href="#">Políticas de envío</a></li>
              <li><a href="#">Cambios y devoluciones</a></li>
              <li><a href="#">Términos y condiciones</a></li>
              <li><a href="#">Política de privacidad</a></li>
            </ul>
          </div>
          <div className="f-col">
            <h4>Contacto</h4>
            <div className="f-contact">
              <div className="f-ci-item"><span className="f-ci" dangerouslySetInnerHTML={{ __html: ICON_FOOTER_WA }} /><div>WhatsApp: <a href="https://wa.me/573138909118">+57 313 890 9118</a></div></div>
              <div className="f-ci-item"><span className="f-ci" dangerouslySetInnerHTML={{ __html: ICON_CLOCK }} /><div>Lun–Vie: 10:00 a.m. – 6:00 p.m.<br />Sábados: 10:00 a.m. – 5:00 p.m.</div></div>
              <div className="f-ci-item"><span className="f-ci" dangerouslySetInnerHTML={{ __html: ICON_FOOTER_LOCATION }} /><div>Bogotá, Colombia</div></div>
            </div>
          </div>
        </div>
        <div className="footer-bottom"><p>© 2026 Russitex. Todos los derechos reservados.</p></div>
      </footer>

      <a href="https://wa.me/573138909118" className="wa-float" target="_blank" rel="noopener noreferrer">
        <span className="wa-float-tooltip">¿Tienes dudas? Escríbenos</span>
        <span dangerouslySetInnerHTML={{ __html: ICON_WA_FLOAT }} />
        <span className="wa-float-badge">1</span>
      </a>
    </div>
  )
}
