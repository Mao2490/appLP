import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import NovedadesPage from '@/pages/NovedadesPage'
import NuevaNovedadPage from '@/pages/NuevaNovedadPage'
import MaquinasPage from '@/pages/MaquinasPage'
import NuevaMaquinaPage from '@/pages/NuevaMaquinaPage'
import HistorialMaquinaPage from '@/pages/HistorialMaquinaPage'
import ComprasPage from '@/pages/ComprasPage'
import ProveedoresPage from '@/pages/ProveedoresPage'
import TokensPage from '@/pages/TokensPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, esTecnicoTemporal } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
    </div>
  )
  if (!user && !esTecnicoTemporal) return <Navigate to="/login" replace/>
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { perfil } = useAuth()
  if (perfil && perfil.rol !== 'admin' && perfil.rol !== 'dueno') {
    return <Navigate to="/dashboard" replace/>
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Pública - historial de máquina por QR */}
      <Route path="/historial/:id" element={<HistorialMaquinaPage />}/>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />}/>

      {/* App protegida */}
      <Route path="/" element={
        <PrivateRoute><AppLayout/></PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace/>}/>
        <Route path="dashboard" element={<DashboardPage/>}/>
        <Route path="novedades" element={<NovedadesPage/>}/>
        <Route path="novedades/nueva" element={<NuevaNovedadPage/>}/>
        <Route path="novedades/:id/editar" element={<NuevaNovedadPage/>}/>
        <Route path="maquinas" element={<MaquinasPage/>}/>
        <Route path="maquinas/nueva" element={<AdminRoute><NuevaMaquinaPage/></AdminRoute>}/>
        <Route path="maquinas/:id" element={<HistorialMaquinaPage/>}/>
        <Route path="maquinas/:id/editar" element={<AdminRoute><NuevaMaquinaPage/></AdminRoute>}/>
        <Route path="compras" element={<ComprasPage/>}/>
        <Route path="proveedores" element={<ProveedoresPage/>}/>
        <Route path="tokens" element={<AdminRoute><TokensPage/></AdminRoute>}/>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes/>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontSize: '13px', borderRadius: '10px', border: '0.5px solid #e2e5ea' },
            success: { iconTheme: { primary: '#1e7ec8', secondary: '#fff' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}