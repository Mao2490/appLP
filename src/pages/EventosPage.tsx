import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Evento } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

const TIPOS_COLOR: Record<string, string> = {
  'Clase': 'bg-blue-100 text-blue-700',
  'Torneo': 'bg-purple-100 text-purple-700',
  'Mantenimiento': 'bg-amber-100 text-amber-700',
  'Promoción': 'bg-green-100 text-green-700',
  'Otro': 'bg-gray-100 text-gray-600',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function EventosPage() {
  const { perfil } = useAuth()
  const esAdmin = perfil?.role === 'admin' || perfil?.role === 'dueno'

  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(true)
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)

  useEffect(() => { cargar() }, [mes, anio])

  async function cargar() {
    setCargando(true)
    const inicio = `${anio}-${String(mes + 1).padStart(2, '0')}-01`
    const fin = `${anio}-${String(mes + 1).padStart(2, '0')}-${getDaysInMonth(anio, mes)}`
    const { data } = await supabase
      .from('eventos')
      .select('*')
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .order('fecha')
    setEventos((data as any) ?? [])
    setCargando(false)
  }

  async function eliminar() {
  if (!confirmarEliminar) return
  await supabase.from('eventos').delete().eq('id', confirmarEliminar)
  toast.success('Evento eliminado')
  setConfirmarEliminar(null)
  cargar()
  }

  const diasEnMes = getDaysInMonth(anio, mes)
  const primerDia = getFirstDayOfMonth(anio, mes)

  const eventosPorDia = (dia: number) => {
    const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return eventos.filter(e => e.fecha === fecha)
  }

  const eventosDiaSeleccionado = diaSeleccionado
    ? eventos.filter(e => e.fecha === diaSeleccionado)
    : []

  function navMes(dir: number) {
    let m = mes + dir
    let a = anio
    if (m < 0) { m = 11; a-- }
    if (m > 11) { m = 0; a++ }
    setMes(m)
    setAnio(a)
    setDiaSeleccionado(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-700 text-brand-dark">Eventos</h1>
        {esAdmin && (
          <Link to="/eventos/nuevo"
            className="flex items-center gap-2 bg-brand-mid hover:bg-brand-dark text-white text-sm font-600 px-4 py-2 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo evento
          </Link>
        )}
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        {/* Header mes */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navMes(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 className="text-sm font-700 text-brand-dark">{MESES[mes]} {anio}</h2>
          <button onClick={() => navMes(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {/* Días semana */}
        <div className="grid grid-cols-7 mb-2">
          {DIAS.map(d => (
            <div key={d} className="text-center text-[10px] font-600 text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: primerDia }).map((_, i) => <div key={`empty-${i}`}/>)}
          {Array.from({ length: diasEnMes }).map((_, i) => {
            const dia = i + 1
            const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
            const evs = eventosPorDia(dia)
            const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
            const seleccionado = fecha === diaSeleccionado

            return (
              <button
                key={dia}
                onClick={() => setDiaSeleccionado(seleccionado ? null : fecha)}
                className={`relative flex flex-col items-center p-1 rounded-lg transition-colors min-h-[40px] ${
                  seleccionado ? 'bg-brand-mid text-white' :
                  esHoy ? 'bg-brand-pale text-brand-dark' :
                  'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-xs font-500">{dia}</span>
                {evs.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {evs.slice(0, 3).map((_, idx) => (
                      <div key={idx} className={`w-1 h-1 rounded-full ${seleccionado ? 'bg-white' : 'bg-brand-mid'}`}/>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Eventos del día seleccionado */}
      {diaSeleccionado && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-700 text-brand-dark">
              {new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {esAdmin && (
              <Link to={`/eventos/nuevo?fecha=${diaSeleccionado}`}
                className="text-xs text-brand-mid hover:underline">
                + Agregar
              </Link>
            )}
          </div>
          {eventosDiaSeleccionado.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin eventos este día</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {eventosDiaSeleccionado.map(ev => (
                <div key={ev.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-600 text-brand-dark">{ev.titulo}</span>
                    {ev.tipo && (
                      <span className={`text-[10px] font-500 px-2 py-0.5 rounded-full ${TIPOS_COLOR[ev.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ev.tipo}
                      </span>
                    )}
                    {ev.hora && <span className="text-xs text-gray-400">🕐 {ev.hora}</span>}
                  </div>
                  {ev.descripcion && <p className="text-xs text-gray-500 mb-1">{ev.descripcion}</p>}
                  {ev.responsable_nombre && (
                    <p className="text-xs text-gray-400">👤 {ev.responsable_nombre}</p>
                  )}
                  {esAdmin && (
                    <div className="flex gap-2 mt-2">
                      <Link to={`/eventos/${ev.id}/editar`}
                        className="text-xs text-brand-mid hover:underline">Editar</Link>
                      <button onClick={() => setConfirmarEliminar(ev.id)}
                        className="text-xs text-red-400 hover:underline">Eliminar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista todos los eventos del mes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-700 text-brand-dark">Todos los eventos de {MESES[mes]}</h3>
        </div>
        {cargando ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-brand-pale border-t-brand-mid rounded-full animate-spin"/>
          </div>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin eventos este mes</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {eventos.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="text-center min-w-[36px]">
                  <p className="text-lg font-700 text-brand-dark leading-none">
                    {new Date(ev.fecha + 'T00:00:00').getDate()}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {DIAS[new Date(ev.fecha + 'T00:00:00').getDay()]}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-600 text-brand-dark">{ev.titulo}</span>
                    {ev.tipo && (
                      <span className={`text-[10px] font-500 px-2 py-0.5 rounded-full ${TIPOS_COLOR[ev.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ev.tipo}
                      </span>
                    )}
                  </div>
                  {ev.hora && <p className="text-xs text-gray-400 mt-0.5">🕐 {ev.hora}</p>}
                  {ev.descripcion && <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.descripcion}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {confirmarEliminar && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
          <h3 className="text-base font-bold text-gray-800 mb-2">¿Eliminar evento?</h3>
          <p className="text-sm text-gray-500 mb-6">Se eliminará el evento y no se puede deshacer.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmarEliminar(null)}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={eliminar}
              className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-600 hover:bg-red-600">
              Eliminar
            </button>
          </div>
         </div>
       </div>
      )}
    </div>
  )
}