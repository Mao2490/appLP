import { useEffect, useState } from 'react'
import { supabase, Compra, Proveedor } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

const CATEGORIAS = ['Lubricantes', 'Limpieza', 'Repuestos', 'Herramientas', 'Otros']

export default function ComprasPage() {
  const { perfil } = useAuth()
  const [compras, setCompras] = useState<Compra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const esAdmin = perfil?.rol === 'admin' || perfil?.rol === 'dueno'

  const [form, setForm] = useState({
    producto: '', categoria: 'Lubricantes', cantidad: 1,
    unidad: '', valor_unitario: 0, proveedor_id: '',
    notas: '', fecha: new Date().toISOString().split('T')[0],
  })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const [{ data: comp }, { data: prov }] = await Promise.all([
      supabase.from('compras').select('*, proveedor:proveedores(nombre)').order('fecha', { ascending: false }),
      supabase.from('proveedores').select('id, nombre').order('nombre'),
    ])
    setCompras((comp as any) ?? [])
    setProveedores(prov ?? [])
    setCargando(false)
  }

  function set(campo: string, valor: any) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.producto.trim()) { toast.error('Ingresa el producto'); return }
    setGuardando(true)
    const { error } = await supabase.from('compras').insert({
      ...form,
      proveedor_id: form.proveedor_id || null,
    })
    if (error) { toast.error('Error al guardar'); setGuardando(false); return }
    toast.success('Compra registrada')
    setModal(false)
    setForm({ producto: '', categoria: 'Lubricantes', cantidad: 1, unidad: '', valor_unitario: 0, proveedor_id: '', notas: '', fecha: new Date().toISOString().split('T')[0] })
    cargar()
    setGuardando(false)
  }

  const totalMes = compras
    .filter(c => c.fecha?.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((a, c) => a + (c.valor_unitario * c.cantidad), 0)

  const totalGeneral = compras.reduce((a, c) => a + (c.valor_unitario * c.cantidad), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-700 text-brand-dark">Compras generales</h1>
        {esAdmin && (
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-brand-mid hover:bg-brand-dark text-white text-sm font-600 px-4 py-2 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Nueva compra
          </button>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Total este mes</p>
          <p className="text-xl font-700 text-brand-dark">${totalMes.toLocaleString('es-CO')}</p>
          <p className="text-xs text-gray-300">COP</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Total histórico</p>
          <p className="text-xl font-700 text-brand-dark">${totalGeneral.toLocaleString('es-CO')}</p>
          <p className="text-xs text-gray-300">COP</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-4 py-3 text-xs font-600 text-gray-400">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-600 text-gray-400">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-600 text-gray-400">Cant.</th>
                <th className="text-left px-4 py-3 text-xs font-600 text-gray-400">Valor unit.</th>
                <th className="text-left px-4 py-3 text-xs font-600 text-gray-400">Total</th>
                <th className="text-left px-4 py-3 text-xs font-600 text-gray-400">Proveedor</th>
                <th className="text-left px-4 py-3 text-xs font-600 text-gray-400">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cargando ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Cargando...</td></tr>
              ) : compras.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Sin compras registradas</td></tr>
              ) : (
                compras.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-500 text-brand-dark">{c.producto}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] bg-brand-pale text-brand-mid px-2 py-0.5 rounded-full font-500">{c.categoria}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.cantidad} {c.unidad}</td>
                    <td className="px-4 py-3 text-gray-500">${c.valor_unitario.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 font-600 text-brand-dark">${(c.valor_unitario * c.cantidad).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{(c.proveedor as any)?.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{c.fecha}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva compra */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-700 text-brand-dark">Nueva compra</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={guardar} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-600 text-gray-500 mb-1.5">Producto *</label>
                <input value={form.producto} onChange={e => set('producto', e.target.value)} required
                  placeholder="Ej: Aceite lubricante WD-40"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-600 text-gray-500 mb-1.5">Categoría</label>
                  <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid bg-white">
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-600 text-gray-500 mb-1.5">Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
                </div>
                <div>
                  <label className="block text-xs font-600 text-gray-500 mb-1.5">Cantidad</label>
                  <input type="number" min="1" value={form.cantidad} onChange={e => set('cantidad', +e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
                </div>
                <div>
                  <label className="block text-xs font-600 text-gray-500 mb-1.5">Unidad</label>
                  <input value={form.unidad} onChange={e => set('unidad', e.target.value)}
                    placeholder="litros, unidades..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-600 text-gray-500 mb-1.5">Valor unitario (COP)</label>
                <input type="number" min="0" value={form.valor_unitario} onChange={e => set('valor_unitario', +e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
                {form.cantidad > 0 && form.valor_unitario > 0 && (
                  <p className="text-xs text-brand-mid mt-1">Total: ${(form.cantidad * form.valor_unitario).toLocaleString('es-CO')}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-600 text-gray-500 mb-1.5">Proveedor</label>
                <select value={form.proveedor_id} onChange={e => set('proveedor_id', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid bg-white">
                  <option value="">Sin proveedor</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-600 text-gray-500 mb-1.5">Notas</label>
                <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
                  placeholder="Observaciones opcionales..."
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