import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Perfil } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  perfil: Perfil | null
  loading: boolean
  esTecnicoTemporal: boolean
  nombreTecnicoTemporal: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loginConToken: (token: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [esTecnicoTemporal, setEsTecnicoTemporal] = useState(false)
  const [nombreTecnicoTemporal, setNombreTecnicoTemporal] = useState<string | null>(null)

  useEffect(() => {
    // Verificar sesión técnico temporal en sessionStorage
    const tecnicoSesion = sessionStorage.getItem('tecnico_temporal')
    if (tecnicoSesion) {
      const datos = JSON.parse(tecnicoSesion)
      if (new Date(datos.expira_at) > new Date()) {
        setEsTecnicoTemporal(true)
        setNombreTecnicoTemporal(datos.nombre)
        setLoading(false)
        return
      } else {
        sessionStorage.removeItem('tecnico_temporal')
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) cargarPerfil(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) cargarPerfil(session.user.id)
      else { setPerfil(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(userId: string) {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()
    setPerfil(data)
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function signOut() {
    if (esTecnicoTemporal) {
      sessionStorage.removeItem('tecnico_temporal')
      setEsTecnicoTemporal(false)
      setNombreTecnicoTemporal(null)
    } else {
      await supabase.auth.signOut()
    }
  }

  async function loginConToken(token: string) {
    // Verificar token en base de datos
    const { data, error } = await supabase
      .from('tokens_tecnicos')
      .select('*')
      .eq('token', token)
      .eq('usado', false)
      .gt('expira_at', new Date().toISOString())
      .single()

    if (error || !data) throw new Error('QR inválido o expirado')

    // Marcar como usado
    await supabase
      .from('tokens_tecnicos')
      .update({ usado: true })
      .eq('id', data.id)

    // Guardar sesión temporal
    sessionStorage.setItem('tecnico_temporal', JSON.stringify({
      nombre: data.nombre_tecnico,
      expira_at: data.expira_at,
      token_id: data.id
    }))

    setEsTecnicoTemporal(true)
    setNombreTecnicoTemporal(data.nombre_tecnico)
  }

  return (
    <AuthContext.Provider value={{
      user, perfil, loading,
      esTecnicoTemporal, nombreTecnicoTemporal,
      signIn, signOut, loginConToken
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}