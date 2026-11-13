create table public.gastos (
  id uuid primary key,
  usuario uuid not null references auth.users(id) on delete cascade,
  detalle text not null check (char_length(trim(detalle)) between 1 and 100),
  fecha date not null,
  categoria text not null check (categoria in ('Comida', 'Transporte', 'Casa', 'Salud', 'Ocio', 'Otros')),
  monto integer not null check (monto > 0)
);

create index gastos_usuario_fecha on public.gastos (usuario, fecha desc);

create table public.presupuestos (
  usuario uuid not null references auth.users(id) on delete cascade,
  mes date not null check (extract(day from mes) = 1),
  monto integer not null check (monto > 0),
  primary key (usuario, mes)
);

alter table public.gastos enable row level security;
alter table public.presupuestos enable row level security;

revoke all on public.gastos, public.presupuestos from public, anon, authenticated;
grant select, insert on public.gastos to authenticated;
grant select, insert, update on public.presupuestos to authenticated;

create policy gastos_ver on public.gastos for select to authenticated
  using ((select auth.uid()) = usuario);
create policy gastos_agregar on public.gastos for insert to authenticated
  with check ((select auth.uid()) = usuario);

create policy presup_ver on public.presupuestos for select to authenticated
  using ((select auth.uid()) = usuario);
create policy presup_agregar on public.presupuestos for insert to authenticated
  with check ((select auth.uid()) = usuario);
create policy presup_cambiar on public.presupuestos for update to authenticated
  using ((select auth.uid()) = usuario)
  with check ((select auth.uid()) = usuario);
