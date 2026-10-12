-- Kine: solo el dueño, con su sesión iniciada, puede leer los eventos.

create policy "Solo el dueño lee los eventos"
  on public.eventos for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'coachjesusdiaz@gmail.com');

grant select on public.eventos to authenticated;
