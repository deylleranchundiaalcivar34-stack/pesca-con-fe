alter table public.perfiles_cliente
  alter column cedula drop not null,
  alter column celular drop not null;

create or replace function public.crear_perfil_cliente_desde_auth()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
begin
  insert into public.perfiles_cliente (id, nombres, apellidos, cedula, celular, correo)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'first_name', ''), split_part(new.email, '@', 1), 'Cliente'),
    coalesce(nullif(new.raw_user_meta_data->>'last_name', ''), ''),
    null,
    null,
    new.email
  )
  on conflict (id) do update
  set nombres = excluded.nombres,
      apellidos = excluded.apellidos,
      correo = excluded.correo;

  return new;
end;
$function$;

do $$
declare
  definition text;
  next_definition text;
begin
  select pg_get_functiondef('public.crear_pedido_web(jsonb)'::regprocedure)
  into definition;

  next_definition := replace(
    definition,
    $old$  referencia_calculada text;
begin$old$,
    $new$  referencia_calculada text;
  celular_calculado text;
begin$new$
  );

  next_definition := replace(
    next_definition,
    $old$  if not found
    or nullif(trim(perfil_cliente.nombre_completo), '') is null
    or nullif(trim(perfil_cliente.cedula), '') is null
    or nullif(trim(perfil_cliente.celular), '') is null
    or nullif(trim(perfil_cliente.correo::text), '') is null then
    raise exception 'Completa tu perfil antes de generar un pedido';
  end if;$old$,
    $new$  if not found
    or nullif(trim(perfil_cliente.nombre_completo), '') is null
    or nullif(trim(perfil_cliente.correo::text), '') is null then
    raise exception 'Completa nombre y correo en tu perfil antes de generar un pedido';
  end if;$new$
  );

  next_definition := replace(
    next_definition,
    $old$  items_input := payload->'items';$old$,
    $new$  items_input := payload->'items';
  celular_calculado := nullif(trim(coalesce(payload->>'cliente_celular', '')), '');$new$
  );

  next_definition := replace(
    next_definition,
    $old$      referencia_calculada := direccion_guardada.referencia;$old$,
    $new$      referencia_calculada := direccion_guardada.referencia;
      celular_calculado := coalesce(
        nullif(trim(direccion_guardada.celular_contacto), ''),
        celular_calculado
      );$new$
  );

  next_definition := replace(
    next_definition,
    $old$  insert into public.pedidos ($old$,
    $new$  if celular_calculado is null
    or length(regexp_replace(celular_calculado, '\D', '', 'g')) < 9 then
    raise exception 'Completa un celular de contacto válido para el pedido';
  end if;

  insert into public.pedidos ($new$
  );

  next_definition := replace(
    next_definition,
    $old$    perfil_cliente.cedula,
    perfil_cliente.celular,$old$,
    $new$    null,
    celular_calculado,$new$
  );

  if next_definition = definition then
    raise exception 'No se pudo actualizar crear_pedido_web';
  end if;

  execute next_definition;
end;
$$;
