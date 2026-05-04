import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

const TIPOS = ['cumple gym','cumple empleados', 'Clase', 'maraton', 'Mantenimiento general', 'Promoción', 'Otro']

export default function NuevoEventoPage() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { perfil } = useAuth()

  const [guardando, setGuardando] = useState(false)

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'Clase',
    fecha: searchParams.get('fecha') ?? new Date().toISOString().split('T')[0],
    hora: '',
    responsable_nombre: '',
  })

  useEffect(() => {
    if (esEdicion) cargarEvento()
  }, [id])


  async function cargarEvento() {
    const { data } = await supabase.from('eventos').select('*').eq('id', id).single()
    if (data) setForm(data as any)
  }

  function set(campo: string, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) { toast.error('Ingresa un título'); return }
    if (!form.fecha) { toast.error('Selecciona una fecha'); return }

    setGuardando(true)
    try {
      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        tipo: form.tipo,
        fecha: form.fecha,
        hora: form.hora || null,
        responsable_nombre: form.responsable_nombre || null,
        created_by: perfil?.id ?? null,
      }

      let result
      if (esEdicion) {
        result = await supabase.from('eventos').update(payload).eq('id', id)
      } else {
        result = await supabase.from('eventos').insert(payload)
      }

      if (result.error) throw result.error
      toast.success(esEdicion ? 'Evento actualizado' : 'Evento creado')
      if (!esEdicion) {
        await supabase.from('notificaciones').insert({
           titulo: '📅 Nuevo evento',
           mensaje: `Se agregó: ${form.titulo}`,
           leida: false
        })
      }
      navigate('/eventos')
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este evento?')) return
    await supabase.from('eventos').delete().eq('id', id)
    toast.success('Evento eliminado')
    navigate('/eventos')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-brand-dark transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-xl font-700 text-brand-dark">
          {esEdicion ? 'Editar evento' : 'Nuevo evento'}
        </h1>
      </div>

      <form onSubmit={guardar} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        {/* Título */}
        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Título *</label>
          <input value={form.titulo} onChange={e => set('titulo', e.target.value)} required
            placeholder="Ej: Clase de spinning, Torneo de natación..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Tipo</label>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid bg-white">
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Fecha *</label>
            <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
          </div>
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Hora</label>
            <input type="time" value={form.hora} onChange={e => set('hora', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Descripción</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3}
            placeholder="Detalles del evento..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid resize-none"/>
        </div>

        {/* Responsable */}
        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Responsable</label>
          <input value={form.responsable_nombre} onChange={e => set('responsable_nombre', e.target.value)}
            placeholder="Nombre del responsable..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
        </div>

        <div className="flex gap-3 pt-2">
          {esEdicion && (
            <button type="button" onClick={eliminar}
              className="px-4 py-2.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
              Eliminar
            </button>
          )}
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="flex-1 px-4 py-2.5 text-sm bg-brand-mid hover:bg-brand-dark text-white font-600 rounded-lg transition-colors disabled:opacity-60">
            {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear evento'}
          </button>
        </div>
      </form>
    </div>
  )
}