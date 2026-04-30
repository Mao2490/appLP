import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Maquina } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import QRCode from 'qrcode'

export default function MaquinasPage() {
  const { perfil } = useAuth()
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [qrModal, setQrModal] = useState<{ nombre: string; url: string } | null>(null)

  const esAdmin = perfil?.rol === 'admin' || perfil?.rol === 'dueno'

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const { data } = await supabase.from('maquinas').select('*').order('nombre')
    setMaquinas(data ?? [])
    setCargando(false)
  }

  async function generarQR(maq: Maquina) {
    const url = await QRCode.toDataURL(`${window.location.origin}/historial/${maq.id}`, {
      width: 300, margin: 2,
      color: { dark: '#1a3a6b', light: '#ffffff' }
    })
    setQrModal({ nombre: maq.name, url })
  }

  function descargarQR() {
    if (!qrModal) return
    const a = document.createElement('a')
    a.href = qrModal.url
    a.download = `QR-${qrModal.nombre.replace(/\s+/g, '-')}.png`
    a.click()
  }

  const filtradas = maquinas.filter(m =>
    !busqueda ||
    m.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.ubicacion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.marca?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-700 text-brand-dark">Máquinas</h1>
        {esAdmin && (
          <Link to="/maquinas/nueva"
            className="flex items-center gap-2 bg-brand-mid hover:bg-brand-dark text-white text-sm font-600 px-4 py-2 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Agregar
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, marca, ubicación..."
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"/>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">No hay máquinas registradas</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map(maq => (
            <div key={maq.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              {maq.foto_url && (
                <img src={maq.foto_url} alt={maq.name} className="w-full h-32 object-cover rounded-lg mb-3 border border-gray-100"/>
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-700 text-brand-dark leading-tight">{maq.name}</h3>
              </div>
              <div className="space-y-1 mb-4">
                {maq.marca && <p className="text-xs text-gray-400">{maq.marca} {maq.modelo}</p>}
                {maq.serial && <p className="text-xs text-gray-400">Serial: {maq.serial}</p>}
                {maq.ubicacion && (
                  <p className="text-xs text-brand-mid font-500">📍 {maq.ubicacion}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link to={`/maquinas/${maq.id}`}
                  className="flex-1 text-center text-xs bg-brand-pale text-brand-mid py-2 rounded-lg hover:bg-brand-mid hover:text-white transition-colors font-500">
                  Ver historial
                </Link>
                <button onClick={() => generarQR(maq)}
                  className="px-3 py-2 text-xs border border-gray-200 text-gray-500 rounded-lg hover:border-brand-mid hover:text-brand-mid transition-colors">
                  QR
                </button>
                {esAdmin && (
                  <Link to={`/maquinas/${maq.id}/editar`}
                    className="px-3 py-2 text-xs border border-gray-200 text-gray-500 rounded-lg hover:border-brand-mid hover:text-brand-mid transition-colors">
                    ✏️
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-700 text-brand-dark mb-1 text-sm">Código QR</h3>
            <p className="text-xs text-gray-400 mb-4">{qrModal.nombre}</p>
            <img src={qrModal.url} alt="QR" className="mx-auto rounded-xl border border-gray-100 mb-4"/>
            <p className="text-xs text-gray-400 mb-4">Escanea para ver el historial de esta máquina</p>
            <div className="flex gap-3">
              <button onClick={() => setQrModal(null)}
                className="flex-1 py-2 text-sm border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50">
                Cerrar
              </button>
              <button onClick={descargarQR}
                className="flex-1 py-2 text-sm bg-brand-mid text-white rounded-lg hover:bg-brand-dark transition-colors font-600">
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}