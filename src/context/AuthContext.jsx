import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './useAuth'

const API_URL = import.meta.env.VITE_API_URL

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

  // Al montar: si ya hay token guardado (login por email), recuperar el perfil.
  // También escuchamos a Supabase por si el usuario vuelve de un login social (Google/Facebook).
  useEffect(() => {
    let activo = true

    async function init() {
      const tokenGuardado = localStorage.getItem('russitex_token')
      if (tokenGuardado) {
        try {
          const perfil = await cargarPerfil(tokenGuardado)
          if (activo) setUser(perfil)
        } catch {
          limpiarSesion()
        }
      }
      if (activo) setLoading(false)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
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
  }, [cargarPerfil, guardarSesion, limpiarSesion])

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
    return data.usuario
  }, [guardarSesion])

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

  const logout = useCallback(async () => {
    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    await supabase.auth.signOut().catch(() => {})
    limpiarSesion()
  }, [token, limpiarSesion])

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, loginConProveedor, forgotPassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}
