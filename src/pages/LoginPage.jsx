import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import EyeIcon from '../components/EyeIcon'
import { calcularFortaleza } from '../lib/password'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, register, loginConProveedor, forgotPassword } = useAuth()

  const [tab, setTab] = useState(location.state?.tab === 'register' ? 'register' : 'login')
  const [busy, setBusy] = useState(false)
  // Puede venir con un aviso, por ejemplo al volver de cambiar la contraseña.
  const [feedback, setFeedback] = useState(
    location.state?.aviso ? { type: 'success', text: location.state.aviso } : null
  )

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

      <SiteFooter />

    </div>
  )
}
