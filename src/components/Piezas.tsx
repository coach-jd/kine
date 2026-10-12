import { useState, type ReactNode } from 'react'
import { TONO, TONOS, type Obra, type Tono } from '../data/obras'
import { alternarAviso, useEstado } from '../lib/store'
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
        <img src={src} alt={titulo && `Afiche de ${titulo}`} onError={() => setFalta(true)} className="h-full w-full object-cover" />
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

export function BotonAviso({ obra, className = '' }: { obra: Obra; className?: string }) {
  const activo = useEstado().avisos.includes(obra.id)
  return (
    <button
      onClick={() => alternarAviso(obra.id)}
      aria-pressed={activo}
      className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold ${
        activo ? 'border-cian bg-cian-tint' : 'border-outline'
      } ${className}`}
    >
      <Icono nombre={activo ? 'check' : 'campana'} tam={16} />
      {activo ? 'Te avisaremos' : 'Avísame'}
    </button>
  )
}

export function Insignia({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 text-xs font-bold tracking-wider uppercase ${className}`}>{children}</div>
  )
}
