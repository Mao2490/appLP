import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const ROLES = ['admin', 'tecnico', 'dueno']

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [creando, setCreando] = useState(false)
  const [nuevoUsuario, setNuevoUsuario] = useState({
    email: '', password: '', nombre: '', rol: 'tecnico'
  })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsuarios(data ?? [])
    setCargando(false)
  }

  async function cambiarRol(userId: string, nuevoRol: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: nuevoRol })
      .eq('id', userId)
    if (error) { toast.error('Error al cambiar rol'); return }
    toast.success('Rol actualizado')
    setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, role: nuevoRol } : u))
  }

  async function crearUsuario() {
    if (!nuevoUsuario.email || !nuevoUsuario.password || !nuevoUsuario.nombre) {
    toast.error('Completa todos los campos')
    return
  }
  setCreando(true)
  const { data, error } = await supabase.functions.invoke('crear-usuario', {
  body: nuevoUsuario,
  headers: {
    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
  }
  })
  if (error || data?.error) {
    toast.error('Error al crear usuario')
    setCreando(false)
    return
  }
  toast.success('Usuario creado')
  setMostrarForm(false)
  setNuevoUsuario({ email: '', password: '', nombre: '', rol: 'tecnico' })
  cargar()
  setCreando(false)
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
  <h1 className="text-xl font-700 text-brand-dark">Gestión de usuarios</h1>
  <button
    onClick={() => setMostrarForm(!mostrarForm)}
    className="flex items-center gap-2 bg-brand-mid hover:bg-brand-dark text-white text-sm font-600 px-4 py-2 rounded-lg transition-colors"
  >
    + Agregar usuario
  </button>
</div>

{mostrarForm && (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
    <h2 className="text-sm font-700 text-brand-dark">Nuevo usuario</h2>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-600 text-gray-500 mb-1.5">Nombre</label>
        <input value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario(f => ({ ...f, nombre: e.target.value }))}
          placeholder="Nombre completo"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
      </div>
      <div>
        <label className="block text-xs font-600 text-gray-500 mb-1.5">Rol</label>
        <select value={nuevoUsuario.rol} onChange={e => setNuevoUsuario(f => ({ ...f, rol: e.target.value }))}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid bg-white">
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-600 text-gray-500 mb-1.5">Email</label>
        <input value={nuevoUsuario.email} onChange={e => setNuevoUsuario(f => ({ ...f, email: e.target.value }))}
          placeholder="correo@ejemplo.com" type="email"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
      </div>
      <div>
        <label className="block text-xs font-600 text-gray-500 mb-1.5">Contraseña</label>
        <input value={nuevoUsuario.password} onChange={e => setNuevoUsuario(f => ({ ...f, password: e.target.value }))}
          placeholder="Mínimo 6 caracteres" type="password"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
      </div>
    </div>
    <div className="flex gap-3 pt-2">
      <button onClick={() => setMostrarForm(false)}
        className="flex-1 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
        Cancelar
      </button>
      <button onClick={crearUsuario} disabled={creando}
        className="flex-1 py-2.5 text-sm bg-brand-mid text-white font-600 rounded-lg hover:bg-brand-dark disabled:opacity-60">
        {creando ? 'Creando...' : 'Crear usuario'}
      </button>
    </div>
  </div>
)}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-700 text-brand-dark">Usuarios registrados</h2>
        </div>
        {cargando ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-brand-pale flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-700 text-brand-mid">
                    {u.full_name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-brand-dark">{u.full_name ?? 'Sin nombre'}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <select
                  value={u.role ?? 'tecnico'}
                  onChange={e => cambiarRol(u.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white cursor-pointer focus:outline-none focus:border-brand-mid"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}