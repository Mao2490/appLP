import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Novedad, Maquina } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Stats {
  totalMaquinas: number
  pendientes: number
  enProceso: number
  totalComprasMes: number
}

const badgeEstado = (estado: string) => {
  const map: Record<string, string> = {
    'Pendiente': 'bg-amber-100 text-amber-800',
    'En proceso': 'bg-blue-100 text-blue-800',
    'Resuelto': 'bg-green-100 text-green-800',
  }
  return map[estado] ?? 'bg-gray-100 text-gray-600'
}

const badgePrioridad = (p: string) => {
  const map: Record<string, string> = {
    'Crítico': 'bg-red-100 text-red-700',
    'Urgente': 'bg-orange-100 text-orange-700',
    'Normal': 'bg-gray-100 text-gray-600',
  }
  return map[p] ?? 'bg-gray-100 text-gray-600'
}

const dotColor = (estado: string) => {
  const map: Record<string, string> = {
    'Pendiente': 'bg-amber-400',
    'En proceso': 'bg-brand-mid',
    'Resuelto': 'bg-green-500',
  }
  return map[estado] ?? 'bg-gray-400'
}

export default function DashboardPage() {
  const { perfil, esTecnicoTemporal, nombreTecnicoTemporal } = useAuth()
  const [stats, setStats] = useState<Stats>({ totalMaquinas: 0, pendientes: 0, enProceso: 0, totalComprasMes: 0 })
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [maquinasAlerta, setMaquinasAlerta] = useState<Maquina[]>([])
  const [cargando, setCargando] = useState(true)

  const nombre = esTecnicoTemporal ? nombreTecnicoTemporal : perfil?.nombre?.split(' ')[0]
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  useEffect(() => {
    cargarDatos()
  }, [])

  // Línea 55.
  async function cargarDatos() {
  setCargando(true)
  const mesInicio = new Date(); mesInicio.setDate(1); mesInicio.setHours(0,0,0,0)

  const [{ count: totalMaq }, { count: pend }, { count: proc }, { data: novsData }, { data: comprasData }, { data: maqData }] = await Promise.all([
    supabase.from('machines').select('*', { count: 'exact', head: true }), // Cambiado: 'machines'
    supabase.from('maintenance_logs').select('*', { count: 'exact', head: true }).eq('status_after', 'Pendiente'), // Cambiado: 'maintenance_logs'
    supabase.from('maintenance_logs').select('*', { count: 'exact', head: true }).eq('status_after', 'En proceso'),
    supabase.from('maintenance_logs').select('*, maquina:machines(name), responsable:profiles(full_name)').order('created_at', { ascending: false }).limit(6),
    supabase.from('compras').select('valor_unitario, cantidad').gte('fecha', mesInicio.toISOString().split('T')[0]),
    supabase.from('machines').select('*').limit(5), // Cambiado: 'machines'
  ])

  const totalCompras = (comprasData ?? []).reduce((a: number, c: any) => a + (c.valor_unitario * c.cantidad), 0)

  setStats({ totalMaquinas: totalMaq ?? 0, pendientes: pend ?? 0, enProceso: proc ?? 0, totalComprasMes: totalCompras })
  setNovedades((novsData as any) ?? [])
  setMaquinasAlerta((maqData as any) ?? [])
  setCargando(false)
}

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-700 text-brand-dark">{saludo}, {nombre} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/novedades/nueva"
          className="hidden sm:flex items-center gap-2 bg-brand-mid hover:bg-brand-dark text-white text-sm font-600 px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Nueva novedad
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="w-9 h-9 bg-brand-pale rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-brand-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
          </div>
          <p className="text-xs text-gray-400 mb-1">Total máquinas</p>
          <p className="text-2xl font-700 text-brand-dark">{stats.totalMaquinas}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <p className="text-xs text-gray-400 mb-1">Pendientes</p>
          <p className="text-2xl font-700 text-red-600">{stats.pendientes}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-xs text-gray-400 mb-1">En proceso</p>
          <p className="text-2xl font-700 text-amber-600">{stats.enProceso}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-xs text-gray-400 mb-1">Compras del mes</p>
          <p className="text-lg font-700 text-green-700">${stats.totalComprasMes.toLocaleString('es-CO')}</p>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Novedades recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-700 text-brand-dark">Novedades recientes</h2>
            <Link to="/novedades" className="text-xs text-brand-mid hover:underline">Ver todas →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {novedades.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-10">Sin novedades registradas</p>
            )}
            {novedades.map(nov => (
              <div key={nov.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor(nov.status_after)}`}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-600 text-brand-dark truncate">
                      {(nov.maquina as any)?.name ?? '—'}
                    </span>
                    <span className={`text-[10px] font-500 px-2 py-0.5 rounded-full ${badgePrioridad(nov.priority)}`}>
                      {nov.priority}
                    </span>
                    <span className={`text-[10px] font-500 px-2 py-0.5 rounded-full ${badgeEstado(nov.status_after)}`}>
                      {nov.status_after}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{nov.descripcion}</p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    {new Date(nov.created_at).toLocaleDateString('es-CO')} · {(nov.responsable as any)?.full_name ?? 'Sin asignar'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Máquinas */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-700 text-brand-dark">Máquinas</h2>
            <Link to="/maquinas" className="text-xs text-brand-mid hover:underline">Ver todas →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {maquinasAlerta.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-10">Sin máquinas registradas</p>
            )}
            {maquinasAlerta.map(maq => (
              <Link key={maq.id} to={`/maquinas/${maq.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-brand-pale rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-brand-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-600 text-brand-dark truncate">{maq.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{maq.ubicacion}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}