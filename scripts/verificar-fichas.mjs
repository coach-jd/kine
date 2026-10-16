// Revisa cada Ficha de Publicación antes de compilar. Si una está incompleta,
// la compilación se detiene y la versión publicada no cambia.
import { readFileSync, readdirSync } from 'node:fs'

const carpeta = new URL('../src/data/obras/', import.meta.url)
const errores = []

for (const archivo of readdirSync(carpeta).filter((a) => a.endsWith('.json'))) {
  const falla = (texto) => errores.push(`${archivo}: ${texto}`)
  let ficha
  try {
    ficha = JSON.parse(readFileSync(new URL(archivo, carpeta), 'utf8'))
  } catch (e) {
    falla(`no es un JSON válido (${e.message})`)
    continue
  }

  if (!ficha.esquema?.startsWith('ficha-publicacion-1.')) falla('esquema no reconocido')
  if (`${ficha.obra?.id}.json` !== archivo) falla('el nombre del archivo no coincide con obra.id')
  for (const campo of ['titulo', 'estado', 'generos', 'tono']) {
    if (!ficha.obra?.[campo]) falla(`falta obra.${campo}`)
  }
  if (!['disponible', 'proximamente', 'demostracion'].includes(ficha.obra?.estado))
    falla('obra.estado debe ser disponible, proximamente o demostracion')
  if (!['cian', 'violeta', 'naranja'].includes(ficha.obra?.tono)) falla('obra.tono debe ser cian, violeta o naranja')
  // Una demostración se revisa igual que una obra disponible: se puede reproducir.
  if (ficha.obra?.estado === 'proximamente') {
    // Todo lo que trae una ficha queda a la vista de cualquiera que abra la app.
    if (ficha.nodos) falla('una obra próxima no debe traer nodos: publicaría sus decisiones y finales')
    continue
  }

  const nodos = ficha.nodos ?? {}
  if (!nodos[ficha.inicio]) falla('no existe el nodo de inicio')
  const decisiones = Object.entries(nodos).filter(([, n]) => n.decision)
  const finales = Object.entries(nodos).filter(([, n]) => n.final)
  if (decisiones.length !== 4) falla(`tiene ${decisiones.length} decisiones y deben ser 4`)
  if (finales.length !== 9) falla(`tiene ${finales.length} finales y deben ser 9`)

  for (const [id, { decision }] of decisiones) {
    if (!decision.titulo || !decision.contexto) falla(`${id}: falta el título o el contexto de la decisión`)
    if (decision.opciones?.length !== 3) falla(`${id}: debe tener exactamente tres opciones`)
    for (const opcion of decision.opciones ?? []) {
      if (!opcion.clave || !opcion.titulo || !opcion.descripcion) falla(`${id}: una opción está incompleta`)
      if (!nodos[opcion.destino]) falla(`${id}: lleva a ${opcion.destino}, que no existe`)
    }
  }
  for (const [id, { final }] of finales) {
    if (!final.titulo || !final.resumen) falla(`${id}: falta el título o el resumen del final`)
  }
}

if (errores.length) {
  console.error('Fichas de Publicación con errores:\n- ' + errores.join('\n- '))
  process.exit(1)
}
console.log('Fichas de Publicación: sin errores.')
