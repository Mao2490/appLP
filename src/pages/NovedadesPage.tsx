import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Novedad } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

const ESTADOS = ['', 'Pendiente', 'En proceso', 'Resuelto']
const PRIORIDADES = ['', 'Normal', 'Urgente', 'Crítico']

const badgeEstado = (e: string) => {
  const m: Record<string, string> = { 'Pendiente': 'bg-amber-100 text-amber-800', 'En proceso': 'bg-blue-100 text-blue-800', 'Resuelto': 'bg-green-100 text-green-800' }
  return m[e] ?? 'bg-gray-100 text-gray-600'
}
const badgePrioridad = (p: string) => {
  const m: Record<string, string> = { 'Crítico': 'bg-red-100 text-red-700', 'Urgente': 'bg-orange-100 text-orange-700', 'Normal': 'bg-gray-100 text-gray-600' }
  return m[p] ?? 'bg-gray-100 text-gray-600'
}

export default function NovedadesPage() {
  const { perfil, esTecnicoTemporal } = useAuth()
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const puedeEditar = !!perfil || esTecnicoTemporal

  useEffect(() => { cargar() }, [filtroEstado, filtroPrioridad])

  async function cargar() {
    setCargando(true)
    let q = supabase
      .from('maintenance_logs')
      .select('*, maquina:machines(name), responsable:profiles(full_name)')
      .order('created_at', { ascending: false })
    // 'status_after' y 'priority' son los nombres reales en tu tabla
    if (filtroEstado) q = q.eq('status_after', filtroEstado)
    if (filtroPrioridad) q = q.eq('priority', filtroPrioridad)
    const { data } = await q
    setNovedades((data as any) ?? [])
    setCargando(false)
  }
  

  async function cambiarEstado(id: string, estadoActual: string) {
    const ciclo = ['Pendiente', 'En proceso', 'Resuelto']
    const siguiente = ciclo[(ciclo.indexOf(estadoActual) + 1) % ciclo.length]
    const { error } = await supabase.from('maintenance_logs').update({ status_after: siguiente,}).eq('id', id)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success(`Estado → ${siguiente}`)
    cargar()
  }

  const filtradas = novedades.filter(n => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      (n.maquina as any)?.name?.toLowerCase().includes(q) ||
      n.descripcion.toLowerCase().includes(q) ||
      (n.responsable as any)?.full_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-700 text-brand-dark">Novedades</h1>
        {puedeEditar && (
          <Link
            to="/novedades/nueva"
            className="flex items-center gap-2 bg-brand-mid hover:bg-brand-dark text-white text-sm font-600 px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Nueva
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar máquina, descripción..."
          className="flex-1 min-w-48 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"
        />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid bg-white">
          {ESTADOS.map(e => <option key={e} value={e}>{e || 'Todos los estados'}</option>)}
        </select>
        <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid bg-white">
          {PRIORIDADES.map(p => <option key={p} value={p}>{p || 'Todas las prioridades'}</option>)}
        </select>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">No hay novedades registradas</p>
          {puedeEditar && (
            <Link to="/novedades/nueva" className="mt-3 inline-block text-brand-mid text-sm hover:underline">
              Registrar primera novedad →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(nov => (
            <div key={nov.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link to={`/maquinas/${nov.machine_id}`} className="text-sm font-700 text-brand-dark hover:text-brand-mid transition-colors">
                      {(nov.maquina as any)?.name ?? '—'}
                    </Link>
                    <span className={`... ${badgePrioridad(nov.priority)}`}>{nov.priority}</span>
                    <span className={`... ${badgeEstado(nov.status_after)}`}>{nov.status_after}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{nov.descripcion}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <span>📅 {new Date(nov.created_at).toLocaleDateString('es-CO')}</span>
                    <span>👤 {(nov.responsable as any)?.full_name ?? 'Sin asignar'}</span>
                    {nov.tipo_falla && <span>🔧 {nov.tipo_falla}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(nov as any).photo_url && (
                    <a href={(nov as any).photo_url} target="_blank" rel="noreferrer">
                      <img src={(nov as any).photo_url} alt="foto" className="w-12 h-12 object-cover rounded-lg border border-gray-100"/>
                    </a>
                  )}
                  {puedeEditar && (
                    <button
                      onClick={() => cambiarEstado(nov.id, nov.status_after)} // Antes decía nov.estado
                      className="text-xs border border-gray-200 hover:border-brand-mid text-gray-500 hover:text-brand-mid px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Cambiar estado
                    </button>
                  )}
                  {puedeEditar && (
                    <Link
                      to={`/novedades/${nov.id}/editar`}
                      className="text-xs bg-brand-pale text-brand-mid px-3 py-1.5 rounded-lg hover:bg-brand-mid hover:text-white transition-colors"
                    >
                      Editar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
    </div>
  )
}