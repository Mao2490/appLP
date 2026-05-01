import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function NuevaMaquinaPage() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)

  const [form, setForm] = useState({
    name: '', marca: '', modelo: '', serial: '',
    ubicacion: '', fecha_adquisicion: '', notas: '', foto_url: ''
  })

  useEffect(() => { if (esEdicion) cargar() }, [id])

  async function cargar() {
  const { data } = await supabase.from('machines').select('*').eq('id', id).single()
  if (data) {
    setForm({
      name: data.name ?? '',
      marca: data.marca ?? '',
      modelo: data.modelo ?? '',
      serial: data.serial ?? '',
      ubicacion: data.ubicacion ?? '',
      fecha_adquisicion: data.fecha_adquisicion ?? '',
      notas: data.notas ?? '',
      foto_url: data.foto_url ?? ''
    })
  }
}

  function set(campo: string, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(true)
    const ext = file.name.split('.').pop()
    const nombre = `maquinas/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('fotos').upload(nombre, file)
    if (error) { toast.error('Error subiendo foto'); setSubiendo(false); return }
    const { data } = supabase.storage.from('fotos').getPublicUrl(nombre)
    set('foto_url', data.publicUrl)
    setSubiendo(false)
    toast.success('Foto cargada')
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Ingresa el nombre'); return }
    setGuardando(true)

    const { id: _id, created_at, ...datos } = form as any

    let error
    if (esEdicion) {
      ({ error } = await supabase.from('machines').update(datos).eq('id', id))
    } else {
      ({ error } = await supabase.from('machines').insert(datos))
    }
    if (error) { toast.error('Error al guardar'); setGuardando(false); return }
    toast.success(esEdicion ? 'Máquina actualizada' : 'Máquina registrada')
    navigate('/maquinas')
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
          {esEdicion ? 'Editar máquina' : 'Agregar máquina'}
        </h1>
      </div>

      <form onSubmit={guardar} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Nombre *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} required
            placeholder="Ej: Cinta caminadora #1"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Marca</label>
            <input value={form.marca} onChange={e => set('marca', e.target.value)}
              placeholder="Ej: Life Fitness"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
          </div>
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Modelo</label>
            <input value={form.modelo} onChange={e => set('modelo', e.target.value)}
              placeholder="Ej: F3"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
          </div>
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Serial / Código</label>
            <input value={form.serial} onChange={e => set('serial', e.target.value)}
              placeholder="SN-001"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
          </div>
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Ubicación en el gym</label>
            <input value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)}
              placeholder="Ej: Zona cardio"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
          </div>
        </div>

        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Fecha de adquisición</label>
          <input type="date" value={form.fecha_adquisicion} onChange={e => set('fecha_adquisicion', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
        </div>

        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Notas</label>
          <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
            placeholder="Observaciones generales de la máquina..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid resize-none"/>
        </div>

        {/* Foto */}
        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Foto de la máquina</label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-brand-mid transition-colors">
            <input type="file" accept="image/*" onChange={subirFoto} className="hidden" id="foto-maq"/>
            <label htmlFor="foto-maq" className="cursor-pointer">
              {subiendo ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
                  Subiendo...
                </div>
              ) : form.foto_url ? (
                <div>
                  <img src={form.foto_url} alt="preview" className="w-32 h-24 object-cover rounded-lg mx-auto mb-2"/>
                  <span className="text-xs text-brand-mid">Cambiar foto</span>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span className="text-xs text-gray-400">Subir foto de la máquina</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="flex-1 px-4 py-2.5 text-sm bg-brand-mid hover:bg-brand-dark text-white font-600 rounded-lg transition-colors disabled:opacity-60">
            {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Registrar máquina'}
          </button>
        </div>
      </form>
    </div>
  )
}