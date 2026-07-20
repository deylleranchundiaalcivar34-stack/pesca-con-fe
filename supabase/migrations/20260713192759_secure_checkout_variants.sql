-- Checkout seguro: la base de datos resuelve producto, variante, precio, envío y stock.

alter table public.pedido_items
  add column if not exists variante_id uuid,
  add column if not exists variante_nombre text,
  add column if not exists variante_sku text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pedido_items_variante_id_fkey'
      and conrelid = 'public.pedido_items'::regclass
  ) then
    alter table public.pedido_items
      add constraint pedido_items_variante_id_fkey
      foreign key (variante_id)
      references public.producto_variantes(id);
  end if;
end;
$$;

create index if not exists pedido_items_variante_id_idx
  on public.pedido_items (variante_id)
  where variante_id is not null;

-- La autorización interna vive fuera de los esquemas expuestos por PostgREST.
create schema if not exists private;

create or replace function private.es_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select exists (
    select 1
    from public.perfiles_admin
    where id = auth.uid()
      and activo = true
      and rol in ('dueno', 'admin', 'vendedor')
  );
$$;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
revoke all on function private.es_admin() from public;
grant execute on function private.es_admin() to anon, authenticated;

alter policy "Admins gestionan catalogo" on public.catalogo_nodos
  using ((select private.es_admin())) with check ((select private.es_admin()));
alter policy "Admins gestionan categorias" on public.categorias
  using ((select private.es_admin())) with check ((select private.es_admin()));
alter policy "Admins gestionan direcciones cliente" on public.direcciones_cliente
  using ((select private.es_admin())) with check ((select private.es_admin()));
alter policy "Admins gestionan marcas" on public.marcas
  using ((select private.es_admin())) with check ((select private.es_admin()));
alter policy "Admins gestionan items de pedidos" on public.pedido_items
  using ((select private.es_admin())) with check ((select private.es_admin()));
alter policy "Admins gestionan pedidos" on public.pedidos
  using ((select private.es_admin())) with check ((select private.es_admin()));
alter policy "Admins leen perfiles admin" on public.perfiles_admin
  using ((select private.es_admin()));
alter policy "Admins gestionan perfiles cliente" on public.perfiles_cliente
  using ((select private.es_admin())) with check ((select private.es_admin()));
alter policy "Admins gestionan imagenes de productos" on public.producto_imagenes
  using ((select private.es_admin())) with check ((select private.es_admin()));
alter policy "Admins gestionan variantes" on public.producto_variantes
  using ((select private.es_admin())) with check ((select private.es_admin()));
alter policy "Admins gestionan productos" on public.productos
  using ((select private.es_admin())) with check ((select private.es_admin()));
alter policy "Admins gestionan subcategorias" on public.subcategorias
  using ((select private.es_admin())) with check ((select private.es_admin()));

create or replace function public.crear_pedido_web(payload jsonb)
returns table(id uuid, codigo text)
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  pedido_id_creado uuid;
  pedido_codigo_creado text;
  cliente_actual uuid := auth.uid();
  perfil_cliente public.perfiles_cliente%rowtype;
  direccion_guardada public.direcciones_cliente%rowtype;
  direccion_cliente_input uuid;
  tipo_entrega_input public.tipo_entrega;
  items_input jsonb;
  item_input jsonb;
  producto_input uuid;
  variante_input uuid;
  cantidad_input integer;
  producto_record public.productos%rowtype;
  variante_record public.producto_variantes%rowtype;
  categoria_slug_calculada text;
  imagen_calculada text;
  precio_calculado numeric(10,2);
  subtotal_calculado numeric(10,2) := 0;
  envio_calculado numeric(10,2) := 0;
  provincia_calculada text;
  ciudad_calculada text;
  direccion_calculada text;
  referencia_calculada text;
begin
  if cliente_actual is null then
    raise exception 'Debes iniciar sesión para generar un pedido';
  end if;

  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Datos de pedido inválidos';
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

  tipo_entrega_input := coalesce(payload->>'tipo_entrega', 'envio_servientrega')::public.tipo_entrega;
  items_input := payload->'items';

  if jsonb_typeof(items_input) <> 'array' or jsonb_array_length(items_input) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  if jsonb_array_length(items_input) > 50 then
    raise exception 'El pedido supera el máximo de productos permitido';
  end if;

  direccion_cliente_input := nullif(payload->>'direccion_cliente_id', '')::uuid;

  if tipo_entrega_input = 'envio_servientrega' then
    if direccion_cliente_input is not null then
      select d.* into direccion_guardada
      from public.direcciones_cliente as d
      where d.id = direccion_cliente_input
        and d.cliente_id = cliente_actual
        and d.activa = true;

      if not found then
        raise exception 'La dirección seleccionada no pertenece al cliente';
      end if;

      provincia_calculada := direccion_guardada.provincia;
      ciudad_calculada := direccion_guardada.ciudad;
      direccion_calculada := direccion_guardada.direccion;
      referencia_calculada := direccion_guardada.referencia;
    else
      provincia_calculada := nullif(trim(coalesce(payload->>'cliente_provincia', '')), '');
      ciudad_calculada := nullif(trim(coalesce(payload->>'cliente_ciudad', '')), '');
      direccion_calculada := nullif(trim(coalesce(payload->>'cliente_direccion', '')), '');
      referencia_calculada := nullif(trim(coalesce(payload->>'cliente_referencia_entrega', '')), '');

      if provincia_calculada is null
        or ciudad_calculada is null
        or direccion_calculada is null
        or length(direccion_calculada) < 8 then
        raise exception 'Completa una dirección de entrega válida';
      end if;
    end if;
  else
    direccion_cliente_input := null;
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
    provincia_calculada,
    ciudad_calculada,
    direccion_calculada,
    referencia_calculada,
    direccion_cliente_input,
    tipo_entrega_input,
    0,
    0,
    0,
    'pendiente_pago'
  )
  returning pedidos.id, pedidos.codigo into pedido_id_creado, pedido_codigo_creado;

  for item_input in select value from jsonb_array_elements(items_input)
  loop
    if nullif(item_input->>'producto_id', '') is null
      or coalesce(item_input->>'cantidad', '') !~ '^[1-9][0-9]*$' then
      raise exception 'Producto o cantidad inválidos';
    end if;

    producto_input := (item_input->>'producto_id')::uuid;
    variante_input := nullif(item_input->>'variante_id', '')::uuid;
    cantidad_input := (item_input->>'cantidad')::integer;

    select p.* into producto_record
    from public.productos as p
    where p.id = producto_input
      and p.activo = true;

    if not found then
      raise exception 'El producto seleccionado ya no está disponible';
    end if;

    select c.slug into categoria_slug_calculada
    from public.categorias as c
    where c.id = producto_record.categoria_id;

    select pi.cloudinary_secure_url into imagen_calculada
    from public.producto_imagenes as pi
    where pi.producto_id = producto_record.id
      and pi.activo = true
    order by pi.principal desc, pi.orden asc
    limit 1;

    if variante_input is not null then
      select v.* into variante_record
      from public.producto_variantes as v
      where v.id = variante_input
        and v.producto_id = producto_record.id
        and v.activo = true;

      if not found then
        raise exception 'La variante seleccionada no está disponible para este producto';
      end if;

      if variante_record.stock < cantidad_input then
        raise exception 'Stock insuficiente para la variante seleccionada';
      end if;

      precio_calculado := variante_record.precio;
    else
      if producto_record.stock < cantidad_input then
        raise exception 'Stock insuficiente para el producto seleccionado';
      end if;

      precio_calculado := producto_record.precio;
    end if;

    insert into public.pedido_items (
      pedido_id,
      producto_id,
      variante_id,
      variante_nombre,
      variante_sku,
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
      producto_record.id,
      variante_record.id,
      case when variante_input is null then null else variante_record.nombre end,
      case when variante_input is null then null else variante_record.sku end,
      case
        when variante_input is null then producto_record.nombre
        else producto_record.nombre || ' · ' || variante_record.nombre
      end,
      producto_record.slug,
      producto_record.sku,
      imagen_calculada,
      coalesce(categoria_slug_calculada, ''),
      precio_calculado,
      cantidad_input
    );

    subtotal_calculado := subtotal_calculado + (precio_calculado * cantidad_input);

    if tipo_entrega_input = 'envio_servientrega' then
      envio_calculado := greatest(
        envio_calculado,
        case when categoria_slug_calculada = 'canas' then 8.50 else 6.50 end
      );
    end if;
  end loop;

  update public.pedidos
  set subtotal = subtotal_calculado,
      envio = envio_calculado,
      total = subtotal_calculado + envio_calculado
  where id = pedido_id_creado;

  return query select pedido_id_creado, pedido_codigo_creado;
end;
$$;

create or replace function public.confirmar_pago_pedido(pedido_id_input uuid)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
declare
  pedido_record public.pedidos%rowtype;
  item_record record;
  stock_actual integer;
begin
  if not private.es_admin() then
    raise exception 'No autorizado';
  end if;

  select * into pedido_record
  from public.pedidos
  where id = pedido_id_input
  for update;

  if not found then
    raise exception 'Pedido no encontrado';
  end if;

  if pedido_record.estado <> 'pendiente_pago' then
    raise exception 'Solo se pueden confirmar pedidos pendientes de pago';
  end if;

  for item_record in
    select producto_id, variante_id, sum(cantidad)::integer as cantidad
    from public.pedido_items
    where pedido_id = pedido_id_input
    group by producto_id, variante_id
    order by producto_id, variante_id nulls first
  loop
    if item_record.variante_id is not null then
      select stock into stock_actual
      from public.producto_variantes
      where id = item_record.variante_id
        and producto_id = item_record.producto_id
      for update;

      if stock_actual is null then
        raise exception 'Variante no encontrada para el pedido';
      end if;

      if stock_actual < item_record.cantidad then
        raise exception 'Stock insuficiente para una variante del pedido';
      end if;

      update public.producto_variantes
      set stock = stock_actual - item_record.cantidad
      where id = item_record.variante_id;
    else
      select stock into stock_actual
      from public.productos
      where id = item_record.producto_id
      for update;

      if stock_actual is null then
        raise exception 'Producto no encontrado para el pedido';
      end if;

      if stock_actual < item_record.cantidad then
        raise exception 'Stock insuficiente para un producto del pedido';
      end if;

      update public.productos
      set stock = stock_actual - item_record.cantidad,
          actualizado_por = auth.uid()
      where id = item_record.producto_id;
    end if;
  end loop;

  update public.pedidos
  set estado = 'pagado_confirmado',
      confirmado_por = auth.uid()
  where id = pedido_id_input;
end;
$$;

create or replace function public.cancelar_pedido(pedido_id_input uuid)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
declare
  pedido_record public.pedidos%rowtype;
  item_record record;
  stock_actual integer;
begin
  if not private.es_admin() then
    raise exception 'No autorizado';
  end if;

  select * into pedido_record
  from public.pedidos
  where id = pedido_id_input
  for update;

  if not found then
    raise exception 'Pedido no encontrado';
  end if;

  if pedido_record.estado in ('enviado', 'retirado', 'cancelado') then
    raise exception 'Este pedido no se puede cancelar';
  end if;

  if pedido_record.estado in ('pagado_confirmado', 'listo_retiro') then
    for item_record in
      select producto_id, variante_id, sum(cantidad)::integer as cantidad
      from public.pedido_items
      where pedido_id = pedido_id_input
      group by producto_id, variante_id
      order by producto_id, variante_id nulls first
    loop
      if item_record.variante_id is not null then
        select stock into stock_actual
        from public.producto_variantes
        where id = item_record.variante_id
          and producto_id = item_record.producto_id
        for update;

        if stock_actual is null then
          raise exception 'Variante no encontrada para el pedido';
        end if;

        update public.producto_variantes
        set stock = stock_actual + item_record.cantidad
        where id = item_record.variante_id;
      else
        select stock into stock_actual
        from public.productos
        where id = item_record.producto_id
        for update;

        if stock_actual is null then
          raise exception 'Producto no encontrado para el pedido';
        end if;

        update public.productos
        set stock = stock_actual + item_record.cantidad,
            actualizado_por = auth.uid()
        where id = item_record.producto_id;
      end if;
    end loop;
  end if;

  update public.pedidos
  set estado = 'cancelado'
  where id = pedido_id_input;
end;
$$;

create or replace function public.marcar_pedido_enviado(pedido_id_input uuid)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if not private.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.pedidos
  set estado = 'enviado'
  where id = pedido_id_input
    and estado = 'pagado_confirmado'
    and tipo_entrega = 'envio_servientrega';

  if not found then
    raise exception 'El pedido no se puede marcar como enviado';
  end if;
end;
$$;

create or replace function public.marcar_pedido_listo_retiro(pedido_id_input uuid)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if not private.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.pedidos
  set estado = 'listo_retiro'
  where id = pedido_id_input
    and estado = 'pagado_confirmado'
    and tipo_entrega = 'retiro_local';

  if not found then
    raise exception 'El pedido no se puede marcar como listo para retiro';
  end if;
end;
$$;

create or replace function public.marcar_pedido_retirado(pedido_id_input uuid)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if not private.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.pedidos
  set estado = 'retirado'
  where id = pedido_id_input
    and estado = 'listo_retiro'
    and tipo_entrega = 'retiro_local';

  if not found then
    raise exception 'El pedido no se puede marcar como retirado';
  end if;
end;
$$;

-- Las políticas y RPC ya usan private.es_admin(); la versión pública no debe exponerse.
drop function public.es_admin();

-- Funciones auxiliares con un search_path fijo para eliminar los avisos de seguridad.
alter function public.es_cedula_ecuatoriana(text)
  set search_path = pg_catalog, pg_temp;
alter function public.siguiente_codigo_pedido()
  set search_path = pg_catalog, pg_temp;
alter function public.set_catalogo_nodos_actualizado_en()
  set search_path = pg_catalog, pg_temp;

alter function public.crear_perfil_cliente_desde_auth()
  set search_path = pg_catalog, public, pg_temp;

-- La función trigger no debe ser un endpoint público.
revoke all on function public.crear_perfil_cliente_desde_auth() from public, anon, authenticated;

-- Checkout: endpoint autenticado, con validación completa dentro de la función.
revoke all on function public.crear_pedido_web(jsonb) from public, anon, authenticated;
grant execute on function public.crear_pedido_web(jsonb) to authenticated;

-- Los RPC administrativos usan RLS + private.es_admin(), nunca deben aceptar anónimos.
revoke all on function public.confirmar_pago_pedido(uuid) from public, anon;
grant execute on function public.confirmar_pago_pedido(uuid) to authenticated;
revoke all on function public.cancelar_pedido(uuid) from public, anon;
grant execute on function public.cancelar_pedido(uuid) to authenticated;
revoke all on function public.marcar_pedido_enviado(uuid) from public, anon;
grant execute on function public.marcar_pedido_enviado(uuid) to authenticated;
revoke all on function public.marcar_pedido_listo_retiro(uuid) from public, anon;
grant execute on function public.marcar_pedido_listo_retiro(uuid) to authenticated;
revoke all on function public.marcar_pedido_retirado(uuid) from public, anon;
grant execute on function public.marcar_pedido_retirado(uuid) to authenticated;
