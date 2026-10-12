-- Kine: tabla de medición. La app solo puede agregar eventos; nadie puede
-- leerlos, cambiarlos ni borrarlos desde la app.

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  fecha_cliente timestamptz,
  tipo text not null check (tipo in (
    'obra_inicio', 'nodo_inicio', 'nodo_fin', 'decision', 'final',
    'recomendacion', 'compartir', 'aviso', 'instalacion'
  )),
  dispositivo text not null check (char_length(dispositivo) <= 64),
  sesion text not null check (char_length(sesion) <= 64),
  obra text check (char_length(obra) <= 64),
  datos jsonb not null default '{}'::jsonb check (pg_column_size(datos) <= 2000)
);

create index eventos_tipo_creado on public.eventos (tipo, creado);

alter table public.eventos enable row level security;

create policy "La app solo agrega eventos"
  on public.eventos for insert
  to anon, authenticated
  with check (true);

grant insert on public.eventos to anon, authenticated;
