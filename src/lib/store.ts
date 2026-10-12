import { useSyncExternalStore } from 'react'
import { nuevoId, registrar } from './tracker'

export interface Recorrido {
  id: string
  obra: string
  camino: string[]
  final: string
  recomienda: boolean | null
  fecha: string
}

interface Estado {
  recorridos: Recorrido[]
  avisos: string[]
}

const CLAVE = 'kine.estado'
const VACIO: Estado = { recorridos: [], avisos: [] }

function leer(): Estado {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Partial<Estado> | null
    return { recorridos: guardado?.recorridos ?? [], avisos: guardado?.avisos ?? [] }
  } catch {
    return VACIO
  }
}

let estado = leer()
const oyentes = new Set<() => void>()

function cambiar(nuevo: Estado) {
  estado = nuevo
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado))
  } catch {
    // Sin almacenamiento disponible: el estado vive solo durante la visita.
  }
  oyentes.forEach((avisar) => avisar())
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar)
  return () => {
    oyentes.delete(avisar)
  }
}

export const useEstado = () => useSyncExternalStore(suscribir, () => estado)

export function registrarFinal(obra: string, camino: string[], final: string) {
  const recorrido: Recorrido = { id: nuevoId(), obra, camino, final, recomienda: null, fecha: new Date().toISOString() }
  cambiar({ ...estado, recorridos: [...estado.recorridos, recorrido] })
  registrar('final', { obra, camino, final, recorrido: recorrido.id })
  return recorrido.id
}

export function recomendar(id: string, recomienda: boolean) {
  const recorrido = estado.recorridos.find((r) => r.id === id)
  if (!recorrido) return
  cambiar({ ...estado, recorridos: estado.recorridos.map((r) => (r.id === id ? { ...r, recomienda } : r)) })
  registrar('recomendacion', { obra: recorrido.obra, final: recorrido.final, recorrido: id, recomienda })
}

export function alternarAviso(obra: string) {
  const activo = !estado.avisos.includes(obra)
  cambiar({ ...estado, avisos: activo ? [...estado.avisos, obra] : estado.avisos.filter((o) => o !== obra) })
  registrar('aviso', { obra, activo })
}

export const finalesDescubiertos = (e: Estado, obra: string) =>
  new Set(e.recorridos.filter((r) => r.obra === obra).map((r) => r.final))
