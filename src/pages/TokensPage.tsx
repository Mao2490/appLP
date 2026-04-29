import { useEffect, useState } from 'react'
import { supabase, TokenTecnico } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

function uuid() {
  return crypto.randomUUID()
}

export default function TokensPage() {
  const { perfil } = useAuth()
  const [tokens, setTokens] = useState<TokenTecnico[]>([])
  const [cargando, setCargando] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [nombreTecnico, setNombreTecnico] = useState('')
  const [qrModal, setQrModal] = useState<{ token: string; nombre: string; qrUrl: string } | null>(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const { data } = await supabase
      .from('tokens_tecnicos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setTokens((data as any) ?? [])
    setCargando(false)
  }

  async function generarToken() {
    if (!nombreTecnico.trim()) { toast.error('Ingresa el nombre del técnico'); return }
    setGenerando(true)

    const token = uuid()
    const expira = new Date()
    expira.setHours(expira.getHours() + 24)

    const { error } = await supabase.from('tokens_tecnicos').insert({
      token,
      nombre_tecnico: nombreTecnico.trim(),
      creado_por: perfil?.id,
      usado: false,
      expira_at: expira.toISOString(),
    })

    if (error) { toast.error('Error al generar acceso'); setGenerando(false); return }

    // Generar QR con el token
    const qrUrl = await QRCode.toDataURL(token, {
      width: 300, margin: 2,
      color: { dark: '#1a3a6b', light: '#ffffff' }
    })

    // Enviar email con el QR usando Resend via Supabase Edge Function
    await enviarEmailQR(token, nombreTecnico.trim(), qrUrl, expira)

    setQrModal({ token, nombre: nombreTecnico.trim(), qrUrl })
    setNombreTecnico('')
    toast.success('QR generado y enviado al correo')
    cargar()
    setGenerando(false)
  }

  async function enviarEmailQR(token: string, nombre: string, qrUrl: string, expira: Date) {
    try {
      await supabase.functions.invoke('enviar-qr-tecnico', {
        body: {
          token,
          nombre_tecnico: nombre,
          expira_at: expira.toISOString(),
          qr_base64: qrUrl,
          empresa_email: import.meta.env.VITE_EMPRESA_EMAIL,
        }
      })
    } catch {
      toast('El QR fue creado pero hubo un problema enviando el correo', { icon: '⚠️' })
    }
  }

  async function revocarToken(id: string) {
    await supabase.from('tokens_tecnicos').update({ usado: true }).eq('id', id)
    toast.success('Acceso revocado')
    cargar()
  }

  function descargarQR() {
    if (!qrModal) return
    const a = document.createElement('a')
    a.href = qrModal.qrUrl
    a.download = `QR-Tecnico-${qrModal.nombre.replace(/\s+/g, '-')}.png`
    a.click()
  }

  function estaVigente(token: TokenTecnico) {
    return !token.usado && new Date(token.expira_at) > new Date()
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-700 text-brand-dark">Acceso temporal para técnicos</h1>

      {/* Formulario generar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-700 text-brand-dark mb-4">Generar nuevo acceso QR</h2>
        <div className="flex gap-3">
          <input
            value={nombreTecnico}
            onChange={e => setNombreTecnico(e.target.value)}
            placeholder="Nombre del técnico..."
            onKeyDown={e => e.key === 'Enter' && generarToken()}
            className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid"
          />
          <button
            onClick={generarToken}
            disabled={generando}
            className="px-4 py-2.5 bg-brand-mid hover:bg-brand-dark text-white text-sm font-600 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {generando ? 'Generando...' : 'Generar QR'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          El QR llegará al correo de la empresa y tendrá validez de <strong>24 horas</strong>.
          El técnico podrá ver toda la información y registrar novedades.
        </p>
      </div>

      {/* Lista de tokens */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-700 text-brand-dark">Accesos generados</h2>
        </div>
        {cargando ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
          </div>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Sin accesos generados aún</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {tokens.map(t => {
              const vigente = estaVigente(t)
              const expiraDate = new Date(t.expira_at)
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${vigente ? 'bg-green-500' : 'bg-gray-300'}`}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-600 text-brand-dark">{t.nombre_tecnico}</p>
                    <p className="text-xs text-gray-400">
                      {vigente
                        ? `Válido hasta: ${expiraDate.toLocaleString('es-CO')}`
                        : t.usado
                        ? 'Usado / Revocado'
                        : 'Expirado'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {vigente && (
                      <button
                        onClick={() => revocarToken(t.id)}
                        className="text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Revocar
                      </button>
                    )}
                    <span className={`text-[10px] font-500 px-2 py-0.5 rounded-full ${
                      vigente ? 'bg-green-100 text-green-700' :
                      t.usado ? 'bg-gray-100 text-gray-500' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {vigente ? 'Vigente' : t.usado ? 'Usado' : 'Expirado'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 className="font-700 text-brand-dark mb-1">QR generado</h3>
            <p className="text-xs text-gray-400 mb-1">Para: <strong>{qrModal.nombre}</strong></p>
            <p className="text-xs text-brand-mid mb-4">Válido por 24 horas · Enviado al correo de la empresa</p>
            <img src={qrModal.qrUrl} alt="QR" className="mx-auto rounded-xl border border-gray-100 mb-4"/>
            <p className="text-xs text-gray-400 mb-4">
              Comparte esta imagen por WhatsApp con el técnico para que pueda ingresar
            </p>
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