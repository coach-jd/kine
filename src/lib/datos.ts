// Lectura y resumen de los eventos de medición para el tablero privado.
import { URL_BASE, cabeceras } from './supabase'

export interface Evento {
  tipo: string
  creado: string
  dispositivo: string
  sesion: string
  obra: string | null
  datos: Record<string, unknown>
}

const PAGINA = 1000
const MAX_PAGINAS = 100

export async function leerEventos(token: string, desde: string | null) {
  const filtro = desde ? `&creado=gte.${encodeURIComponent(desde)}` : ''
  const eventos: Evento[] = []
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const respuesta = await fetch(
      `${URL_BASE}/rest/v1/eventos?select=tipo,creado,dispositivo,sesion,obra,datos&order=creado.asc${filtro}`,
      { headers: { ...cabeceras(token), Range: `${pagina * PAGINA}-${(pagina + 1) * PAGINA - 1}` } },
    )
    if (!respuesta.ok) throw new Error(`No se pudieron leer los datos (${respuesta.status})`)
    const lote = (await respuesta.json()) as Evento[]
    eventos.push(...lote)
    if (lote.length < PAGINA) break
  }
  return eventos
}

const texto = (v: unknown) => (typeof v === 'string' ? v : '')
const sumar = (mapa: Map<string, number>, clave: string) => mapa.set(clave, (mapa.get(clave) ?? 0) + 1)

function mediana(valores: number[]) {
  if (valores.length === 0) return null
  const orden = [...valores].sort((a, b) => a - b)
  const mitad = Math.floor(orden.length / 2)
  return orden.length % 2 ? orden[mitad] : (orden[mitad - 1] + orden[mitad]) / 2
}

export interface Resumen {
  personas: number
  iniciados: number
  completados: number
  recorridosPorPersona: number | null
  recomiendanSi: number
  recomiendanNo: number
  instalaciones: number
  compartidos: number
  // nodo -> opción -> veces elegida
  decisiones: Map<string, Map<string, number>>
  // nodo -> mediana de segundos hasta decidir
  segundosDecision: Map<string, number | null>
  finales: Map<string, number>
  recomendacionPorFinal: Map<string, { si: number; no: number }>
  nodosIniciados: Map<string, number>
  nodosTerminados: Map<string, number>
  avisos: Map<string, number>
}

// Los eventos llegan ordenados por fecha: donde una respuesta puede cambiar
// (recomendación, aviso), la última es la que cuenta.
export function resumir(eventos: Evento[], obra: string): Resumen {
  const personas = new Set<string>()
  const personasConFinal = new Set<string>()
  const decisiones = new Map<string, Map<string, number>>()
  const tiempos = new Map<string, number[]>()
  const finales = new Map<string, number>()
  const nodosIniciados = new Map<string, number>()
  const nodosTerminados = new Map<string, number>()
  const recomendaciones = new Map<string, { final: string; si: boolean }>()
  const avisosActivos = new Map<string, boolean>()
  let iniciados = 0
  let completados = 0
  let instalaciones = 0
  let compartidos = 0

  for (const e of eventos) {
    personas.add(e.dispositivo)
    if (e.tipo === 'instalacion') instalaciones++
    if (e.tipo === 'aviso') avisosActivos.set(`${e.dispositivo}|${texto(e.datos.obra)}`, e.datos.activo === true)
    if (e.obra !== obra) continue

    const nodo = texto(e.datos.nodo)
    if (e.tipo === 'obra_inicio') iniciados++
    if (e.tipo === 'compartir') compartidos++
    if (e.tipo === 'nodo_inicio') sumar(nodosIniciados, nodo)
    if (e.tipo === 'nodo_fin') sumar(nodosTerminados, nodo)
    if (e.tipo === 'decision') {
      if (!decisiones.has(nodo)) decisiones.set(nodo, new Map())
      sumar(decisiones.get(nodo)!, texto(e.datos.opcion))
      if (typeof e.datos.ms === 'number') tiempos.set(nodo, [...(tiempos.get(nodo) ?? []), e.datos.ms / 1000])
    }
    if (e.tipo === 'final') {
      completados++
      personasConFinal.add(e.dispositivo)
      sumar(finales, texto(e.datos.final))
    }
    if (e.tipo === 'recomendacion') {
      recomendaciones.set(texto(e.datos.recorrido), { final: texto(e.datos.final), si: e.datos.recomienda === true })
    }
  }

  const recomendacionPorFinal = new Map<string, { si: number; no: number }>()
  for (const r of recomendaciones.values()) {
    const cuenta = recomendacionPorFinal.get(r.final) ?? { si: 0, no: 0 }
    if (r.si) cuenta.si++
    else cuenta.no++
    recomendacionPorFinal.set(r.final, cuenta)
  }
  const respuestas = [...recomendaciones.values()]

  const avisos = new Map<string, number>()
  for (const [clave, activo] of avisosActivos) if (activo) sumar(avisos, clave.split('|')[1])

  return {
    personas: personas.size,
    iniciados,
    completados,
    recorridosPorPersona: personasConFinal.size ? completados / personasConFinal.size : null,
    recomiendanSi: respuestas.filter((r) => r.si).length,
    recomiendanNo: respuestas.filter((r) => !r.si).length,
    instalaciones,
    compartidos,
    decisiones,
    segundosDecision: new Map([...tiempos].map(([nodo, v]) => [nodo, mediana(v)])),
    finales,
    recomendacionPorFinal,
    nodosIniciados,
    nodosTerminados,
    avisos,
  }
}
