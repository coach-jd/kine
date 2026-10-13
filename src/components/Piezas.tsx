import { useState, type ReactNode } from 'react'
import { TONO, TONOS, type Obra, type Tono } from '../data/obras'
import { activarAviso, quitarAviso, useEstado } from '../lib/store'
import { Icono } from './Icono'

// Imagen con sustituto: si el afiche aún no se ha subido, queda un bloque del
// color de la obra con su título.
export function Afiche({
  src,
  tono,
  titulo,
  className = '',
  children,
}: {
  src: string
  tono: Tono
  titulo: string
  className?: string
  children?: ReactNode
}) {
  const [falta, setFalta] = useState(false)
  return (
    <div className={`relative overflow-hidden ${TONO[tono].tinte} ${className}`}>
      {falta ? (
        <div className="flex h-full w-full items-center justify-center p-3 text-center font-display text-sm font-bold text-muted">
          {titulo}
        </div>
      ) : (
        <img src={src} alt={titulo && `Afiche de ${titulo}`} onError={() => setFalta(true)} className="h-full w-full object-cover object-top" />
      )}
      {children}
    </div>
  )
}

// Los finales de una obra como puntos, agrupados y coloreados por rama.
export function Puntos({ obra, descubiertos }: { obra: Obra; descubiertos: Set<string> }) {
  const ramas = obra.nodos?.[obra.inicio ?? '']?.decision?.opciones ?? []
  return (
    <div className="flex gap-2.5" role="img" aria-label={`${descubiertos.size} finales descubiertos`}>
      {ramas.map((rama, i) => (
        <div key={rama.clave} className="flex gap-1">
          {(obra.nodos?.[rama.destino]?.decision?.opciones ?? []).map((o) => (
            <div
              key={o.clave}
              className={`h-3 w-3 rounded-full ${
                descubiertos.has(o.destino) ? TONO[TONOS[i % 3]].fondo : 'border-2 border-ring-off'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

const ES_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Para avisar de un estreno hace falta un correo: se pide al activar el aviso y
// se recuerda para el siguiente, por si la persona quiere usar el mismo.
export function BotonAviso({ obra, className = '' }: { obra: Obra; className?: string }) {
  const estado = useEstado()
  const activo = estado.avisos.includes(obra.id)
  const [pidiendo, setPidiendo] = useState(false)
  const [correo, setCorreo] = useState('')
  const valido = ES_CORREO.test(correo.trim())

  return (
    <>
      <button
        onClick={() => {
          if (activo) return quitarAviso(obra.id)
          setCorreo(estado.correo)
          setPidiendo(true)
        }}
        aria-pressed={activo}
        className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold ${
          activo ? 'border-cian bg-cian-tint' : 'border-outline'
        } ${className}`}
      >
        <Icono nombre={activo ? 'check' : 'campana'} tam={16} />
        {activo ? 'Te avisaremos' : 'Avísame'}
      </button>

      {pidiendo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Aviso de estreno de ${obra.titulo}`}
          className="fixed inset-0 z-50 flex animate-aparecer items-end justify-center bg-ground/80"
          onClick={() => setPidiendo(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              if (!valido) return
              activarAviso(obra.id, correo.trim().toLowerCase())
              setPidiendo(false)
            }}
            className="flex w-full max-w-[430px] flex-col gap-4 rounded-t-[28px] border-t border-line bg-surface px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-left"
          >
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-xl leading-tight font-extrabold">¿A qué correo te avisamos?</h2>
              <p className="text-sm leading-snug text-soft">
                Te escribiremos cuando se estrene <span className="font-bold">{obra.titulo}</span>.
              </p>
            </div>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              required
              maxLength={120}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
              aria-label="Tu correo"
              className="h-13 rounded-[14px] border border-outline bg-ground px-4 text-base outline-none placeholder:text-dim focus:border-cian"
            />
            <p className="-mt-1 text-[13px] leading-snug text-muted">
              Solo usaremos tu correo para avisarte de los estrenos que pidas. Puedes quitar el aviso cuando quieras.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPidiendo(false)}
                className="flex h-13 flex-1 items-center justify-center rounded-[14px] border border-outline font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!valido}
                className="flex h-13 flex-1 items-center justify-center gap-2 rounded-[14px] bg-white font-bold text-ground disabled:opacity-40"
              >
                <Icono nombre="campana" tam={18} />
                Avísame
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export function Insignia({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 text-xs font-bold tracking-wider uppercase ${className}`}>{children}</div>
  )
}
