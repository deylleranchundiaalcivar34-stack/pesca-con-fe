-- Integra variantes con carrito, checkout, pedidos y control de stock.
-- Ejecutar manualmente despues de docs/productos_variantes.sql.

begin;

alter table public.pedido_items
  add column if not exists variante_id uuid references public.producto_variantes(id) on delete set null,
  add column if not exists variante_nombre text;

create index if not exists pedido_items_variante_idx
  on public.pedido_items(variante_id)
  where variante_id is not null;

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
  subtotal_calculado numeric(10,2) := 0;
  envio_input numeric(10,2);
  total_input numeric(10,2);
  items_input jsonb;
  item_input jsonb;
  producto_record public.productos%rowtype;
  variante_record public.producto_variantes%rowtype;
  producto_id_input uuid;
  variante_id_input uuid;
  cantidad_input integer;
  precio_real numeric(10,2);
begin
  if cliente_actual is null then raise exception 'Debes iniciar sesion para generar un pedido'; end if;

  select pc.* into perfil_cliente from public.perfiles_cliente pc where pc.id = cliente_actual;
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

  direccion_cliente_input := nullif(payload->>'direccion_cliente_id', '')::uuid;
  if direccion_cliente_input is not null and not exists (
    select 1 from public.direcciones_cliente d
    where d.id = direccion_cliente_input and d.cliente_id = cliente_actual and d.activa = true
  ) then raise exception 'La direccion seleccionada no pertenece al cliente'; end if;

  tipo_entrega_input := coalesce(payload->>'tipo_entrega', 'envio_servientrega')::public.tipo_entrega;
  subtotal_input := (payload->>'subtotal')::numeric(10,2);
  envio_input := (payload->>'envio')::numeric(10,2);
  total_input := (payload->>'total')::numeric(10,2);
  items_input := payload->'items';

  if jsonb_typeof(items_input) <> 'array' or jsonb_array_length(items_input) = 0 then
    raise exception 'El pedido no tiene items';
  end if;

  for item_input in select value from jsonb_array_elements(items_input)
  loop
    producto_id_input := nullif(item_input->>'producto_id', '')::uuid;
    variante_id_input := nullif(item_input->>'variante_id', '')::uuid;
    cantidad_input := (item_input->>'cantidad')::integer;
    if cantidad_input is null or cantidad_input <= 0 then raise exception 'Cantidad invalida'; end if;

    select * into producto_record from public.productos
    where id = producto_id_input and activo = true;
    if not found then raise exception 'Producto no disponible'; end if;

    if variante_id_input is not null then
      select * into variante_record from public.producto_variantes
      where id = variante_id_input and producto_id = producto_id_input and activo = true;
      if not found then raise exception 'Opcion de producto no disponible'; end if;
      if variante_record.stock < cantidad_input then raise exception 'Stock insuficiente para %', variante_record.nombre; end if;
      precio_real := variante_record.precio;
    else
      if producto_record.stock < cantidad_input then raise exception 'Stock insuficiente para %', producto_record.nombre; end if;
      precio_real := producto_record.precio;
    end if;
    subtotal_calculado := subtotal_calculado + precio_real * cantidad_input;
  end loop;

  if subtotal_input <> subtotal_calculado or total_input <> subtotal_calculado + envio_input then
    raise exception 'Los precios o totales del pedido cambiaron. Actualiza el carrito';
  end if;
  if tipo_entrega_input = 'retiro_local' and envio_input <> 0 then raise exception 'Datos de retiro invalidos'; end if;

  insert into public.pedidos (
    cliente_id, cliente_nombre_completo, cliente_cedula, cliente_celular, cliente_correo,
    cliente_provincia, cliente_ciudad, cliente_direccion, cliente_referencia_entrega,
    direccion_cliente_id, tipo_entrega, subtotal, envio, total, estado
  ) values (
    cliente_actual, perfil_cliente.nombre_completo, perfil_cliente.cedula,
    perfil_cliente.celular, perfil_cliente.correo, nullif(payload->>'cliente_provincia', ''),
    nullif(payload->>'cliente_ciudad', ''), nullif(payload->>'cliente_direccion', ''),
    nullif(payload->>'cliente_referencia_entrega', ''), direccion_cliente_input,
    tipo_entrega_input, subtotal_calculado, envio_input, subtotal_calculado + envio_input,
    'pendiente_pago'
  ) returning pedidos.id, pedidos.codigo into pedido_id_creado, pedido_codigo_creado;

  for item_input in select value from jsonb_array_elements(items_input)
  loop
    producto_id_input := nullif(item_input->>'producto_id', '')::uuid;
    variante_id_input := nullif(item_input->>'variante_id', '')::uuid;
    cantidad_input := (item_input->>'cantidad')::integer;
    select * into producto_record from public.productos where id = producto_id_input;

    if variante_id_input is not null then
      select * into variante_record from public.producto_variantes where id = variante_id_input;
      precio_real := variante_record.precio;
    else
      variante_record := null;
      precio_real := producto_record.precio;
    end if;

    insert into public.pedido_items (
      pedido_id, producto_id, variante_id, variante_nombre, producto_nombre, producto_slug,
      producto_sku, producto_imagen, categoria_slug, precio, cantidad
    ) values (
      pedido_id_creado, producto_id_input, variante_id_input,
      case when variante_id_input is null then null else variante_record.nombre end,
      producto_record.nombre || case
        when variante_id_input is null then ''
        else ' · ' || variante_record.nombre
      end,
      producto_record.slug,
      case when variante_id_input is null then producto_record.sku else variante_record.sku end,
      nullif(item_input->>'producto_imagen', ''), item_input->>'categoria_slug',
      precio_real, cantidad_input
    );
  end loop;

  return query select pedido_id_creado, pedido_codigo_creado;
end;
$$;

create or replace function public.confirmar_pago_pedido(pedido_id_input uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pedido_record public.pedidos%rowtype; item_record record; stock_actual integer;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  select * into pedido_record from public.pedidos where id = pedido_id_input for update;
  if not found or pedido_record.estado <> 'pendiente_pago' then raise exception 'El pedido no esta pendiente de pago'; end if;

  for item_record in select * from public.pedido_items where pedido_id = pedido_id_input loop
    if item_record.variante_id is not null then
      select stock into stock_actual from public.producto_variantes where id = item_record.variante_id for update;
      if stock_actual is null or stock_actual < item_record.cantidad then raise exception 'Stock insuficiente para %', item_record.producto_nombre; end if;
      update public.producto_variantes set stock = stock_actual - item_record.cantidad where id = item_record.variante_id;
    else
      select stock into stock_actual from public.productos where id = item_record.producto_id for update;
      if stock_actual is null or stock_actual < item_record.cantidad then raise exception 'Stock insuficiente para %', item_record.producto_nombre; end if;
      update public.productos set stock = stock_actual - item_record.cantidad, actualizado_por = auth.uid() where id = item_record.producto_id;
    end if;
  end loop;
  update public.pedidos set estado = 'pagado_confirmado', confirmado_por = auth.uid() where id = pedido_id_input;
end;
$$;

create or replace function public.cancelar_pedido(pedido_id_input uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pedido_record public.pedidos%rowtype; item_record record; stock_actual integer;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  select * into pedido_record from public.pedidos where id = pedido_id_input for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if pedido_record.estado in ('enviado', 'retirado', 'cancelado') then raise exception 'Este pedido no se puede cancelar'; end if;

  if pedido_record.estado in ('pagado_confirmado', 'listo_retiro') then
    for item_record in select * from public.pedido_items where pedido_id = pedido_id_input loop
      if item_record.variante_id is not null then
        select stock into stock_actual from public.producto_variantes where id = item_record.variante_id for update;
        if stock_actual is not null then
          update public.producto_variantes set stock = stock_actual + item_record.cantidad where id = item_record.variante_id;
        end if;
      else
        select stock into stock_actual from public.productos where id = item_record.producto_id for update;
        if stock_actual is not null then
          update public.productos set stock = stock_actual + item_record.cantidad, actualizado_por = auth.uid() where id = item_record.producto_id;
        end if;
      end if;
    end loop;
  end if;
  update public.pedidos set estado = 'cancelado' where id = pedido_id_input;
end;
$$;

revoke all on function public.crear_pedido_web(jsonb) from public, anon;
grant execute on function public.crear_pedido_web(jsonb) to authenticated;

commit;
