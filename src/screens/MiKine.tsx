import { Link } from 'react-router-dom'
import { Barra } from '../components/Barra'
import { Icono } from '../components/Icono'
import { Afiche } from '../components/Piezas'
import { ESTRENO, PROXIMAS, TONO, TONOS, idsDeFinales } from '../data/obras'
import { urlPortada } from '../lib/media'
import { finalesDescubiertos, useEstado } from '../lib/store'

export default function MiKine() {
  const estado = useEstado()
  const obra = ESTRENO
  const total = idsDeFinales(obra).length
  const descubiertos = finalesDescubiertos(estado, obra.id)
  const ramas = obra.nodos?.[obra.inicio ?? '']?.decision?.opciones ?? []
  const avisos = PROXIMAS.filter((p) => estado.avisos.includes(p.id))

  return (
    <main className="flex flex-col gap-6 px-4 pt-5 pb-32">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-[28px] font-extrabold">Mi Kine</h1>
        <p className="text-sm text-muted">Tus recorridos se guardan en este dispositivo.</p>
      </header>

      <Link to={`/obra/${obra.id}`} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5">
        <Afiche src={urlPortada(obra.id)} tono={obra.tono} titulo="" className="h-[66px] w-11 shrink-0 rounded-lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="font-bold">{obra.titulo}</div>
          <div className="text-sm text-muted">
            {descubiertos.size} de {total} finales descubiertos
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-white" style={{ width: `${(descubiertos.size / total) * 100}%` }} />
          </div>
        </div>
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[19px] font-bold">Mapa de finales</h2>
        <div className="flex flex-col items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ground">
            <Icono nombre="play" tam={16} />
          </div>
          <div className="h-4 w-0.5 bg-ring-off" />
          <div className="h-0.5 w-[67%] bg-ring-off" />
        </div>
        <div className="-mt-3 grid grid-cols-3 gap-2.5">
          {ramas.map((rama, i) => {
            const tono = TONO[TONOS[i % 3]]
            return (
              <div key={rama.clave} className="flex flex-col items-center gap-2">
                <div className="-mb-2 h-3 w-0.5 bg-ring-off" />
                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-display font-extrabold text-ground ${tono.fondo}`}>
                  {rama.clave}
                </div>
                <div className="text-[13px] font-bold">{rama.corto ?? rama.titulo}</div>
                {(obra.nodos?.[rama.destino]?.decision?.opciones ?? []).map((o) =>
                  descubiertos.has(o.destino) ? (
                    <div key={o.destino} className={`flex h-[72px] flex-col justify-between self-stretch rounded-[14px] border p-2.5 ${tono.tinte} ${tono.borde}`}>
                      <Icono nombre="check" tam={16} className={tono.texto} />
                      <div className="text-[13px] font-bold">{obra.nodos?.[o.destino]?.final?.titulo}</div>
                    </div>
                  ) : (
                    <div key={o.destino} className="flex h-[72px] flex-col justify-between self-stretch rounded-[14px] border border-dashed border-outline p-2.5 text-muted">
                      <Icono nombre="candado" tam={16} />
                      <div className="text-[13px]">Por descubrir</div>
                    </div>
                  ),
                )}
              </div>
            )
          })}
        </div>
        {descubiertos.size === 0 && (
          <Link
            to={`/ver/${obra.id}`}
            className="mt-2 flex h-14 items-center justify-center gap-2 rounded-[14px] bg-white text-[17px] font-bold text-ground"
          >
            <Icono nombre="play" tam={22} />
            Descubrir mi primer final
          </Link>
        )}
      </section>

      {avisos.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[19px] font-bold">Mis avisos</h2>
          {avisos.map((p) => (
            <div key={p.id} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cian-tint text-cian">
                <Icono nombre="campana" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="text-[15px] font-bold">{p.titulo}</div>
                <div className="text-sm text-muted">
                  Te avisaremos{estado.correo ? ` a ${estado.correo}` : ''} cuando se estrene.
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <Barra />
    </main>
  )
}
