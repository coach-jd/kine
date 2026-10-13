// El contenido de cada obra vive en su Ficha de Publicación (./obras/*.json).
import fichaNovenoInning from './obras/9no-inning.json'
import fichaUltimaCarta from './obras/despues-de-la-ultima-carta.json'
import fichaCasaQueRecuerda from './obras/la-casa-que-recuerda.json'
import fichaFronteraDelAgua from './obras/la-frontera-del-agua.json'
import fichaUltimaFrecuencia from './obras/la-ultima-frecuencia.json'
import fichaLugarEnLaMesa from './obras/un-lugar-en-la-mesa.json'

export type Tono = 'cian' | 'violeta' | 'naranja'

export interface Opcion {
  clave: string
  titulo: string
  corto?: string
  descripcion: string
  destino: string
}

export interface Decision {
  titulo: string
  contexto: string
  opciones: Opcion[]
}

export interface Final {
  titulo: string
  resumen: string
}

export interface Nodo {
  decision?: Decision
  final?: Final
}

export interface Seo {
  titulo: string
  descripcion: string
  palabras_clave: string[]
}

export interface Compartir {
  texto_obra: string
  texto_final: string
}

export interface Obra {
  id: string
  titulo: string
  generos: string[]
  tono: Tono
  estado: 'disponible' | 'proximamente'
  sinopsis?: string
  minutos?: number
  creditos?: string
  seo?: Seo
  compartir?: Compartir
  inicio?: string
  nodos?: Record<string, Nodo>
}

// Una opción toma el color de su posición: es el mismo orden del logo.
export const TONOS: Tono[] = ['cian', 'violeta', 'naranja']

export const TONO: Record<Tono, { fondo: string; tinte: string; borde: string; texto: string }> = {
  cian: { fondo: 'bg-cian', tinte: 'bg-cian-tint', borde: 'border-cian', texto: 'text-cian' },
  violeta: { fondo: 'bg-violeta', tinte: 'bg-violeta-tint', borde: 'border-violeta', texto: 'text-violeta' },
  naranja: { fondo: 'bg-naranja', tinte: 'bg-naranja-tint', borde: 'border-naranja', texto: 'text-naranja' },
}

// Una Ficha de Publicación es el archivo que entrega Polimetrajes Studio por cada
// obra. Publicar una obra es añadir su ficha en ./obras y sumarla a FICHAS.
interface Ficha {
  esquema: string
  obra: Omit<Obra, 'inicio' | 'nodos' | 'seo' | 'compartir'>
  seo?: Seo
  compartir?: Compartir
  inicio?: string
  nodos?: Record<string, Nodo>
}

// scripts/verificar-fichas.mjs revisa cada ficha antes de compilar.
function leerFicha(dato: unknown): Obra {
  const ficha = dato as Ficha
  return { ...ficha.obra, seo: ficha.seo, compartir: ficha.compartir, inicio: ficha.inicio, nodos: ficha.nodos }
}

// El orden de esta lista es el orden en que la app muestra las obras.
const FICHAS = [
  fichaNovenoInning,
  fichaUltimaFrecuencia,
  fichaCasaQueRecuerda,
  fichaLugarEnLaMesa,
  fichaUltimaCarta,
  fichaFronteraDelAgua,
].map(leerFicha)

export const OBRAS: Obra[] = FICHAS
export const ESTRENO = FICHAS[0]
export const PROXIMAS = FICHAS.filter((f) => f.estado === 'proximamente')

export const obraPorId = (id: string) => OBRAS.find((o) => o.id === id)

export const idsDeFinales = (obra: Obra) =>
  Object.entries(obra.nodos ?? {})
    .filter(([, n]) => n.final)
    .map(([id]) => id)

export interface Paso {
  nodo: string
  opcion: Opcion
  tono: Tono
}

// Reconstruye las decisiones tomadas a partir de las claves elegidas (['A', '2']).
export function pasosDe(obra: Obra, camino: string[]): Paso[] {
  const pasos: Paso[] = []
  let nodo = obra.inicio
  let tono: Tono = 'cian'
  for (const clave of camino) {
    const opciones = nodo ? obra.nodos?.[nodo]?.decision?.opciones : undefined
    const i = opciones?.findIndex((o) => o.clave === clave) ?? -1
    if (!nodo || !opciones || i < 0) break
    if (pasos.length === 0) tono = TONOS[i % 3]
    pasos.push({ nodo, opcion: opciones[i], tono })
    nodo = opciones[i].destino
  }
  return pasos
}
