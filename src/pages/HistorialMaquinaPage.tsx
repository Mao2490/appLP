import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, Maquina, Novedad } from '@/lib/supabase'

const badgeEstado = (e: string) => {
  const m: Record<string, string> = {
    'Pendiente': 'bg-amber-100 text-amber-800',
    'En proceso': 'bg-blue-100 text-blue-800',
    'Resuelto': 'bg-green-100 text-green-800'
  }
  return m[e] ?? 'bg-gray-100 text-gray-600'
}

export default function HistorialMaquinaPage() {
  const { id } = useParams()
  const [maquina, setMaquina] = useState<Maquina | null>(null)
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [cargando, setCargando] = useState(true)
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)
  const [editando, setEditando] = useState<Novedad | null>(null)
  const [editDesc, setEditDesc] = useState('')
  useEffect(() => {
    if (id) cargar(id)
  }, [id])

  async function cambiarEstado(novId: string, nuevoEstado: string) {
    const result = await supabase
      .from('maintenance_logs')
      .update({ status_after: nuevoEstado as Novedad['status_after']})
      .eq('id', novId)

    console.log('error:', result.error)

  setNovedades(prev =>
    prev.map(n => n.id === novId ? { ...n, status_after: nuevoEstado as Novedad['status_after'] } : n)
  )
}

async function eliminarNovedad() {
  if (!confirmarEliminar) return

  await supabase
    .from('maintenance_logs')
    .delete()
    .eq('id', confirmarEliminar)

  setNovedades(prev => prev.filter(n => n.id !== confirmarEliminar))
  setConfirmarEliminar(null)
}

async function guardarEdicion() {
  if (!editando) return

  const result = await supabase
    .from('maintenance_logs')
    .update({ description: editDesc })
    .eq('id', editando.id)

  console.log('edicion result:', result.error)

  setNovedades(prev =>
    prev.map(n => n.id === editando.id ? { ...n, description: editDesc } : n)
  )
  setEditando(null)
}

  async function cargar(maqId: string) {
    setCargando(true)
    const [{ data: maq }, { data: novs }] = await Promise.all([
      supabase.from('machines').select('*').eq('id', maqId).single(),
      supabase.from('maintenance_logs')
        .select('*, responsable:profiles(full_name)')
        .eq('machine_id', maqId)
        .order('created_at', { ascending: false })
    ])
    setMaquina(maq)
    setNovedades((novs as any) ?? [])
    setCargando(false)
  }

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
    </div>
  )

  if (!maquina) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gray-400 mb-4">Máquina no encontrada</p>
        <Link to="/login" className="text-brand-mid text-sm hover:underline">Ir al inicio</Link>
      </div>
    </div>
  )

  const resueltas = novedades.filter(n => n.status_after === 'Resuelto').length
  const pendientes = novedades.filter(n => n.status_after === 'Pendiente').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-dark text-white px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white rounded-lg px-2 py-1 flex items-center gap-1">
              <span className="text-xs font-black text-brand-dark">LP</span>
              <span className="text-xs font-black text-brand-dark">FITNESS</span>
            </div>
            <span className="text-white/40 text-xs">Historial de mantenimiento</span>
          </div>
          <h1 className="text-xl font-700 mb-1">{maquina.name}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-white/60">
            {maquina.marca && <span>{maquina.marca} {maquina.modelo}</span>}
            {maquina.serial && <span>· Serial: {maquina.serial}</span>}
            {maquina.ubicacion && <span>· 📍 {maquina.ubicacion}</span>}
          </div>
        </div>
      </div>

      {/* Stats mini */}
      <div className="bg-brand-mid px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-6 text-white text-sm">
          <span><strong>{novedades.length}</strong> intervenciones totales</span>
          <span><strong className="text-green-300">{resueltas}</strong> resueltas</span>
          {pendientes > 0 && <span><strong className="text-amber-300">{pendientes}</strong> pendientes</span>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {maquina.notas && (
          <div className="bg-brand-pale border border-brand-light/30 rounded-xl p-4">
            <p className="text-xs font-600 text-brand-mid mb-1">Notas de la máquina</p>
            <p className="text-sm text-brand-dark">{maquina.notas}</p>
          </div>
        )}

        {novedades.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-12 text-center">
            <p className="text-gray-400 text-sm">Sin intervenciones registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {novedades.map(nov => (
              <div key={nov.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-600 px-2 py-0.5 rounded-full ${badgeEstado(nov.status_after)}`}>
                      {nov.status_after}
                    </span>
                    <select
                      value={nov.status_after}
                      onChange={(e) => cambiarEstado(nov.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-full px-2 py-0.5 text-gray-600 bg-white cursor-pointer"
                    >
                      <option>Pendiente</option>
                      <option>En proceso</option>
                      <option>Resuelto</option>
                      </select>
                    {nov.tipo_falla && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {nov.tipo_falla}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{new Date(nov.created_at).toLocaleDateString()} · {new Date(nov.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <button
                      onClick={() => { setEditando(nov); setEditDesc((nov as any).description ?? nov.descripcion ?? '') }}
                      className="text-xs text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => setConfirmarEliminar(nov.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{(nov as any).description ?? nov.descripcion}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    👤 {(nov.responsable as any)?.full_name ?? 'Sin asignar'}
                  </p>
                  {(nov as any).photo_url && (
                    <a href={(nov as any).photo_url} target="_blank" rel="noreferrer">
                      <img src={(nov as any).photo_url} alt="foto" className="w-full h-48 mt-2 object-cover rounded-lg border border-gray-100"/>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pt-4">
          LP Fitness · Sistema de mantenimiento
        </p>
      </div>
      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-gray-800 mb-2">¿Eliminar reporte?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarEliminar(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarNovedad}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-600 hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal editar reporte */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-gray-800 mb-4">Editar reporte</h3>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={4}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-mid resize-none"
              placeholder="Descripción del problema..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditando(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                className="flex-1 py-2 rounded-xl bg-brand-mid text-white text-sm font-600 hover:bg-brand-dark"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}