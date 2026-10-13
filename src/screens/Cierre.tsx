import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Icono, type NombreIcono } from '../components/Icono'
import { Insignia } from '../components/Piezas'
import { TONO, idsDeFinales, obraPorId, pasosDe } from '../data/obras'
import { compartir } from '../lib/compartir'
import { finalesDescubiertos, recomendar, useEstado } from '../lib/store'

const RESPUESTAS: { valor: boolean; texto: string; icono: NombreIcono }[] = [
  { valor: true, texto: 'Sí', icono: 'si' },
  { valor: false, texto: 'No', icono: 'no' },
]

export default function Cierre() {
  const { obraId = '', recorridoId = '' } = useParams()
  const estado = useEstado()
  const [copiado, setCopiado] = useState(false)
  const obra = obraPorId(obraId)
  const recorrido = estado.recorridos.find((r) => r.id === recorridoId)
  const final = recorrido && obra?.nodos?.[recorrido.final]?.final
  if (!obra || !recorrido || !final) return <Navigate to="/" replace />

  const total = idsDeFinales(obra).length
  const descubiertos = finalesDescubiertos(estado, obra.id).size
  const pasos = pasosDe(obra, recorrido.camino)
  const ultimaDecision = pasos.at(-1)?.nodo ?? obra.inicio

  return (
    <main className="flex min-h-dvh animate-aparecer flex-col gap-5 px-5 pt-4 pb-6">
      <header className="flex h-11 items-center justify-between">
        <div className="font-display font-bold">{obra.titulo}</div>
        <Link
          to="/"
          aria-label="Cerrar y volver al inicio"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line-2 bg-surface"
        >
          <Icono nombre="cerrar" />
        </Link>
      </header>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <Insignia className="bg-cian text-ground">Final descubierto</Insignia>
          <div className="text-sm text-muted">
            Llevas {descubiertos} de {total}
          </div>
        </div>
        <h1 className="font-display text-3xl leading-[1.1] font-extrabold">{final.titulo}</h1>
        <p className="text-[15px] leading-snug text-soft">{final.resumen}</p>
      </div>

      <section className="flex flex-col gap-3 rounded-[18px] bg-surface p-4">
        <div className="text-xs font-bold tracking-[1.5px] text-muted uppercase">Tu camino</div>
        {pasos.map((paso, i) => (
          <div key={paso.nodo} className="contents">
            {i > 0 && <div className="-my-2 ml-[15px] h-3 w-0.5 bg-ring-off" />}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold text-ground ${TONO[paso.tono].fondo}`}
              >
                {paso.opcion.clave}
              </div>
              <div className="text-[15px]">{paso.opcion.titulo}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3.5 rounded-[18px] border border-line-2 bg-surface-2 p-4">
        <h2 className="font-display text-lg leading-tight font-bold">¿Recomendarías este recorrido?</h2>
        <div className="flex gap-2.5">
          {RESPUESTAS.map((r) => (
            <button
              key={r.texto}
              onClick={() => recomendar(recorrido.id, r.valor)}
              aria-pressed={recorrido.recomienda === r.valor}
              className={`flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[14px] border font-bold ${
                recorrido.recomienda === r.valor ? 'border-white bg-white text-ground' : 'border-outline bg-ground'
              }`}
            >
              <Icono nombre={r.icono} />
              {r.texto}
            </button>
          ))}
        </div>
        {recorrido.recomienda !== null && <div className="text-sm text-muted">Gracias. Tu respuesta quedó guardada.</div>}
      </section>

      <div className="mt-auto flex flex-col gap-2.5">
        <Link
          to={`/ver/${obra.id}?nodo=${ultimaDecision}&fase=decision`}
          className="flex h-14 items-center justify-center gap-2 rounded-[14px] bg-white text-[17px] font-bold text-ground"
        >
          <Icono nombre="repetir" />
          Explorar otro camino
        </Link>
        <div className="text-center text-[13px] text-muted">Vuelves a tu última decisión, sin repetir el inicio.</div>
        <div className="mt-1 flex gap-2.5">
          <button
            onClick={async () => {
              const resultado = await compartir(
                obra,
                `Descubrí uno de los ${total} finales de ${obra.titulo} en Kine. ¿Cuál te toca a ti?`,
                recorrido.final,
              )
              setCopiado(resultado === 'copiado')
            }}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] border border-outline text-[15px] font-bold"
          >
            <Icono nombre={copiado ? 'check' : 'compartir'} tam={18} />
            {copiado ? 'Enlace copiado' : 'Compartir'}
          </button>
          <Link
            to="/mi-kine"
            className="flex h-12 flex-1 items-center justify-center rounded-[14px] border border-outline text-[15px] font-bold"
          >
            Ver mis finales
          </Link>
        </div>
      </div>
    </main>
  )
}
