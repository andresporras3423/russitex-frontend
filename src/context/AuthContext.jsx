import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './useAuth'

const API_URL = import.meta.env.VITE_API_URL

// El token de Supabase dura 1 hora. Se mira su vencimiento (campo exp del
// JWT) para renovarlo antes de usarlo, con un margen de 30 segundos.
function tokenVencido(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(base64))
    return !exp || exp * 1000 < Date.now() + 30_000
  } catch {
    return true
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('russitex_token'))
  const [loading, setLoading] = useState(true)

  const cargarPerfil = useCallback(async (accessToken) => {
    const res = await fetch(`${API_URL}/api/auth/perfil`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error('No se pudo cargar el perfil')
    return res.json()
  }, [])

  const guardarSesion = useCallback((accessToken, refreshToken) => {
    localStorage.setItem('russitex_token', accessToken)
    if (refreshToken) localStorage.setItem('russitex_refresh', refreshToken)
    setToken(accessToken)
  }, [])

  const limpiarSesion = useCallback(() => {
    localStorage.removeItem('russitex_token')
    localStorage.removeItem('russitex_refresh')
    setToken(null)
    setUser(null)
  }, [])

  // Le pasa la sesión al cliente de Supabase del navegador para que él la
  // renueve solo antes de que venza (avisa con TOKEN_REFRESHED). Si el token
  // ya venció, lo cambia por uno nuevo con el refresh token.
  // Devuelve el token vigente, o null si la sesión ya no sirve.
  const activarRenovacion = useCallback(async (accessToken) => {
    const refresh = localStorage.getItem('russitex_refresh')
    if (!refresh) return accessToken && !tokenVencido(accessToken) ? accessToken : null
    const { data, error } = tokenVencido(accessToken)
      ? await supabase.auth.refreshSession({ refresh_token: refresh })
      : await supabase.auth.setSession({ access_token: accessToken, refresh_token: refresh })
    if (error || !data?.session) return null
    guardarSesion(data.session.access_token, data.session.refresh_token)
    return data.session.access_token
  }, [guardarSesion])

  // Al montar: si ya hay token guardado (login por email), recuperar el perfil.
  // También escuchamos a Supabase por si el usuario vuelve de un login social (Google/Facebook).
  useEffect(() => {
    let activo = true

    async function init() {
      const tokenGuardado = localStorage.getItem('russitex_token')
      if (tokenGuardado) {
        try {
          const vigente = await activarRenovacion(tokenGuardado)
          if (!vigente) throw new Error('Sesión vencida')
          const perfil = await cargarPerfil(vigente)
          if (activo) setUser(perfil)
        } catch {
          limpiarSesion()
        }
      }
      if (activo) setLoading(false)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Supabase renovó el token (cada ~hora): guardar el nuevo.
      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        guardarSesion(session.access_token, session.refresh_token)
        return
      }
      if (event === 'SIGNED_IN' && session?.access_token) {
        guardarSesion(session.access_token, session.refresh_token)
        try {
          const perfil = await cargarPerfil(session.access_token)
          if (activo) setUser(perfil)
        } catch {
          // el perfil se completará en el próximo request si falla acá
        }
      }
      if (event === 'SIGNED_OUT') {
        limpiarSesion()
      }
    })

    return () => {
      activo = false
      listener?.subscription?.unsubscribe()
    }
  }, [cargarPerfil, guardarSesion, limpiarSesion, activarRenovacion])

  const login = useCallback(async (email, contrasena) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, contrasena }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
    guardarSesion(data.token, data.refresh)
    setUser(data.usuario)
    // Que Supabase renueve este token antes de que venza (dura 1 hora).
    activarRenovacion(data.token).catch(() => {})
    return data.usuario
  }, [guardarSesion, activarRenovacion])

  const register = useCallback(async (nombre, email, contrasena) => {
    const res = await fetch(`${API_URL}/api/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, contrasena }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta')
    return data
  }, [])

  const loginConProveedor = useCallback(async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/login` },
    })
    if (error) throw error
  }, [])

  const forgotPassword = useCallback(async (email) => {
    const res = await fetch(`${API_URL}/api/auth/recuperar-contrasena`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al enviar el email')
    return data
  }, [])

  // Vuelve a leer el perfil (p. ej. después de cambiar el nombre en Mi cuenta).
  const refrescarPerfil = useCallback(async () => {
    if (!token) return
    try { setUser(await cargarPerfil(token)) } catch { /* se queda el anterior */ }
  }, [token, cargarPerfil])

  const logout = useCallback(async () => {
    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    await supabase.auth.signOut().catch(() => {})
    // Datos del checkout recordados en este navegador (computadores compartidos).
    try { localStorage.removeItem('russitex_datos_checkout') } catch { /* nada que borrar */ }
    limpiarSesion()
  }, [token, limpiarSesion])

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, loginConProveedor, forgotPassword, refrescarPerfil }}
    >
      {children}
    </AuthContext.Provider>
  )
}
