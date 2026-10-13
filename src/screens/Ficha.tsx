import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Icono } from '../components/Icono'
import { Afiche, BotonAviso } from '../components/Piezas'
import { idsDeFinales, obraPorId } from '../data/obras'
import { compartir } from '../lib/compartir'
import { urlCartel, urlPortada } from '../lib/media'
import { finalesDescubiertos, useEstado } from '../lib/store'

const RECORRIDO = [
  { texto: 'Empieza la historia', fondo: 'bg-white', marca: <Icono nombre="play" tam={16} /> },
  { texto: 'Primera decisión', fondo: 'bg-cian', marca: '1' },
  { texto: 'Segunda decisión', fondo: 'bg-violeta', marca: '2' },
  { texto: 'Uno de los finales', fondo: 'bg-naranja', marca: <Icono nombre="check" tam={18} /> },
]

export default function Ficha() {
  const { obraId = '' } = useParams()
  const estado = useEstado()
  const navegar = useNavigate()
  const [afiche, setAfiche] = useState(false)
  const obra = obraPorId(obraId)
  if (!obra) return <Navigate to="/" replace />

  const disponible = obra.estado === 'disponible'
  const total = idsDeFinales(obra).length
  const descubiertos = finalesDescubiertos(estado, obra.id).size
  const datos = [...obra.generos, ...(disponible ? [`${obra.minutos} min por recorrido`, `${total} finales`] : [])]

  return (
    <main className="flex flex-col pb-8">
      {/* Un próximo estreno muestra su afiche entero; una obra disponible, la imagen recortada. */}
      <Afiche
        src={disponible ? urlCartel(obra.id) : urlPortada(obra.id)}
        tono={obra.tono}
        titulo=""
        className={disponible ? 'h-[420px] shrink-0' : 'aspect-2/3 shrink-0'}
      >
        {disponible && <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-ground to-transparent" />}
        <button onClick={() => setAfiche(true)} aria-label="Ver el afiche completo" className="absolute inset-0" />
        <div className="pointer-events-none absolute right-4 bottom-4 flex h-9 items-center gap-1.5 rounded-full bg-ground/70 px-3 text-[13px] font-bold">
          <Icono nombre="ampliar" tam={16} />
          Ver afiche
        </div>
        <button
          onClick={() => (window.history.length > 1 ? navegar(-1) : navegar('/'))}
          aria-label="Volver"
          className="absolute top-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-ground/70"
        >
          <Icono nombre="atras" tam={22} />
        </button>
        <button
          onClick={() =>
            compartir(obra, obra.compartir?.texto_obra ?? `Mira ${obra.titulo} en Kine: tú decides cómo termina.`)
          }
          aria-label="Compartir esta obra"
          className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-ground/70"
        >
          <Icono nombre="compartir" />
        </button>
      </Afiche>

      <div className="flex flex-col gap-[22px] px-5 pt-1">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl leading-[1.05] font-extrabold">{obra.titulo}</h1>
          <div className="flex flex-wrap gap-2">
            {datos.map((d) => (
              <div key={d} className="rounded-lg bg-surface-2 px-2.5 py-1.5 text-[13px] text-soft">
                {d}
              </div>
            ))}
          </div>
        </div>

        {disponible ? (
          <div className="flex flex-col gap-2.5">
            <Link
              to={`/ver/${obra.id}`}
              className="flex h-14 items-center justify-center gap-2 rounded-[14px] bg-white text-[17px] font-bold text-ground"
            >
              <Icono nombre="play" tam={22} />
              Comenzar
            </Link>
            {descubiertos > 0 && (
              <Link
                to="/mi-kine"
                className="flex h-12 items-center justify-center rounded-[14px] border border-outline text-[15px] font-bold"
              >
                Ver mis finales descubiertos ({descubiertos} de {total})
              </Link>
            )}
          </div>
        ) : (
          <BotonAviso obra={obra} className="h-14 text-base" />
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-[17px] font-bold">Sinopsis</h2>
          <p className="text-[15px] leading-normal text-soft">{obra.sinopsis}</p>
        </section>

        {disponible && (
          <section className="flex flex-col gap-3.5">
            <h2 className="font-display text-[17px] font-bold">Así es un recorrido</h2>
            <div className="flex items-start">
              {RECORRIDO.map((paso, i) => (
                <div key={paso.texto} className="contents">
                  {i > 0 && <div className="mt-[17px] h-0.5 flex-1 bg-ring-off" />}
                  <div className="flex w-[70px] flex-col items-center gap-2 text-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold text-ground ${paso.fondo}`}>
                      {paso.marca}
                    </div>
                    <div className="text-xs leading-tight text-muted">{paso.texto}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm leading-snug text-muted">
              En cada decisión eliges entre tres caminos. No hay cronómetro: el video espera.
            </p>
          </section>
        )}

        {obra.creditos && (
          <section className="flex flex-col gap-1.5 rounded-2xl bg-surface p-4">
            <div className="text-xs tracking-wider text-muted uppercase">Créditos</div>
            <div className="text-[15px] font-bold">{obra.creditos}</div>
          </section>
        )}
      </div>

      {afiche && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Afiche de ${obra.titulo}`}
          onClick={() => setAfiche(false)}
          className="fixed inset-0 z-50 flex animate-aparecer items-center justify-center bg-ground"
        >
          <img src={urlCartel(obra.id)} alt={`Afiche de ${obra.titulo}`} className="h-full w-full object-contain" />
          <button
            aria-label="Cerrar el afiche"
            className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-ground/70"
          >
            <Icono nombre="cerrar" />
          </button>
        </div>
      )}
    </main>
  )
}
