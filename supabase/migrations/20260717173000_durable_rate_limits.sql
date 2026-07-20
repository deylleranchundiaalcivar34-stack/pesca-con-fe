-- Contadores durables para límites por IP/usuario sin almacenar identificadores crudos.

create table if not exists private.limites_frecuencia (
  bucket text not null,
  clave_hash text not null,
  ventana_inicio timestamptz not null,
  solicitudes integer not null default 1 check (solicitudes > 0),
  actualizado_en timestamptz not null default now(),
  primary key (bucket, clave_hash, ventana_inicio),
  constraint limites_bucket_valido check (char_length(bucket) between 1 and 80),
  constraint limites_hash_valido check (char_length(clave_hash) = 64)
);

create index if not exists limites_frecuencia_limpieza_idx
  on private.limites_frecuencia (ventana_inicio);

revoke all on table private.limites_frecuencia from public, anon, authenticated;

create or replace function public.consumir_limite_frecuencia_servidor(
  bucket_input text,
  clave_hash_input text,
  maximo_input integer,
  ventana_segundos_input integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, private, pg_temp
as $$
declare
  inicio timestamptz;
  total integer;
begin
  if char_length(bucket_input) not between 1 and 80
    or clave_hash_input !~ '^[a-f0-9]{64}$'
    or maximo_input not between 1 and 10000
    or ventana_segundos_input not between 1 and 86400 then
    return false;
  end if;

  inicio := to_timestamp(
    floor(extract(epoch from now()) / ventana_segundos_input) * ventana_segundos_input
  );

  insert into private.limites_frecuencia (
    bucket, clave_hash, ventana_inicio, solicitudes, actualizado_en
  ) values (
    bucket_input, clave_hash_input, inicio, 1, now()
  )
  on conflict (bucket, clave_hash, ventana_inicio)
  do update set solicitudes = private.limites_frecuencia.solicitudes + 1,
                actualizado_en = now()
  returning solicitudes into total;

  return total <= maximo_input;
end;
$$;

revoke all on function public.consumir_limite_frecuencia_servidor(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consumir_limite_frecuencia_servidor(text, text, integer, integer)
  to service_role;

create or replace function public.limpiar_limites_frecuencia_servidor()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, private, pg_temp
as $$
declare
  eliminadas bigint;
begin
  delete from private.limites_frecuencia
  where ventana_inicio < now() - interval '2 days';
  get diagnostics eliminadas = row_count;
  return eliminadas;
end;
$$;

revoke all on function public.limpiar_limites_frecuencia_servidor()
  from public, anon, authenticated;
grant execute on function public.limpiar_limites_frecuencia_servidor() to service_role;
