import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Html5Qrcode } from 'html5-qrcode'

type Modo = 'email' | 'qr'

export default function LoginPage() {
  const { signIn, loginConToken } = useAuth()
  const navigate = useNavigate()
  const [modo, setModo] = useState<Modo>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [escaneando, setEscaneando] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    return () => { detenerScanner() }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error('Credenciales incorrectas')
    } finally {
      setCargando(false)
    }
  }

  async function iniciarScanner() {
    setEscaneando(true)
    await new Promise(r => setTimeout(r, 300))
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await detenerScanner()
          setCargando(true)
          try {
            // El QR contiene solo el token UUID
            const token = decodedText.trim()
            await loginConToken(token)
            toast.success('¡Acceso concedido!')
            navigate('/dashboard')
          } catch {
            toast.error('QR inválido o expirado')
            setEscaneando(false)
          } finally {
            setCargando(false)
          }
        },
        () => {}
      )
    } catch {
      toast.error('No se pudo acceder a la cámara')
      setEscaneando(false)
    }
  }

  async function detenerScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setEscaneando(false)
  }

  function cambiarModo(m: Modo) {
    detenerScanner()
    setModo(m)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-brand-mid flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-6 py-4 mb-4 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-brand-dark">LP</span>
              <div className="w-8 h-8 rounded-full border-2 border-brand-mid flex items-center justify-center">
                <div className="w-3 h-4 bg-brand-light rounded-sm" style={{clipPath:'polygon(0 100%,50% 0,100% 60%,60% 60%,60% 100%)'}}/>
              </div>
              <span className="text-2xl font-black text-brand-dark">FITNESS</span>
            </div>
          </div>
          <p className="text-white/60 text-sm">Sistema de mantenimiento</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-gray-100">
            <button
              onClick={() => cambiarModo('email')}
              className={`py-4 text-sm font-600 transition-colors ${
                modo === 'email'
                  ? 'bg-brand-dark text-white'
                  : 'text-gray-400 hover:text-brand-dark'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Usuario
              </span>
            </button>
            <button
              onClick={() => cambiarModo('qr')}
              className={`py-4 text-sm font-600 transition-colors ${
                modo === 'qr'
                  ? 'bg-brand-mid text-white'
                  : 'text-gray-400 hover:text-brand-mid'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Código QR
              </span>
            </button>
          </div>

          <div className="p-6">
            {/* LOGIN EMAIL */}
            {modo === 'email' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-500 text-gray-500 mb-1.5">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid focus:ring-2 focus:ring-brand-pale transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-500 text-gray-500 mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-mid focus:ring-2 focus:ring-brand-pale transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-brand-dark hover:bg-brand-mid text-white font-600 py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
                >
                  {cargando ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>
            )}

            {/* LOGIN QR */}
            {modo === 'qr' && (
              <div className="text-center">
                {!escaneando && !cargando ? (
                  <div>
                    <div className="w-20 h-20 bg-brand-pale rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-brand-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Acceso para técnicos</p>
                    <p className="text-xs text-gray-400 mb-5">Escanea el QR que recibiste por WhatsApp</p>
                    <button
                      onClick={iniciarScanner}
                      className="w-full bg-brand-mid hover:bg-brand-dark text-white font-600 py-2.5 rounded-lg transition-colors text-sm"
                    >
                      Abrir cámara
                    </button>
                  </div>
                ) : cargando ? (
                  <div className="py-8">
                    <div className="w-10 h-10 border-4 border-brand-pale border-t-brand-mid rounded-full animate-spin mx-auto mb-3"/>
                    <p className="text-sm text-gray-500">Verificando acceso...</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 mb-3">Apunta la cámara al código QR</p>
                    <div id="qr-reader" className="rounded-xl overflow-hidden border-2 border-brand-mid" style={{width:'100%'}}/>
                    <button
                      onClick={detenerScanner}
                      className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">LP Fitness · Sistema de mantenimiento v1.0</p>
      </div>
    </div>
  )
}