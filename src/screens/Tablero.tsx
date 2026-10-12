import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ESTRENO, PROXIMAS, TONOS, idsDeFinales, type Tono } from '../data/obras'
import { leerEventos, resumir, type Evento, type Resumen } from '../lib/datos'
import { urlBucle, urlVideo } from '../lib/media'
import { correoActual, entrar, salir, tokenVigente } from '../lib/sesion'
import { URL_BASE } from '../lib/supabase'

const PERIODOS = [
  { texto: '7 días', dias: 7 },
  { texto: '30 días', dias: 30 },
  { texto: 'Todo', dias: null },
]

// Pasos de los colores de marca ajustados para gráficos sobre fondo oscuro.
const COLOR: Record<Tono, string> = { cian: 'bg-g-cian', violeta: 'bg-g-violeta', naranja: 'bg-g-naranja' }

const obra = ESTRENO
const nodos = obra.nodos ?? {}
const ramas = nodos[obra.inicio ?? '']?.decision?.opciones ?? []
const tonoDeFinal = (final: string) => TONOS[Math.max(0, ramas.findIndex((r) => final.startsWith(r.destino))) % 3]
function etiquetaDeTramo(id: string) {
  if (id === obra.inicio) return 'Parte 1 · Inicio'
  const rama = ramas.find((r) => r.destino === id)
  if (rama) return `Parte 2 · ${rama.corto ?? rama.titulo}`
  return `Parte 3 · ${nodos[id]?.final?.titulo ?? id}`
}
const porcentaje =(parte: number, total: number) => (total ? `${Math.round((parte / total) * 100)}%` : '—')

// Datos inventados para revisar el diseño en desarrollo (/#/tablero?muestra).
function eventosDeMuestra(): Evento[] {
  const eventos: Evento[] = []
  const agregar = (tipo: string, dispositivo: string, datos: Record<string, unknown>, obraId: string | null = obra.id) =>
    eventos.push({ tipo, creado: new Date().toISOString(), dispositivo, sesion: dispositivo, obra: obraId, datos })
  for (let i = 0; i < 60; i++) {
    const persona = `p${i % 34}`
    const rama = ramas[(i * 7) % 5 === 0 ? 2 : i % 2]
    const opciones = nodos[rama.destino]?.decision?.opciones ?? []
    const hoja = opciones[(i * 3) % 3]
    agregar('obra_inicio', persona, { nodo: 'T' })
    agregar('nodo_inicio', persona, { nodo: 'T' })
    if (i % 9 === 0) continue
    agregar('nodo_fin', persona, { nodo: 'T' })
    agregar('decision', persona, { nodo: 'T', opcion: rama.clave, ms: 4000 + ((i * 977) % 9000) })
    agregar('nodo_inicio', persona, { nodo: rama.destino })
    if (i % 7 === 0) continue
    agregar('nodo_fin', persona, { nodo: rama.destino })
    agregar('decision', persona, { nodo: rama.destino, opcion: hoja.clave, ms: 3000 + ((i * 613) % 12000) })
    agregar('nodo_inicio', persona, { nodo: hoja.destino })
    agregar('nodo_fin', persona, { nodo: hoja.destino })
    agregar('final', persona, { final: hoja.destino, recorrido: `r${i}` })
    if (i % 3 !== 0) agregar('recomendacion', persona, { final: hoja.destino, recorrido: `r${i}`, recomienda: i % 4 !== 1 })
    if (i % 11 === 0) agregar('compartir', persona, {})
  }
  PROXIMAS.forEach((p, n) => {
    for (let i = 0; i < 14 - n * 3; i++) agregar('aviso', `p${i}`, { obra: p.id, activo: true }, p.id)
  })
  for (let i = 0; i < 8; i++) agregar('instalacion', `p${i}`, {}, null)
  return eventos
}

const MUESTRA = import.meta.env.DEV && location.hash.includes('muestra')

export default function Tablero() {
  const [correo, setCorreo] = useState(MUESTRA ? 'muestra' : correoActual())

  if (!URL_BASE && !MUESTRA) {
    return <Aviso>El tablero no está conectado a la base de datos en esta copia de la app.</Aviso>
  }
  if (!correo) return <Entrada alEntrar={() => setCorreo(correoActual())} />
  return (
    <Panel
      correo={correo}
      alSalir={() => {
        salir()
        setCorreo(null)
      }}
    />
  )
}

function Aviso({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-md px-5 py-20 text-center text-soft">{children}</div>
}

function Entrada({ alEntrar }: { alEntrar: () => void }) {
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'error'>('listo')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEstado('enviando')
    if (await entrar(correo.trim(), clave)) alEntrar()
    else setEstado('error')
  }

  const campo = 'h-12 rounded-xl border border-line-2 bg-surface px-3.5 text-white outline-none focus:border-cian'
  return (
    <form onSubmit={enviar} className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-5">
      <div className="flex items-center gap-2.5">
        <img src="marca/isotipo.png" alt="" className="h-10 w-10 rounded-xl" />
        <h1 className="font-display text-2xl font-extrabold">Tablero de Kine</h1>
      </div>
      <p className="text-sm text-muted">Acceso privado.</p>
      <label className="flex flex-col gap-1.5 text-sm text-soft">
        Correo
        <input type="email" required autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} className={campo} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-soft">
        Contraseña
        <input type="password" required autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} className={campo} />
      </label>
      {estado === 'error' && (
        <p role="alert" className="text-sm text-naranja">
          No se pudo entrar. Revisa el correo y la contraseña.
        </p>
      )}
      <button disabled={estado === 'enviando'} className="h-12 rounded-xl bg-white font-bold text-ground disabled:opacity-60">
        {estado === 'enviando' ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}

function Panel({ correo, alSalir }: { correo: string; alSalir: () => void }) {
  const [dias, setDias] = useState<number | null>(30)
  const [vuelta, setVuelta] = useState(0)
  const [eventos, setEventos] = useState<Evento[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    setError('')
    ;(async () => {
      try {
        if (MUESTRA) return setEventos(eventosDeMuestra())
        const token = await tokenVigente()
        if (!token) return alSalir()
        const desde = dias ? new Date(Date.now() - dias * 86_400_000).toISOString() : null
        const leidos = await leerEventos(token, desde)
        if (vigente) setEventos(leidos)
      } catch (e) {
        if (vigente) setError(e instanceof Error ? e.message : 'No se pudieron leer los datos')
      }
    })()
    return () => {
      vigente = false
    }
    // alSalir cambia en cada render del padre; no debe relanzar la lectura.
  }, [dias, vuelta])

  const resumen = useMemo(() => (eventos ? resumir(eventos, obra.id) : null), [eventos])

  // Baja los eventos del periodo elegido tal como están en la base de datos.
  function descargar() {
    if (!eventos) return
    const archivo = new Blob([JSON.stringify(eventos, null, 2)], { type: 'application/json' })
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(archivo)
    enlace.download = `kine-eventos-${new Date().toISOString().slice(0, 10)}.json`
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  }

  const boton = 'h-10 rounded-lg border px-3.5 text-sm font-bold'
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img src="marca/isotipo.png" alt="" className="h-9 w-9 rounded-xl" />
          <div>
            <h1 className="font-display text-xl font-extrabold">Tablero de Kine</h1>
            <div className="text-[13px] text-muted">
              {obra.titulo} · {correo}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.texto}
              onClick={() => setDias(p.dias)}
              aria-pressed={dias === p.dias}
              className={`${boton} ${dias === p.dias ? 'border-white bg-white text-ground' : 'border-line-2 text-soft'}`}
            >
              {p.texto}
            </button>
          ))}
          <button onClick={() => setVuelta(vuelta + 1)} className={`${boton} border-line-2 text-soft`}>
            Actualizar
          </button>
          <button onClick={descargar} disabled={!eventos} className={`${boton} border-line-2 text-soft disabled:opacity-50`}>
            Descargar JSON
          </button>
          <button onClick={alSalir} className={`${boton} border-line-2 text-soft`}>
            Salir
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-naranja bg-naranja-tint p-4 text-sm">
          {error}
        </p>
      )}
      {!resumen && !error && <p className="text-muted">Cargando datos…</p>}
      {resumen && <Contenido r={resumen} />}
      <Videos />
    </main>
  )
}

function Contenido({ r }: { r: Resumen }) {
  const respuestas = r.recomiendanSi + r.recomiendanNo
  const cifras = [
    { titulo: 'Personas', valor: r.personas, nota: 'dispositivos distintos' },
    { titulo: 'Recorridos iniciados', valor: r.iniciados, nota: 'incluye "explorar otro camino"' },
    { titulo: 'Recorridos completados', valor: r.completados, nota: `${porcentaje(r.completados, r.iniciados)} de los iniciados` },
    {
      titulo: 'Recorridos por persona',
      valor: r.recorridosPorPersona ? r.recorridosPorPersona.toFixed(1) : '—',
      nota: 'entre quienes llegaron a un final',
    },
    { titulo: 'Recomiendan', valor: porcentaje(r.recomiendanSi, respuestas), nota: `${r.recomiendanSi} de ${respuestas} respuestas` },
    { titulo: 'Instalaciones', valor: r.instalaciones, nota: `${r.compartidos} veces compartida` },
  ]
  const nodosConDecision = Object.entries(nodos).filter(([, n]) => n.decision)
  const finales = idsDeFinales(obra)
  const maxFinal = Math.max(1, ...finales.map((f) => r.finales.get(f) ?? 0))
  const maxAviso = Math.max(1, ...PROXIMAS.map((p) => r.avisos.get(p.id) ?? 0))
  const tramos = Object.keys(nodos)

  return (
    <>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cifras.map((c) => (
          <div key={c.titulo} className="flex flex-col gap-1 rounded-2xl bg-surface p-4">
            <div className="text-[13px] text-muted">{c.titulo}</div>
            <div className="font-display text-3xl font-extrabold">{c.valor}</div>
            <div className="text-xs text-dim">{c.nota}</div>
          </div>
        ))}
      </section>

      <Bloque titulo="Qué eligen en cada decisión" nota="Veces que se eligió cada opción y tiempo típico hasta decidir.">
        <div className="grid gap-5 md:grid-cols-2">
          {nodosConDecision.map(([id, nodo]) => {
            const cuenta = r.decisiones.get(id) ?? new Map<string, number>()
            const total = [...cuenta.values()].reduce((a, b) => a + b, 0)
            const segundos = r.segundosDecision.get(id)
            return (
              <div key={id} className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-bold">{nodo.decision!.titulo}</h3>
                  <div className="shrink-0 text-xs text-dim">
                    {total} decisiones{segundos != null && ` · ${segundos.toFixed(0)} s`}
                  </div>
                </div>
                {nodo.decision!.opciones.map((o, i) => {
                  const n = cuenta.get(o.clave) ?? 0
                  return (
                    <Fila
                      key={o.clave}
                      etiqueta={`${o.clave} · ${o.titulo}`}
                      valor={`${n} · ${porcentaje(n, total)}`}
                      ancho={total ? n / total : 0}
                      color={COLOR[TONOS[i % 3]]}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </Bloque>

      <Bloque titulo="Finales alcanzados y recomendación" nota="Cuántas veces se llegó a cada final y cuántos de quienes respondieron lo recomiendan.">
        <div className="flex flex-col gap-2.5">
          {finales.map((f) => {
            const n = r.finales.get(f) ?? 0
            const rec = r.recomendacionPorFinal.get(f) ?? { si: 0, no: 0 }
            return (
              <Fila
                key={f}
                etiqueta={nodos[f]?.final?.titulo ?? f}
                valor={`${n} veces · recomiendan ${rec.si} de ${rec.si + rec.no}`}
                ancho={n / maxFinal}
                color={COLOR[tonoDeFinal(f)]}
              />
            )
          })}
        </div>
      </Bloque>

      <div className="grid gap-6 md:grid-cols-2">
        <Bloque titulo="Dónde se quedan" nota="De quienes empezaron cada tramo, cuántos lo vieron completo.">
          <div className="flex flex-col gap-2.5">
            {tramos.map((id) => {
              const inicio = r.nodosIniciados.get(id) ?? 0
              const fin = r.nodosTerminados.get(id) ?? 0
              return (
                <Fila
                  key={id}
                  etiqueta={etiquetaDeTramo(id)}
                  valor={`${fin} de ${inicio} · ${porcentaje(fin, inicio)}`}
                  ancho={inicio ? fin / inicio : 0}
                  color="bg-g-neutro"
                />
              )
            })}
          </div>
        </Bloque>

        <Bloque titulo="Interés en los próximos estrenos" nota='Personas con el aviso "Avísame" activo.'>
          <div className="flex flex-col gap-2.5">
            {PROXIMAS.map((p) => {
              const n = r.avisos.get(p.id) ?? 0
              return <Fila key={p.id} etiqueta={p.titulo} valor={`${n}`} ancho={n / maxAviso} color="bg-g-neutro" />
            })}
          </div>
        </Bloque>
      </div>
    </>
  )
}

function Bloque({ titulo, nota, children }: { titulo: string; nota: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-bold">{titulo}</h2>
        <p className="text-[13px] text-muted">{nota}</p>
      </div>
      {children}
    </section>
  )
}

// Barra horizontal con su etiqueta y su valor escritos: el color nunca es el único dato.
function Fila({ etiqueta, valor, ancho, color }: { etiqueta: string; valor: string; ancho: number; color: string }) {
  return (
    <div className="flex flex-col gap-1" title={`${etiqueta}: ${valor}`}>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="min-w-0 truncate text-soft">{etiqueta}</span>
        <span className="shrink-0 text-muted tabular-nums">{valor}</span>
      </div>
      <div className="h-2 rounded-full bg-ground">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(ancho * 100, ancho > 0 ? 1.5 : 0)}%` }} />
      </div>
    </div>
  )
}

interface EstadoVideo {
  nombre: string
  estado: 'revisando' | 'falta' | 'provisional' | 'listo'
  megas?: number
}

// Los clips provisionales pesan unos pocos KB; un video real, varios MB.
const LIMITE_PROVISIONAL = 300_000

function Videos() {
  const archivos = Object.entries(nodos).flatMap(([id, n]) => [
    { nombre: `${id}.mp4`, url: urlVideo(obra.id, id) },
    ...(n.decision ? [{ nombre: `${id}-umbral.mp4`, url: urlBucle(obra.id, id) }] : []),
  ])
  const [lista, setLista] = useState<EstadoVideo[]>(archivos.map((a) => ({ nombre: a.nombre, estado: 'revisando' })))

  useEffect(() => {
    let vigente = true
    void Promise.all(
      archivos.map(async (a): Promise<EstadoVideo> => {
        try {
          const r = await fetch(a.url, { method: 'HEAD', cache: 'no-store' })
          if (!r.ok || !(r.headers.get('content-type') ?? '').startsWith('video')) return { nombre: a.nombre, estado: 'falta' }
          const bytes = Number(r.headers.get('content-length') ?? 0)
          return { nombre: a.nombre, estado: bytes < LIMITE_PROVISIONAL ? 'provisional' : 'listo', megas: bytes / 1_048_576 }
        } catch {
          return { nombre: a.nombre, estado: 'falta' }
        }
      }),
    ).then((resultado) => vigente && setLista(resultado))
    return () => {
      vigente = false
    }
    // La lista de archivos es fija: se revisa una sola vez al abrir.
  }, [])

  const TEXTO = { revisando: 'Revisando…', falta: 'Falta', provisional: 'Provisional', listo: 'Listo' }
  const TINTA = { revisando: 'text-dim', falta: 'text-naranja', provisional: 'text-muted', listo: 'text-cian' }
  const listos = lista.filter((v) => v.estado === 'listo').length

  return (
    <Bloque titulo="Videos de la obra" nota={`${listos} de ${lista.length} definitivos subidos.`}>
      <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2 md:grid-cols-3">
        {lista.map((v) => (
          <div key={v.nombre} className="flex items-baseline justify-between gap-3 border-b border-line py-1.5">
            <span className="font-mono text-soft">{v.nombre}</span>
            <span className={`shrink-0 font-bold ${TINTA[v.estado]}`}>
              {TEXTO[v.estado]}
              {v.megas != null && v.estado === 'listo' && ` · ${v.megas.toFixed(1)} MB`}
            </span>
          </div>
        ))}
      </div>
    </Bloque>
  )
}
