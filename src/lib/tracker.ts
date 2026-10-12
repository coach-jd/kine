// Registro de eventos de medición. Cada evento entra a una cola guardada en el
// dispositivo y se envía a Supabase; si no hay red, sale en el siguiente intento.

const CLAVE = 'kine.pendientes'
const CLAVE_DISPOSITIVO = 'kine.dispositivo'
const MAXIMO = 1000

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
const LLAVE = import.meta.env.VITE_SUPABASE_KEY as string | undefined

export type TipoEvento =
  | 'obra_inicio'
  | 'nodo_inicio'
  | 'nodo_fin'
  | 'decision'
  | 'final'
  | 'recomendacion'
  | 'compartir'
  | 'aviso'
  | 'instalacion'

interface Evento {
  tipo: TipoEvento
  dispositivo: string
  sesion: string
  obra: string | null
  datos: Record<string, unknown>
  fecha_cliente: string
}

export const nuevoId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

function dispositivo() {
  try {
    let id = localStorage.getItem(CLAVE_DISPOSITIVO)
    if (!id) {
      id = nuevoId()
      localStorage.setItem(CLAVE_DISPOSITIVO, id)
    }
    return id
  } catch {
    return 'anonimo'
  }
}

const sesion = nuevoId()

function leerCola(): Evento[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as Evento[]
  } catch {
    return []
  }
}

function guardarCola(cola: Evento[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(cola.slice(-MAXIMO)))
  } catch {
    // Sin almacenamiento disponible (modo privado): la app sigue funcionando.
  }
}

let enviando = false

async function enviar() {
  if (!URL_BASE || !LLAVE || enviando) return
  const lote = leerCola()
  if (lote.length === 0) return
  enviando = true
  let entregado = false
  try {
    const respuesta = await fetch(`${URL_BASE}/rest/v1/eventos`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: LLAVE,
        Authorization: `Bearer ${LLAVE}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(lote),
    })
    // Un rechazo del servidor (4xx) no se arregla reintentando: se descarta el lote.
    if (respuesta.ok || (respuesta.status >= 400 && respuesta.status < 500)) {
      guardarCola(leerCola().slice(lote.length))
      entregado = true
    }
  } catch {
    // Sin red: el lote queda en la cola.
  } finally {
    enviando = false
  }
  // Lo que se registró mientras el lote viajaba sale ahora, sin esperar otro evento.
  if (entregado) void enviar()
}

export function registrar(tipo: TipoEvento, datos: Record<string, unknown> = {}) {
  const evento: Evento = {
    tipo,
    dispositivo: dispositivo(),
    sesion,
    obra: typeof datos.obra === 'string' ? datos.obra : null,
    datos,
    fecha_cliente: new Date().toISOString(),
  }
  guardarCola([...leerCola(), evento])
  void enviar()
}

if (typeof window !== 'undefined') {
  void enviar()
  window.addEventListener('online', () => void enviar())
  document.addEventListener('visibilitychange', () => void enviar())
}
