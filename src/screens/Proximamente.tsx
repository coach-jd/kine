import { Link } from 'react-router-dom'
import { Barra } from '../components/Barra'
import { Afiche, BotonAviso } from '../components/Piezas'
import { PROXIMAS } from '../data/obras'
import { urlPortada } from '../lib/media'

export default function Proximamente() {
  return (
    <main className="flex flex-col gap-6 px-4 pt-5 pb-32">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-[28px] font-extrabold">Próximamente</h1>
        <p className="text-sm text-muted">Pide que te avisemos y serás de los primeros en verlos.</p>
      </header>
      <div className="flex flex-col gap-3">
        {PROXIMAS.map((p) => (
          <article key={p.id} className="flex gap-3.5 rounded-2xl border border-line bg-surface p-3.5">
            <Link to={`/obra/${p.id}`} aria-label={`Ver ${p.titulo}`} className="shrink-0 self-start">
              <Afiche src={urlPortada(p.id)} tono={p.tono} titulo="" className="h-[165px] w-[110px] rounded-[10px]" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Link to={`/obra/${p.id}`}>
                <h2 className="font-display text-[17px] leading-tight font-bold">{p.titulo}</h2>
              </Link>
              <div className="text-[13px] text-muted">{p.generos.join(' · ')}</div>
              <p className="line-clamp-4 text-sm leading-snug text-soft">{p.sinopsis}</p>
              <div className="mt-auto flex gap-2 pt-1">
                <BotonAviso obra={p} className="flex-1" />
                <Link
                  to={`/obra/${p.id}`}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border border-outline text-sm font-bold"
                >
                  Ver ficha
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      <Barra />
    </main>
  )
}
