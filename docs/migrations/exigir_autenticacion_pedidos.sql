-- Exige una sesion autenticada para crear pedidos web.
-- Conserva snapshots del comprador, pero obtiene su identidad desde perfiles_cliente.
-- Ejecutar manualmente en Supabase SQL Editor despues de crear un respaldo.

begin;

create or replace function public.crear_pedido_web(payload jsonb)
returns table(id uuid, codigo text)
language plpgsql
security definer
set search_path = public
as $$
declare
  pedido_id_creado uuid;
  pedido_codigo_creado text;
  cliente_actual uuid := auth.uid();
  perfil_cliente public.perfiles_cliente%rowtype;
  direccion_cliente_input uuid;
  tipo_entrega_input public.tipo_entrega;
  subtotal_input numeric(10,2);
  envio_input numeric(10,2);
  total_input numeric(10,2);
  items_input jsonb;
  item_input jsonb;
begin
  if cliente_actual is null then
    raise exception 'Debes iniciar sesion para generar un pedido';
  end if;

  select pc.* into perfil_cliente
  from public.perfiles_cliente as pc
  where pc.id = cliente_actual;

  if not found
    or nullif(trim(perfil_cliente.nombre_completo), '') is null
    or nullif(trim(perfil_cliente.cedula), '') is null
    or nullif(trim(perfil_cliente.celular), '') is null
    or nullif(trim(perfil_cliente.correo::text), '') is null then
    raise exception 'Completa tu perfil antes de generar un pedido';
  end if;

  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Datos de pedido invalidos';
  end if;

  if coalesce(payload->>'estado', 'pendiente_pago') <> 'pendiente_pago' then
    raise exception 'Solo se pueden crear pedidos pendientes de pago';
  end if;

  direccion_cliente_input := nullif(payload->>'direccion_cliente_id', '')::uuid;

  if direccion_cliente_input is not null and not exists (
    select 1
    from public.direcciones_cliente d
    where d.id = direccion_cliente_input
      and d.cliente_id = cliente_actual
      and d.activa = true
  ) then
    raise exception 'La direccion seleccionada no pertenece al cliente';
  end if;

  tipo_entrega_input := coalesce(payload->>'tipo_entrega', 'envio_servientrega')::public.tipo_entrega;
  subtotal_input := (payload->>'subtotal')::numeric(10,2);
  envio_input := (payload->>'envio')::numeric(10,2);
  total_input := (payload->>'total')::numeric(10,2);
  items_input := payload->'items';

  if subtotal_input is null or envio_input is null or total_input is null
    or subtotal_input < 0 or envio_input < 0 or total_input < 0
    or total_input <> subtotal_input + envio_input then
    raise exception 'Totales de pedido invalidos';
  end if;

  if jsonb_typeof(items_input) <> 'array' or jsonb_array_length(items_input) = 0 then
    raise exception 'El pedido no tiene items';
  end if;

  if tipo_entrega_input = 'retiro_local' and envio_input <> 0 then
    raise exception 'Datos de retiro invalidos';
  end if;

  insert into public.pedidos (
    cliente_id,
    cliente_nombre_completo,
    cliente_cedula,
    cliente_celular,
    cliente_correo,
    cliente_provincia,
    cliente_ciudad,
    cliente_direccion,
    cliente_referencia_entrega,
    direccion_cliente_id,
    tipo_entrega,
    subtotal,
    envio,
    total,
    estado
  )
  values (
    cliente_actual,
    perfil_cliente.nombre_completo,
    perfil_cliente.cedula,
    perfil_cliente.celular,
    perfil_cliente.correo,
    nullif(payload->>'cliente_provincia', ''),
    nullif(payload->>'cliente_ciudad', ''),
    nullif(payload->>'cliente_direccion', ''),
    nullif(payload->>'cliente_referencia_entrega', ''),
    direccion_cliente_input,
    tipo_entrega_input,
    subtotal_input,
    envio_input,
    total_input,
    'pendiente_pago'
  )
  returning pedidos.id, pedidos.codigo
  into pedido_id_creado, pedido_codigo_creado;

  for item_input in select value from jsonb_array_elements(items_input)
  loop
    insert into public.pedido_items (
      pedido_id,
      producto_id,
      producto_nombre,
      producto_slug,
      producto_sku,
      producto_imagen,
      categoria_slug,
      precio,
      cantidad
    )
    values (
      pedido_id_creado,
      nullif(item_input->>'producto_id', '')::uuid,
      item_input->>'producto_nombre',
      item_input->>'producto_slug',
      nullif(item_input->>'producto_sku', ''),
      nullif(item_input->>'producto_imagen', ''),
      item_input->>'categoria_slug',
      (item_input->>'precio')::numeric(10,2),
      (item_input->>'cantidad')::integer
    );
  end loop;

  return query select pedido_id_creado, pedido_codigo_creado;
end;
$$;

revoke all on function public.crear_pedido_web(jsonb) from public;
revoke all on function public.crear_pedido_web(jsonb) from anon;
grant execute on function public.crear_pedido_web(jsonb) to authenticated;

alter table public.pedidos
  drop column if exists creado_por;

commit;
