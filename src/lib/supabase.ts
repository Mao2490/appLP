import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Rol = 'admin' | 'tecnico' | 'dueno'

export interface Perfil {
  id: string
  email: string
  nombre: string
  rol: Rol
  avatar_url?: string
  created_at: string
}

export interface Maquina {
  id: string
  name: string
  marca: string
  modelo: string
  serial: string
  ubicacion: string
  fecha_adquisicion?: string
  notas?: string
  foto_url?: string
  created_at: string
}

export interface Novedad {
  id: string
  machine_id: string
  maquina?: Maquina
  descripcion: string
  tipo_falla: string
  status_after: 'Pendiente' | 'En proceso' | 'Resuelto'
  priority: 'Normal' | 'Urgente' | 'Crítico'
  responsable_id?: string
  responsable?: Perfil
  foto_url?: string
  // Agregamos estas dos para que no den error:
  fecha: string     
  hora: string      
  created_at: string
  updated_at: string
}

export interface Compra {
  id: string
  producto: string
  categoria: string
  cantidad: number
  unidad: string
  valor_unitario: number
  proveedor_id?: string
  proveedor?: Proveedor
  notas?: string
  fecha: string
  created_at: string
}

export interface Proveedor {
  id: string
  nombre: string
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
  servicios?: string
  created_at: string
}

export interface TokenTecnico {
  id: string
  token: string
  nombre_tecnico: string
  creado_por: string
  usado: boolean
  expira_at: string
  created_at: string
}