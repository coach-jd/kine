// Contenido provisional. El texto de 9no Inning viene del borrador de la v1 y
// los cinco próximos estrenos son genéricos: todo se reemplaza por el definitivo.

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

export interface Obra {
  id: string
  titulo: string
  generos: string[]
  tono: Tono
  estado: 'disponible' | 'proximamente'
  sinopsis?: string
  minutos?: number
  creditos?: string
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

const PREGUNTA = '¿Qué debería hacer el protagonista?'

const novenoInning: Obra = {
  id: '9no-inning',
  titulo: '9no Inning',
  generos: ['Drama', 'Deportivo'],
  tono: 'cian',
  estado: 'disponible',
  minutos: 12,
  sinopsis:
    'En el tramo final de una temporada perdida, el gerente deportivo de un equipo en crisis debe decidir si apuesta por la experiencia, los datos o su propio instinto, y vivir con lo que esa decisión revela de su forma de liderar.',
  creditos: 'Una obra de Polimetrajes Studio',
  inicio: 'T',
  nodos: {
    T: {
      decision: {
        titulo: 'El costo de la apuesta',
        contexto: `La directiva, el cuerpo técnico y la afición presionan. ${PREGUNTA}`,
        opciones: [
          { clave: 'A', titulo: 'Apostar por la experiencia', corto: 'Experiencia', descripcion: 'Incorporar al veterano que garantiza estabilidad.', destino: 'T-A' },
          { clave: 'B', titulo: 'Confiar en los datos', corto: 'Datos', descripcion: 'Fichar al talento subvalorado según el análisis.', destino: 'T-B' },
          { clave: 'C', titulo: 'Seguir tu intuición', corto: 'Intuición', descripcion: 'Buscar una alternativa menos evidente.', destino: 'T-C' },
        ],
      },
    },
    'T-A': {
      decision: {
        titulo: 'El precio de la lealtad',
        contexto: `El veterano falla en los momentos clave y el vestuario está dividido. ${PREGUNTA}`,
        opciones: [
          { clave: '1', titulo: 'Sacarlo del juego', descripcion: 'Confiar en el brazo joven de la banca.', destino: 'T-A1' },
          { clave: '2', titulo: 'Mantenerlo en el montículo', descripcion: 'Honrar su trayectoria hasta el final.', destino: 'T-A2' },
          { clave: '3', titulo: 'Dejar que el vestuario decida', descripcion: 'Ceder el control a los propios jugadores.', destino: 'T-A3' },
        ],
      },
    },
    'T-B': {
      decision: {
        titulo: 'El límite del algoritmo',
        contexto: `El talento rinde en el campo, pero atraviesa una crisis que los números no contemplaron. ${PREGUNTA}`,
        opciones: [
          { clave: '1', titulo: 'Priorizar el resultado', descripcion: 'Mantenerlo en la alineación pase lo que pase.', destino: 'T-B1' },
          { clave: '2', titulo: 'Priorizar a la persona', descripcion: 'Darle espacio, aunque cueste puntos en la tabla.', destino: 'T-B2' },
          { clave: '3', titulo: 'Buscar un término medio', descripcion: 'Rotarlo con cautela, sin forzar ni abandonar.', destino: 'T-B3' },
        ],
      },
    },
    'T-C': {
      decision: {
        titulo: 'El precio de lo impredecible',
        contexto: `La apuesta arriesgada da resultados extraños y la directiva exige previsibilidad. ${PREGUNTA}`,
        opciones: [
          { clave: '1', titulo: 'Duplicar la apuesta', descripcion: 'Ir todavía más lejos con la idea original.', destino: 'T-C1' },
          { clave: '2', titulo: 'Retractarse', descripcion: 'Volver a lo convencional antes de que sea tarde.', destino: 'T-C2' },
          { clave: '3', titulo: 'Sostenerla sin cambios', descripcion: 'Ni avanzar ni retroceder: esperar que madure.', destino: 'T-C3' },
        ],
      },
    },
    'T-A1': { final: { titulo: 'Final A1', resumen: 'El brazo joven responde bajo presión y el equipo gana confianza en su futuro.' } },
    'T-A2': { final: { titulo: 'Final A2', resumen: 'El veterano se sostiene a duras penas; el equipo avanza, pero el costo queda expuesto.' } },
    'T-A3': { final: { titulo: 'Final A3', resumen: 'La decisión colectiva fractura al equipo antes de que pueda resolver nada.' } },
    'T-B1': { final: { titulo: 'Final B1', resumen: 'El jugador colapsa en el momento decisivo; los datos no midieron lo que realmente importaba.' } },
    'T-B2': { final: { titulo: 'Final B2', resumen: 'El equipo pierde terreno en la tabla, pero gana algo que ninguna estadística mide.' } },
    'T-B3': { final: { titulo: 'Final B3', resumen: 'El equilibrio funciona: el jugador se recupera a tiempo para el tramo decisivo.' } },
    'T-C1': { final: { titulo: 'Final C1', resumen: 'La apuesta se vuelve incontrolable; el equipo pierde el rumbo que intentaba encontrar.' } },
    'T-C2': { final: { titulo: 'Final C2', resumen: 'Volver a lo seguro salva la temporada, pero deja la duda de qué hubiera pasado.' } },
    'T-C3': { final: { titulo: 'Final C3', resumen: 'La paciencia rinde frutos justo cuando nadie más creía en ella.' } },
  },
}

const proximos: Obra[] = [1, 2, 3, 4, 5].map((n) => ({
  id: `proximo-${n}`,
  titulo: `Próximo título ${n}`,
  generos: ['Género por anunciar'],
  tono: TONOS[(n - 1) % 3],
  estado: 'proximamente',
  sinopsis: 'Sinopsis por anunciar.',
}))

export const OBRAS: Obra[] = [novenoInning, ...proximos]
export const ESTRENO = novenoInning
export const PROXIMAS = proximos

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
