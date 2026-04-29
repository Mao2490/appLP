import { useEffect, useState } from 'react'
import { supabase, Proveedor } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function ProveedoresPage() {
  const { perfil } = useAuth()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', servicios: '' })

  const esAdmin = perfil?.rol === 'admin' || perfil?.rol === 'dueno'

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const { data } = await supabase.from('proveedores').select('*').order('nombre')
    setProveedores(data ?? [])
    setCargando(false)
  }

  function set(campo: string, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('Ingresa el nombre'); return }
    setGuardando(true)
    const { error } = await supabase.from('proveedores').insert(form)
    if (error) { toast.error('Error al guardar'); setGuardando(false); return }
    toast.success('Proveedor agregado')
    setModal(false)
    setForm({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', servicios: '' })
    cargar()
    setGuardando(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este proveedor?')) return
    await supabase.from('proveedores').delete().eq('id', id)
    toast.success('Proveedor eliminado')
    cargar()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-700 text-brand-dark">Proveedores</h1>
        {esAdmin && (
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-brand-mid hover:bg-brand-dark text-white text-sm font-600 px-4 py-2 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Agregar
          </button>
        )}
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
        </div>
      ) : proveedores.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">Sin proveedores registrados</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {proveedores.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 bg-brand-pale rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-mid font-700 text-sm">{p.nombre[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-700 text-brand-dark leading-tight">{p.nombre}</h3>
                  {p.contacto && <p className="text-xs text-gray-400 mt-0.5">{p.contacto}</p>}
                </div>
                {esAdmin && (
                  <button onClick={() => eliminar(p.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {p.telefono && (
                  <a href={`tel:${p.telefono}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-brand-mid">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    {p.telefono}
                  </a>
                )}
                {p.email && (
                  <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-brand-mid">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    {p.email}
                  </a>
                )}
                {p.servicios && (
                  <p className="text-xs text-gray-400 pt-1 border-t border-gray-50 mt-1">{p.servicios}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-700 text-brand-dark">Nuevo proveedor</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={guardar} className="p-5 space-y-4">
              {[
                { campo: 'nombre', label: 'Nombre empresa *', placeholder: 'Ej: Ferretería Industrial XYZ', required: true },
                { campo: 'contacto', label: 'Persona de contacto', placeholder: 'Nombre del representante' },
                { campo: 'telefono', label: 'Teléfono', placeholder: '+57 300 000 0000' },
                { campo: 'email', label: 'Email', placeholder: 'contacto@empresa.com' },
                { campo: 'direccion', label: 'Dirección', placeholder: 'Dirección física...' },
              ].map(f => (
                <div key={f.campo}>
                  <label className="block text-xs font-600 text-gray-500 mb-1.5">{f.label}</label>
                  <input
                    value={(form as any)[f.campo]}
                    onChange={e => set(f.campo, e.target.value)}
                    placeholder={f.placeholder}
                    required={f.required}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-600 text-gray-500 mb-1.5">Productos / servicios</label>
                <textarea value={form.servicios} onChange={e => set('servicios', e.target.value)} rows={2}
                  placeholder="Ej: Lubricantes, repuestos para máquinas cardio..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid resize-none"/>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className="flex-1 py-2.5 text-sm bg-brand-mid hover:bg-brand-dark text-white font-600 rounded-lg transition-colors disabled:opacity-60">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}