import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const navItems = [
  {
    to: '/dashboard', label: 'Panel',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
        <rect x="1" y="1" width="6" height="6" rx="1.2"/>
        <rect x="9" y="1" width="6" height="6" rx="1.2"/>
        <rect x="1" y="9" width="6" height="6" rx="1.2"/>
        <rect x="9" y="9" width="6" height="6" rx="1.2"/>
      </svg>
    )
  },
  {
    to: '/novedades', label: 'Novedades',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    )
  },
  {
    to: '/maquinas', label: 'Máquinas',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
      </svg>
    )
  },
  {
  to: '/eventos', label: 'Eventos',
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  )
  },
  {
    to: '/compras', label: 'Compras',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
    )
  },
  {
    to: '/proveedores', label: 'Proveedores',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    )
  },
]

const adminItems = [
  {
    to: '/tokens', label: 'Acceso QR',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
      </svg>
    )
  },
  {
    to: '/usuarios', label: 'Usuarios',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/>
      </svg>
    )
  },
]

export default function AppLayout() {
  const { perfil, signOut, esTecnicoTemporal, nombreTecnicoTemporal } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifs, setNotifs] = useState<{id: string, titulo: string, mensaje: string}[]>([])
  const [verNotifs, setVerNotifs] = useState(false)

  useEffect(() => {
  // Cargar notificaciones existentes
  async function cargarNotifs() {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('leida', false)
      .order('created_at', { ascending: false })
    setNotifs((data as any) ?? [])
  }
  cargarNotifs()

  // Escuchar nuevas notificaciones en tiempo real
  const canal = supabase
    .channel('notificaciones-realtime')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notificaciones'
    }, (payload) => {
      const n = payload.new as any
      setNotifs(prev => [n, ...prev])
      toast.success(`${n.titulo}: ${n.mensaje}`, { duration: 5000 })
    })
    .subscribe()
  return () => { supabase.removeChannel(canal) }
  }, [])
    

  const esAdmin = perfil?.role === 'admin'
  const esDueno = perfil?.role === 'dueno'
  const puedeGestionar = esAdmin || esDueno

  const nombre = esTecnicoTemporal
    ? nombreTecnicoTemporal ?? 'Técnico'
    : perfil?.nombre ?? 'Usuario'

  const iniciales = nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  async function cerrarSesion() {
    await signOut()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  const allNavItems = puedeGestionar ? [...navItems, ...adminItems] : navItems

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden lg:flex flex-col w-52 bg-brand-dark min-h-screen fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-1.5 mb-2">
            <span className="text-sm font-black text-brand-dark">LP</span>
            <div className="w-5 h-5 rounded-full border border-brand-mid flex items-center justify-center">
              <div className="w-2 h-2.5 bg-brand-light" style={{clipPath:'polygon(0 100%,50% 0,100% 60%,55% 60%,55% 100%)'}}/>
            </div>
            <span className="text-sm font-black text-brand-dark">FITNESS</span>
          </div>
          <p className="text-white/40 text-[10px] text-center">Mantenimiento</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-500 transition-colors ${
                  isActive
                    ? 'bg-brand-mid text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/8'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          {puedeGestionar && (
            <>
              <div className="pt-3 pb-1 px-3">
                <span className="text-[9px] text-white/25 uppercase tracking-widest">Administración</span>
              </div>
              {adminItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-500 transition-colors ${
                      isActive
                        ? 'bg-brand-mid text-white'
                        : 'text-white/50 hover:text-white hover:bg-white/8'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          {esTecnicoTemporal && (
            <div className="bg-brand-mid/30 rounded-lg px-2 py-1.5 mb-3 text-center">
              <span className="text-[10px] text-brand-light">Acceso temporal · 24h</span>
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-brand-mid flex items-center justify-center text-white text-[10px] font-700 flex-shrink-0">
              {iniciales}
            </div>
            <div className="min-w-0">
              <p className="text-white/80 text-xs font-500 truncate">{nombre}</p>
              <p className="text-white/35 text-[10px] truncate">
                {esTecnicoTemporal ? 'Técnico' : perfil?.role}
              </p>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="w-full text-left flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition-colors px-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 lg:ml-52 flex flex-col min-h-screen">
        {/* Topbar mobile */}
        <header className="lg:hidden bg-brand-dark px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-lg px-2 py-1 flex items-center gap-1">
              <span className="text-xs font-black text-brand-dark">LP</span>
              <span className="text-xs font-black text-brand-dark">FITNESS</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Campana notificaciones */}
            <button onClick={() => setVerNotifs(!verNotifs)} className="relative text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              {notifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                  {notifs.length}
                </span>
              )}
            </button>
            <div className="w-7 h-7 rounded-full bg-brand-mid flex items-center justify-center text-white text-[10px] font-700">
              {iniciales}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </header>
        {verNotifs && (
          <div className="absolute top-14 right-4 bg-white rounded-xl shadow-xl border border-gray-100 z-50 w-72">
            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
              <span className="text-sm font-600 text-brand-dark">Notificaciones</span>
              <button onClick={() => { setNotifs([]); setVerNotifs(false) }} className="text-xs text-gray-400 hover:text-red-400">Limpiar</button>
            </div>
            {notifs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin notificaciones</p>
            ) : (
              notifs.map(n => (
                <div key={n.id} className="px-4 py-3 border-b border-gray-50 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-700 font-600">{n.titulo}</p>
                    <p className="text-xs text-gray-500">{n.mensaje}</p>
                </div>
                <button onClick={async () => {
                  await supabase.from('notificaciones').update({ leida: true }).eq('id', n.id)
                  setNotifs(prev => prev.filter(x => x.id !== n.id))
                }} className="text-[10px] text-gray-300 hover:text-red-400 flex-shrink-0">✕</button>
              </div>
            ))
            )}
          </div>
        )}

        {/* Mobile slide menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/50"/>
            <div className="absolute right-0 top-0 bottom-0 w-56 bg-brand-dark p-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-end mb-4">
                <button onClick={() => setMobileMenuOpen(false)} className="text-white/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <nav className="space-y-1">
                {allNavItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-500 transition-colors ${
                        isActive ? 'bg-brand-mid text-white' : 'text-white/50 hover:text-white hover:bg-white/8'
                      }`
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <button onClick={cerrarSesion} className="mt-6 flex items-center gap-2 text-white/40 text-sm px-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-dark border-t border-white/10 z-20 flex">
          {navItems.slice(0, 4).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 gap-1 text-[10px] font-500 transition-colors ${
                  isActive ? 'text-brand-light' : 'text-white/40'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </div>
        {/* ── BOTÓN FLOTANTE (solo móvil) ── */}
        {location.pathname === '/novedades' && (
        <Link
          to="/novedades/nueva"
          className="fixed bottom-20 right-5 bg-brand-mid text-white w-10 h-10 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-30">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
        </Link>
        )}
        {location.pathname === '/maquinas' && (
        <Link
          to="/maquinas/nueva"
          className="fixed bottom-20 right-5 bg-brand-mid text-white w-10 h-10 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-30">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
        </Link>
        )}
        
  
      </main>
    </div>
  )
}