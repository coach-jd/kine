// Registro de eventos de medición. Por ahora se guardan en el dispositivo; el
// envío al backend se conecta aquí sin tocar el resto de la app.

const CLAVE = 'kine.eventos'
const CLAVE_DISPOSITIVO = 'kine.dispositivo'
const MAXIMO = 1000

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

export function registrar(tipo: TipoEvento, datos: Record<string, unknown> = {}) {
  const evento = { tipo, datos, fecha: new Date().toISOString(), dispositivo: dispositivo(), sesion }
  try {
    const cola = JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as unknown[]
    cola.push(evento)
    localStorage.setItem(CLAVE, JSON.stringify(cola.slice(-MAXIMO)))
  } catch {
    // Sin almacenamiento disponible (modo privado): la app sigue funcionando.
  }
}
