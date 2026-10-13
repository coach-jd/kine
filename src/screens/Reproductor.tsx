import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Icono } from '../components/Icono'
import { TONO, TONOS, obraPorId, type Obra, type Opcion } from '../data/obras'
import { urlBucle, urlVideo } from '../lib/media'
import { registrarFinal } from '../lib/store'
import { registrar } from '../lib/tracker'

// video: se reproduce el clip del nodo. decision: el bucle espera la elección.
// falta: el clip aún no se ha subido y una tarjeta lo sustituye.
type Fase = 'video' | 'decision' | 'falta'

// 'T-A2' -> ['A', '2']: las claves elegidas hasta llegar al nodo.
const caminoDe = (nodo: string) => nodo.replace(/^T-?/, '').split('').filter(Boolean)

// Las tres partes duran 3, 6 y 3 minutos: la barra respeta esa proporción.
const PESOS = ['flex-1', 'flex-2', 'flex-1']

export default function Reproductor() {
  const { obraId = '' } = useParams()
  const [parametros] = useSearchParams()
  const obra = obraPorId(obraId)
  if (!obra?.nodos || !obra.inicio) return <Navigate to="/" replace />

  const pedido = parametros.get('nodo') ?? ''
  const nodoInicial = obra.nodos[pedido] ? pedido : obra.inicio
  const enDecision = parametros.get('fase') === 'decision' && !!obra.nodos[nodoInicial].decision
  return <Escena obra={obra} nodoInicial={nodoInicial} enDecision={enDecision} />
}

function Escena({ obra, nodoInicial, enDecision }: { obra: Obra; nodoInicial: string; enDecision: boolean }) {
  const navegar = useNavigate()
  const [nodoId, setNodoId] = useState(nodoInicial)
  const [fase, setFase] = useState<Fase>(enDecision ? 'decision' : 'video')
  const [silencio, setSilencio] = useState(false)
  const [pausado, setPausado] = useState(false)
  const [avance, setAvance] = useState(0)
  const [resta, setResta] = useState(Infinity)
  const video = useRef<HTMLVideoElement>(null)
  const inicioDecision = useRef(Date.now())

  const nodo = obra.nodos![nodoId]
  const camino = caminoDe(nodoId)
  const parte = camino.length
  const src = fase === 'decision' ? urlBucle(obra.id, nodoId) : urlVideo(obra.id, nodoId)

  useEffect(() => {
    registrar('obra_inicio', { obra: obra.id, nodo: nodoInicial })
  }, [obra.id, nodoInicial])

  useEffect(() => {
    if (fase === 'video') registrar('nodo_inicio', { obra: obra.id, nodo: nodoId })
  }, [obra.id, nodoId, fase])

  useEffect(() => {
    const v = video.current
    if (!v || fase === 'falta') return
    setPausado(false)
    // Si el navegador no permite sonido sin un toque previo, arranca en silencio.
    v.play().catch(() => {
      v.muted = true
      setSilencio(true)
      v.play().catch(() => {})
    })
  }, [src, fase])

  function terminarNodo() {
    registrar('nodo_fin', { obra: obra.id, nodo: nodoId })
    if (nodo.decision) {
      inicioDecision.current = Date.now()
      setFase('decision')
    } else {
      const recorrido = registrarFinal(obra.id, camino, nodoId)
      navegar(`/final/${obra.id}/${recorrido}`, { replace: true })
    }
  }

  function elegir(opcion: Opcion) {
    registrar('decision', {
      obra: obra.id,
      nodo: nodoId,
      opcion: opcion.clave,
      destino: opcion.destino,
      ms: Date.now() - inicioDecision.current,
    })
    setAvance(0)
    setResta(Infinity)
    setNodoId(opcion.destino)
    setFase('video')
  }

  function alternarPausa() {
    const v = video.current
    if (!v || fase !== 'video') return
    if (v.paused) {
      void v.play()
      setPausado(false)
    } else {
      v.pause()
      setPausado(true)
    }
  }

  function alternarSonido() {
    const v = video.current
    if (v) v.muted = !silencio
    setSilencio(!silencio)
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-video">
      {fase !== 'falta' && (
        <video
          ref={video}
          src={src}
          loop={fase === 'decision'}
          muted={silencio}
          playsInline
          onEnded={terminarNodo}
          onError={() => fase === 'video' && setFase('falta')}
          onTimeUpdate={(e) => {
            const v = e.currentTarget
            if (fase !== 'video' || !v.duration) return
            setAvance(v.currentTime / v.duration)
            setResta(v.duration - v.currentTime)
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Precarga lo que viene para que el cambio de clip no espere a la red. */}
      {fase === 'video' && nodo.decision && <video src={urlBucle(obra.id, nodoId)} preload="auto" muted className="hidden" />}
      {fase === 'decision' &&
        nodo.decision?.opciones.map((o) => (
          <video key={o.destino} src={urlVideo(obra.id, o.destino)} preload="auto" muted className="hidden" />
        ))}

      <button
        onClick={alternarPausa}
        aria-label={pausado ? 'Reanudar' : 'Pausar'}
        disabled={fase !== 'video'}
        className="absolute inset-0 flex items-center justify-center"
      >
        {pausado && (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ground/70">
            <Icono nombre="play" tam={36} />
          </span>
        )}
      </button>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-3.5 bg-linear-to-b from-ground/90 to-transparent px-4 pt-4 pb-12">
        <div className="flex gap-1.5" role="img" aria-label={`Parte ${parte + 1} de 3`}>
          {PESOS.map((peso, i) => {
            const lleno = i < parte || (i === parte && fase !== 'video')
            return (
              <div key={i} className={`h-1 overflow-hidden rounded-full bg-ring-off ${peso}`}>
                <div
                  className="h-full bg-white"
                  style={{ width: lleno ? '100%' : i === parte ? `${avance * 100}%` : '0%' }}
                />
              </div>
            )
          })}
        </div>
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={() => navegar(`/obra/${obra.id}`)}
            aria-label="Salir del reproductor"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ground/60"
          >
            <Icono nombre="atras" tam={22} />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="font-display font-bold">{obra.titulo}</div>
            <div className="text-[13px] text-soft">Parte {parte + 1} de 3</div>
          </div>
          <button
            onClick={alternarSonido}
            aria-label={silencio ? 'Activar sonido' : 'Silenciar'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ground/60"
          >
            <Icono nombre={silencio ? 'silencio' : 'sonido'} />
          </button>
        </div>
      </div>

      {fase === 'video' && nodo.decision && resta < 10 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex animate-aparecer justify-center bg-linear-to-t from-ground/90 to-transparent px-5 pt-16 pb-8">
          <div className="flex h-12 items-center gap-2.5 rounded-full border border-outline bg-surface-2/90 px-[18px] text-[15px] font-bold">
            <span className="flex gap-1">
              {TONOS.map((t) => (
                <span key={t} className={`h-2.5 w-2.5 rounded-full ${TONO[t].fondo}`} />
              ))}
            </span>
            Se acerca tu decisión
          </div>
        </div>
      )}

      {fase === 'falta' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center">
          <div className="font-display text-2xl font-extrabold">Escena en producción</div>
          <p className="text-[15px] leading-snug text-soft">
            Este tramo de la historia todavía no está disponible. Puedes seguir con tu recorrido.
          </p>
          <button onClick={terminarNodo} className="flex h-14 items-center justify-center rounded-[14px] bg-white px-8 text-[17px] font-bold text-ground">
            Continuar
          </button>
        </div>
      )}

      {fase === 'decision' && nodo.decision && (
        // Sin panel opaco: el bucle del Umbral debe seguir viéndose detrás de la decisión.
        <section className="absolute inset-x-0 bottom-0 flex animate-subir flex-col gap-3 bg-linear-to-t from-ground/95 from-50% via-ground/75 via-80% to-transparent px-4 pt-14 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-1 px-1 [text-shadow:0_1px_8px_rgb(0_0_0/0.85)]">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[1.5px] text-muted uppercase">
              <span className="flex gap-1">
                {TONOS.map((t) => (
                  <span key={t} className={`h-2 w-2 rounded-full ${TONO[t].fondo}`} />
                ))}
              </span>
              Tu decisión
            </div>
            <h1 className="font-display text-xl leading-tight font-extrabold">{nodo.decision.titulo}</h1>
            <p className="text-[13px] leading-snug text-soft">{nodo.decision.contexto}</p>
          </div>
          <div className="flex flex-col gap-2">
            {nodo.decision.opciones.map((opcion, i) => (
              <button
                key={opcion.clave}
                onClick={() => elegir(opcion)}
                className="flex items-center gap-3 rounded-2xl border border-line-2 bg-surface/80 px-3 py-2 text-left backdrop-blur-sm active:bg-surface-2"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-base font-extrabold text-ground ${TONO[TONOS[i % 3]].fondo}`}
                >
                  {opcion.clave}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15px] leading-tight font-bold">{opcion.titulo}</span>
                  <span className="text-[13px] leading-snug text-muted">{opcion.descripcion}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="text-center text-xs text-muted">Sin cronómetro. El video espera tu decisión.</div>
        </section>
      )}
    </main>
  )
}
