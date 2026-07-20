import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './LoginPage.css'

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
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /></svg>
  ) : (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, loginConProveedor, forgotPassword } = useAuth()

  const [tab, setTab] = useState('login')
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
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-msg">📦 <strong>Envíos el mismo día en Bogotá</strong> &nbsp;—&nbsp; Haz tu pedido antes de las 12:00 p.m.</div>
          <div className="topbar-msg">🎁 <strong>Envío gratis</strong> en compras superiores a <strong>$350.000 COP</strong></div>
        </div>
      </div>

      <header>
        <a href="/" className="logo">Russi<span>tex</span></a>
        <button type="button" className="header-back" onClick={() => navigate('/')}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Volver
        </button>
      </header>

      <div className="auth-main">
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
            <form className={`auth-pane active`} onSubmit={handleLogin}>
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
            <form className={`auth-pane active`} onSubmit={handleRegister}>
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

      <footer>
        <div className="footer-bottom">
          <p>© 2026 Russitex — Todos los derechos reservados</p>
          <div className="footer-links">
            <a href="#">Política de privacidad</a>
            <a href="#">Términos y condiciones</a>
          </div>
        </div>
      </footer>

      <a href="https://wa.me/573132494118" className="wa-float" target="_blank" rel="noopener noreferrer">
        <span className="wa-float-tooltip">¿Tienes dudas? Escríbenos</span>
        <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L.054 23.25a.75.75 0 00.916.927l5.487-1.493A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 01-4.978-1.365l-.356-.213-3.696 1.006 1.006-3.696-.213-.356A9.713 9.713 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" /></svg>
      </a>
    </div>
  )
}
