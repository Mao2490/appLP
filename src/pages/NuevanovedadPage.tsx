import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase} from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function NuevaNovedadPage() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()
  const { esTecnicoTemporal, nombreTecnicoTemporal } = useAuth()

  const [maquinas, setMaquinas] = useState<any[]>([])
  const [tecnicos, setTecnicos] = useState<any[]>([])
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)

  const [form, setForm] = useState({
    maquina_id: '',
    descripcion: '',
    tipo_falla: '',
    estado: 'Pendiente',
    prioridad: 'Normal',
    responsable_id: '',
    foto_url: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
  })

  useEffect(() => {
    cargarOpciones()
    if (esEdicion) cargarNovedad()
  }, [id])

  async function cargarOpciones() {
    const [{ data: maq }, { data: tec }] = await Promise.all([
      supabase.from('machines').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name, role'),
    ])
    setMaquinas(maq as any ?? [])
    setTecnicos(tec ?? [])
    // Si es técnico temporal, auto-asignar nombre
    if (esTecnicoTemporal) {
      setForm(f => ({ ...f, responsable_id: '' }))
    }
  }

  async function cargarNovedad() {
    const { data } = await supabase.from('maintenance_logs').select('*').eq('id', id).single()
    if (data) setForm(data as any)
  }

  function set(campo: string, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(true)
    const ext = file.name.split('.').pop()
    const nombre = `novedades/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('novedades').upload(nombre, file)
    if (error) { toast.error('Error subiendo foto'); setSubiendo(false); return }
    const { data } = supabase.storage.from('novedades').getPublicUrl(nombre)
    set('foto_url', data.publicUrl)
    setSubiendo(false)
    toast.success('Foto cargada')
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    
    // Validaciones básicas para evitar envíos vacíos
    if (!form.maquina_id) { toast.error('Selecciona una máquina'); return; }
    if (!form.descripcion.trim()) { toast.error('Ingresa una descripción'); return; }
    
    setGuardando(true);

    try {
      // Definimos el payload con los nombres EXACTOS de tu base de datos
      const payload: any = {
        machine_id: form.maquina_id,
        description: esTecnicoTemporal 
          ? `[Técnico: ${nombreTecnicoTemporal}] ${form.descripcion}` 
          : form.descripcion,
        status_after: form.estado,
        technician_id: esTecnicoTemporal ? null : (form.responsable_id || null),
        photo_url: form.foto_url,
        priority: form.prioridad,
        // Eliminamos campos que no existan en la tabla para evitar errores 404
      };

      let result;
      if (esEdicion) {
        result = await supabase.from('maintenance_logs').update(payload).eq('id', id);
      } else {
        result = await supabase.from('maintenance_logs').insert(payload);
      }

      if (result.error) throw result.error;

      toast.success(esEdicion ? 'Novedad actualizada' : 'Novedad registrada');
      navigate('/novedades');

    } catch (error: any) {
      console.error("DETALLE DEL ERROR:", error);
      toast.error(`Error: ${error.message || 'No se pudo guardar'}`);
    } finally {
      setGuardando(false);
    }
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
          {esEdicion ? 'Editar novedad' : 'Nueva novedad'}
        </h1>
      </div>

      <form onSubmit={guardar} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        {/* Máquina */}
        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Máquina *</label>
          <select value={form.maquina_id} onChange={e => set('maquina_id', e.target.value)} required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid bg-white">
            <option value="">Seleccionar máquina...</option>
            {maquinas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Descripción del problema *</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} required rows={3}
            placeholder="Describe detalladamente la falla o novedad..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid resize-none"/>
        </div>

        {/* Tipo de falla */}
        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Tipo de falla</label>
          <input value={form.tipo_falla} onChange={e => set('tipo_falla', e.target.value)}
            placeholder="Ej: Eléctrica, mecánica, desgaste..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
        </div>

        {/* Fecha / Hora / Prioridad / Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Fecha</label>
            <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
          </div>
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Hora</label>
            <input type="time" value={form.hora} onChange={e => set('hora', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
          </div>
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Prioridad</label>
            <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid bg-white">
              <option>Normal</option>
              <option>Urgente</option>
              <option>Crítico</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Estado</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid bg-white">
              <option>Pendiente</option>
              <option>En proceso</option>
              <option>Resuelto</option>
            </select>
          </div>
        </div>

        {/* Responsable - solo si no es técnico temporal */}
        {!esTecnicoTemporal && (
          <div>
            <label className="block text-xs font-600 text-gray-500 mb-1.5">Técnico responsable</label>
            <select value={form.responsable_id} onChange={e => set('responsable_id', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid bg-white">
              <option value="">Sin asignar</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>)}
            </select>
          </div>
        )}

        {/* Foto */}
        <div>
          <label className="block text-xs font-600 text-gray-500 mb-1.5">Foto de la falla</label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-brand-mid transition-colors">
            <input type="file" accept="image/*" capture="environment" onChange={subirFoto}
              className="hidden" id="foto-input"/>
            <label htmlFor="foto-input" className="cursor-pointer">
              {subiendo ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
                  Subiendo...
                </div>
              ) : form.foto_url ? (
                <div>
                  <img src={form.foto_url} alt="preview" className="w-24 h-24 object-cover rounded-lg mx-auto mb-2"/>
                  <span className="text-xs text-brand-mid">Cambiar foto</span>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span className="text-xs text-gray-400">Tomar foto o subir imagen</span>
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
            {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Guardar novedad'}
          </button>
        </div>
      </form>
    </div>
  )
}