import { NavLink } from 'react-router-dom'
import { Icono, type NombreIcono } from './Icono'

const PESTANAS: { a: string; texto: string; icono: NombreIcono }[] = [
  { a: '/', texto: 'Inicio', icono: 'inicio' },
  { a: '/proximamente', texto: 'Próximamente', icono: 'calendario' },
  { a: '/mi-kine', texto: 'Mi Kine', icono: 'persona' },
]

export function Barra() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full border border-line-2 bg-surface-2 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
    >
      {PESTANAS.map((p) => (
        <NavLink
          key={p.a}
          to={p.a}
          end
          className={({ isActive }) =>
            `flex h-[54px] w-[108px] flex-col items-center justify-center gap-[3px] rounded-full text-xs ${
              isActive ? 'bg-nav-active font-bold text-white' : 'font-medium text-muted'
            }`
          }
        >
          <Icono nombre={p.icono} />
          {p.texto}
        </NavLink>
      ))}
    </nav>
  )
}
