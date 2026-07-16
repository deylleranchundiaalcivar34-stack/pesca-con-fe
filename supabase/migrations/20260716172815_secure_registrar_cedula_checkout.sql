-- Esta función solo actualiza el perfil propio bajo las políticas RLS existentes.
-- SECURITY INVOKER evita elevar privilegios innecesariamente.
create or replace function public.registrar_cedula_checkout(cedula_input text)
returns text
language plpgsql
security invoker
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  cliente_actual uuid := auth.uid();
  cedula_normalizada text := regexp_replace(trim(coalesce(cedula_input, '')), '[^0-9]', '', 'g');
begin
  if cliente_actual is null then
    raise exception 'Debes iniciar sesión para registrar tu cédula';
  end if;

  if not private.es_cedula_ecuatoriana_valida(cedula_normalizada) then
    raise exception 'La cédula debe ser ecuatoriana y válida';
  end if;

  update public.perfiles_cliente
  set cedula = cedula_normalizada
  where id = cliente_actual;

  if not found then
    raise exception 'No encontramos tu perfil de cliente';
  end if;

  return cedula_normalizada;
end;
$$;

revoke all on function public.registrar_cedula_checkout(text) from public, anon, service_role;
grant execute on function public.registrar_cedula_checkout(text) to authenticated;
