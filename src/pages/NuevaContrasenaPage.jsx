import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import EyeIcon from '../components/EyeIcon'
import { supabase } from '../lib/supabaseClient'
import { calcularFortaleza, LARGO_MINIMO } from '../lib/password'
import './LoginPage.css'

/**
 * Página a la que llega el enlace del correo de "olvidé mi contraseña".
 *
 * Supabase manda el token en la URL, pero no siempre de la misma forma
 * según cómo esté configurado el proyecto:
 *   - implícito : #access_token=...&type=recovery   (lo lee supabase-js solo)
 *   - PKCE      : ?code=...                         (hay que canjearlo)
 *   - verify    : ?token_hash=...&type=recovery     (hay que verificarlo)
 *
 * Cubrimos los tres, porque cuál llega depende de la configuración del
 * proyecto en Supabase y puede cambiar sin avisar.
 */
export default function NuevaContrasenaPage() {
  const navigate = useNavigate()

  const [estado, setEstado] = useState('verificando')  // verificando | listo | invalido
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [verPwd, setVerPwd] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const fortaleza = calcularFortaleza(pwd)

  useEffect(() => {
    let activo = true

    async function validarEnlace() {
      const params = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

      // Sin token no hay nada que hacer acá. Si no lo exigiéramos, a
      // cualquiera con la sesión ya abierta le bastaría entrar a esta URL
      // para cambiar la contraseña sin escribir la anterior.
      const traeToken = Boolean(
        params.get('code') || params.get('token_hash') ||
        hash.get('access_token') || hash.get('error_description')
      )
      if (!traeToken) {
        if (activo) setEstado('invalido')
        return
      }

      try {
        if (params.get('code')) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.get('code'))
          if (error) throw error
        } else if (params.get('token_hash')) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.get('token_hash'),
            type: params.get('type') || 'recovery',
          })
          if (error) throw error
        } else if (hash.get('error_description')) {
          // Supabase avisa así cuando el enlace ya venció o se usó.
          throw new Error(hash.get('error_description'))
        }
        // En el flujo implícito supabase-js ya guardó la sesión al cargar
        // la página, así que solo queda confirmar que existe.
        const { data } = await supabase.auth.getSession()
        if (!activo) return
        setEstado(data.session ? 'listo' : 'invalido')
      } catch {
        if (activo) setEstado('invalido')
      }
    }

    validarEnlace()
    return () => { activo = false }
  }, [])

  async function guardar(e) {
    e.preventDefault()
    setError(null)

    if (pwd.length < LARGO_MINIMO) {
      setError(`La contraseña debe tener al menos ${LARGO_MINIMO} caracteres.`)
      return
    }
    if (pwd !== pwd2) {
      setError('Las dos contraseñas no coinciden.')
      return
    }

    setGuardando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd })
      if (error) throw error

      // Cerramos la sesión temporal del enlace y lo mandamos a entrar con
      // la contraseña nueva: así queda claro que de verdad quedó guardada.
      await supabase.auth.signOut()
      navigate('/login', {
        state: { aviso: 'Tu contraseña quedó actualizada. Ya puedes iniciar sesión.' },
      })
    } catch (err) {
      setError(err.message || 'No pudimos actualizar la contraseña. Intenta de nuevo.')
      setGuardando(false)
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
            {estado === 'verificando' && (
              <>
                <h2 className="auth-title" style={{ textAlign: 'center' }}>Verificando el enlace…</h2>
                <p className="auth-subtitle" style={{ textAlign: 'center' }}>Un momento, por favor.</p>
              </>
            )}

            {estado === 'invalido' && (
              <>
                <h2 className="auth-title" style={{ textAlign: 'center' }}>Este enlace ya no sirve</h2>
                <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                  Los enlaces para cambiar la contraseña vencen al poco tiempo y solo se pueden usar una vez.
                  Pide uno nuevo desde la página de ingreso.
                </p>
                <button type="button" className="btn-submit" onClick={() => navigate('/login')}>
                  Volver a intentarlo
                </button>
              </>
            )}

            {estado === 'listo' && (
              <>
                <h2 className="auth-title" style={{ textAlign: 'center' }}>Crea tu nueva contraseña</h2>
                <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                  Elige una contraseña que no uses en otros sitios.
                </p>

                {error && <div className="auth-feedback error">{error}</div>}

                <form className="auth-pane active" onSubmit={guardar}>
                  <div className="form-fields">
                    <div className="form-group">
                      <label className="form-label" htmlFor="pwd-nueva">Nueva contraseña</label>
                      <div className="input-wrap">
                        <input
                          id="pwd-nueva"
                          type={verPwd ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Mínimo 6 caracteres"
                          autoComplete="new-password"
                          value={pwd}
                          onChange={(e) => { setPwd(e.target.value); setError(null) }}
                        />
                        <button type="button" className="pwd-toggle" onClick={() => setVerPwd((v) => !v)}
                          aria-label={verPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                          <EyeIcon open={!verPwd} />
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

                    <div className="form-group">
                      <label className="form-label" htmlFor="pwd-repetir">Repite la contraseña</label>
                      <input
                        id="pwd-repetir"
                        type={verPwd ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Escríbela otra vez"
                        autoComplete="new-password"
                        value={pwd2}
                        onChange={(e) => { setPwd2(e.target.value); setError(null) }}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-submit" disabled={guardando}>
                    {guardando ? 'Guardando…' : 'Guardar contraseña'}
                  </button>
                </form>

                {/* Si la cuenta se creó con Google o Facebook, Supabase igual
                    permite ponerle contraseña. Conviene aclarar que se suma,
                    no reemplaza al botón social. */}
                <p className="auth-nota-social">
                  Si normalmente entras con Google o Facebook, puedes seguir haciéndolo.
                  Esta contraseña se suma como otra forma de entrar.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
