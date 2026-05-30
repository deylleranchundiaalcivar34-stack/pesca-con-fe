-- Permite crear pedidos web sin iniciar sesion manteniendo RLS activo.
-- Ejecutar en el SQL Editor de Supabase para el proyecto de produccion.

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
  tipo_entrega_input public.tipo_entrega;
  subtotal_input numeric(10,2);
  envio_input numeric(10,2);
  total_input numeric(10,2);
  items_input jsonb;
  item_input jsonb;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Datos de pedido invalidos';
  end if;

  if coalesce(payload->>'canal', 'web') <> 'web'
    or coalesce(payload->>'estado', 'pendiente_pago') <> 'pendiente_pago' then
    raise exception 'Solo se pueden crear pedidos web pendientes de pago';
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

  if tipo_entrega_input = 'retiro_local'
    and (envio_input <> 0 or payload->'direccion_retiro_snapshot' is null) then
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
    direccion_retiro_snapshot,
    cuenta_bancaria_id,
    cuenta_bancaria_snapshot,
    subtotal,
    envio,
    total,
    estado,
    canal,
    creado_por
  )
  values (
    cliente_actual,
    payload->>'cliente_nombre_completo',
    nullif(payload->>'cliente_cedula', ''),
    payload->>'cliente_celular',
    nullif(payload->>'cliente_correo', '')::citext,
    nullif(payload->>'cliente_provincia', ''),
    nullif(payload->>'cliente_ciudad', ''),
    nullif(payload->>'cliente_direccion', ''),
    nullif(payload->>'cliente_referencia_entrega', ''),
    nullif(payload->>'direccion_cliente_id', '')::uuid,
    tipo_entrega_input,
    payload->'direccion_retiro_snapshot',
    nullif(payload->>'cuenta_bancaria_id', '')::uuid,
    payload->'cuenta_bancaria_snapshot',
    subtotal_input,
    envio_input,
    total_input,
    'pendiente_pago',
    'web',
    cliente_actual
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
grant execute on function public.crear_pedido_web(jsonb) to anon, authenticated;

drop policy if exists "Cualquiera puede crear pedidos web" on public.pedidos;
drop policy if exists "Cualquiera puede crear items de pedidos web" on public.pedido_items;
drop function if exists public.pedido_web_puede_recibir_items(uuid);
