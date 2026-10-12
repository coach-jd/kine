import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Barra } from '../components/Barra'
import { Icono } from '../components/Icono'
import { Afiche, BotonAviso, Insignia, Puntos } from '../components/Piezas'
import { ESTRENO, PROXIMAS, idsDeFinales } from '../data/obras'
import { urlCartel, urlPortada } from '../lib/media'
import { finalesDescubiertos, useEstado } from '../lib/store'
import { registrar } from '../lib/tracker'

interface AvisoInstalacion extends Event {
  prompt: () => Promise<void>
}

// El navegador ofrece instalar la app solo cuando él lo decide; hasta entonces
// el botón no se muestra.
function useInstalar() {
  const [aviso, setAviso] = useState<AvisoInstalacion | null>(null)
  useEffect(() => {
    const guardar = (e: Event) => {
      e.preventDefault()
      setAviso(e as AvisoInstalacion)
    }
    window.addEventListener('beforeinstallprompt', guardar)
    return () => window.removeEventListener('beforeinstallprompt', guardar)
  }, [])
  if (!aviso) return null
  return () => {
    registrar('instalacion')
    void aviso.prompt()
    setAviso(null)
  }
}

const PASOS = [
  { titulo: 'Mira', texto: 'La historia avanza en video vertical.', fondo: 'bg-cian' },
  { titulo: 'Decide', texto: 'Cada decisión abre tres caminos.', fondo: 'bg-violeta' },
  { titulo: 'Descubre', texto: 'Vuelve y prueba otro final.', fondo: 'bg-naranja' },
]

export default function Inicio() {
  const estado = useEstado()
  const instalar = useInstalar()
  const obra = ESTRENO
  const total = idsDeFinales(obra).length
  const descubiertos = finalesDescubiertos(estado, obra.id)

  return (
    <main className="flex flex-col gap-7 px-4 pt-4 pb-32">
      <header className="flex h-11 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="marca/isotipo.png" alt="" className="h-10 w-10 rounded-xl" />
          <div className="font-display text-[22px] font-extrabold tracking-[3px]">KINE</div>
        </div>
        {instalar && (
          <button
            onClick={instalar}
            aria-label="Instalar Kine"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line-2 bg-surface"
          >
            <Icono nombre="descargar" />
          </button>
        )}
      </header>

      <Afiche
        src={urlCartel(obra.id)}
        tono={obra.tono}
        titulo=""
        className="h-[500px] rounded-3xl border border-line"
      >
        <Insignia className="absolute top-4 left-4 bg-cian text-ground">Estreno</Insignia>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 bg-linear-to-t from-ground from-45% to-transparent px-5 pt-24 pb-5">
          <div className="text-[13px] tracking-wide text-muted">{obra.generos.join(' · ')}</div>
          <h1 className="font-display text-[40px] leading-[1.05] font-extrabold">{obra.titulo}</h1>
          <p className="text-[15px] leading-snug text-soft">
            Tú decides cómo termina. {total} finales posibles, {obra.minutos} minutos por recorrido.
          </p>
          <div className="mt-1.5 flex gap-2.5">
            <Link
              to={`/obra/${obra.id}`}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[14px] bg-white font-bold text-ground"
            >
              <Icono nombre="play" />
              Ver ahora
            </Link>
            <Link
              to="/mi-kine"
              className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] border border-outline bg-surface/80 font-bold"
            >
              Mi recorrido
            </Link>
          </div>
        </div>
      </Afiche>

      {descubiertos.size > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[19px] font-bold">Continúa descubriendo</h2>
          <Link to="/mi-kine" className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5">
            <Afiche src={urlPortada(obra.id)} tono={obra.tono} titulo="" className="h-[84px] w-14 shrink-0 rounded-[10px]" />
            <div className="flex min-w-0 flex-col gap-2">
              <div className="font-bold">{obra.titulo}</div>
              <div className="text-sm text-muted">
                Has descubierto {descubiertos.size} de {total} finales
              </div>
              <Puntos obra={obra} descubiertos={descubiertos} />
            </div>
          </Link>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[19px] font-bold">Próximos estrenos</h2>
          <Link to="/proximamente" className="text-sm text-muted">
            Ver los {PROXIMAS.length}
          </Link>
        </div>
        <div className="sin-barra -mr-4 flex gap-3 overflow-x-auto pr-4">
          {PROXIMAS.map((p) => (
            <article key={p.id} className="flex w-[132px] shrink-0 flex-col gap-2">
              <Afiche src={urlPortada(p.id)} tono={p.tono} titulo={p.titulo} className="h-[198px] rounded-[14px] border border-line">
                <div className="absolute top-2 left-2 rounded-md bg-ground px-2 py-1 text-[11px] font-bold">Próximamente</div>
              </Afiche>
              <div className="text-[15px] font-bold">{p.titulo}</div>
              <div className="-mt-1 text-[13px] text-muted">{p.generos.join(' · ')}</div>
              <BotonAviso obra={p} />
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[19px] font-bold">Cómo se ve un Polimetraje</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {PASOS.map((paso, i) => (
            <div key={paso.titulo} className="flex flex-col gap-2 rounded-2xl bg-surface px-3 py-3.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-ground ${paso.fondo}`}>
                {i + 1}
              </div>
              <div className="text-[15px] font-bold">{paso.titulo}</div>
              <div className="text-[13px] leading-snug text-muted">{paso.texto}</div>
            </div>
          ))}
        </div>
      </section>

      <Barra />
    </main>
  )
}
