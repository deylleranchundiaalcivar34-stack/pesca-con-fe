-- Simplifica el modelo de datos de Pesca Con Fe.
-- Ejecutar en Supabase SQL Editor despues de hacer respaldo/export de la base.

begin;

drop view if exists public.productos_publicos;
drop view if exists public.productos_admin;
drop view if exists public.pedidos_admin;
drop view if exists public.mis_pedidos;

drop function if exists public.crear_pedido_web(jsonb);
drop function if exists public.confirmar_pago_pedido(uuid);
drop function if exists public.marcar_pedido_listo_retiro(uuid);
drop function if exists public.marcar_pedido_retirado(uuid);
drop function if exists public.marcar_pedido_enviado(uuid);
drop function if exists public.cancelar_pedido(uuid);

drop trigger if exists perfiles_admin_actualizado_en on public.perfiles_admin;
drop trigger if exists perfiles_cliente_actualizado_en on public.perfiles_cliente;
drop trigger if exists direcciones_cliente_actualizado_en on public.direcciones_cliente;
drop trigger if exists configuracion_negocio_actualizado_en on public.configuracion_negocio;
drop trigger if exists cuentas_bancarias_actualizado_en on public.cuentas_bancarias;
drop trigger if exists categorias_actualizado_en on public.categorias;
drop trigger if exists subcategorias_actualizado_en on public.subcategorias;
drop trigger if exists marcas_actualizado_en on public.marcas;
drop trigger if exists productos_actualizado_en on public.productos;
drop trigger if exists producto_imagenes_actualizado_en on public.producto_imagenes;
drop trigger if exists pedidos_actualizado_en on public.pedidos;

drop index if exists public.direcciones_cliente_cliente_idx;
drop index if exists public.producto_imagenes_producto_orden_idx;
drop index if exists public.categorias_activas_orden_idx;
drop index if exists public.subcategorias_categoria_idx;
drop index if exists public.marcas_activas_orden_idx;
drop index if exists public.productos_catalogo_publico_idx;
drop index if exists public.pedidos_cliente_creado_idx;
drop index if exists public.pedidos_estado_creado_idx;
drop index if exists public.pedidos_canal_creado_idx;
drop index if exists public.pedidos_tipo_entrega_creado_idx;

alter table if exists public.pedidos
  drop constraint if exists pedidos_retiro_requiere_snapshot;

drop table if exists public.cuentas_bancarias cascade;
drop table if exists public.configuracion_negocio cascade;

alter table if exists public.categorias
  drop column if exists descripcion,
  drop column if exists url_imagen,
  drop column if exists orden,
  drop column if exists creado_en,
  drop column if exists actualizado_en;

alter table if exists public.subcategorias
  drop column if exists orden,
  drop column if exists creado_en,
  drop column if exists actualizado_en;

alter table if exists public.marcas
  drop column if exists url_logo,
  drop column if exists ancho_logo,
  drop column if exists alto_logo,
  drop column if exists orden,
  drop column if exists creado_en,
  drop column if exists actualizado_en;

alter table if exists public.perfiles_admin
  drop column if exists creado_en,
  drop column if exists actualizado_en;

alter table if exists public.perfiles_cliente
  drop column if exists creado_en,
  drop column if exists actualizado_en;

alter table if exists public.direcciones_cliente
  alter column alias set default 'Dirección Principal',
  drop column if exists creado_en,
  drop column if exists actualizado_en;

alter table if exists public.productos
  drop column if exists creado_en,
  drop column if exists actualizado_en;

alter table if exists public.producto_imagenes
  drop column if exists creado_en,
  drop column if exists actualizado_en;

alter table if exists public.pedidos
  drop column if exists direccion_retiro_snapshot,
  drop column if exists cuenta_bancaria_id,
  drop column if exists cuenta_bancaria_snapshot,
  drop column if exists canal,
  drop column if exists pago_confirmado_en,
  drop column if exists listo_retiro_en,
  drop column if exists retirado_en,
  drop column if exists enviado_en,
  drop column if exists cancelado_en,
  drop column if exists notas,
  drop column if exists actualizado_en;

drop type if exists public.tipo_cuenta_bancaria;
drop type if exists public.canal_venta;
drop function if exists public.set_actualizado_en();

create index if not exists direcciones_cliente_cliente_idx
  on public.direcciones_cliente(cliente_id, activa, principal desc);

create index if not exists producto_imagenes_producto_orden_idx
  on public.producto_imagenes(producto_id, principal desc, orden);

create index if not exists categorias_activas_nombre_idx
  on public.categorias(activa, nombre);

create index if not exists subcategorias_categoria_nombre_idx
  on public.subcategorias(categoria_id, activa, nombre);

create index if not exists marcas_activas_nombre_idx
  on public.marcas(activa, nombre);

create index if not exists productos_catalogo_publico_idx
  on public.productos(activo, destacado, nombre);

create index if not exists pedidos_cliente_creado_idx
  on public.pedidos(cliente_id, creado_en desc);

create index if not exists pedidos_estado_creado_idx
  on public.pedidos(estado, creado_en desc);

create index if not exists pedidos_tipo_entrega_creado_idx
  on public.pedidos(tipo_entrega, creado_en desc);

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

  if coalesce(payload->>'estado', 'pendiente_pago') <> 'pendiente_pago' then
    raise exception 'Solo se pueden crear pedidos pendientes de pago';
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
    estado,
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
    subtotal_input,
    envio_input,
    total_input,
    'pendiente_pago',
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

create or replace function public.confirmar_pago_pedido(pedido_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pedido_record public.pedidos%rowtype;
  item_record record;
  stock_actual integer;
  stock_nuevo integer;
begin
  if not public.es_admin() then
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
    select * from public.pedido_items where pedido_id = pedido_id_input
  loop
    select stock into stock_actual
    from public.productos
    where id = item_record.producto_id
    for update;

    if stock_actual is null then
      raise exception 'Producto no encontrado para el item %', item_record.id;
    end if;

    if stock_actual < item_record.cantidad then
      raise exception 'Stock insuficiente para %', item_record.producto_nombre;
    end if;

    stock_nuevo := stock_actual - item_record.cantidad;

    update public.productos
    set stock = stock_nuevo,
        actualizado_por = auth.uid()
    where id = item_record.producto_id;

    insert into public.movimientos_inventario (
      producto_id,
      pedido_id,
      tipo,
      cantidad_delta,
      stock_antes,
      stock_despues,
      motivo,
      creado_por
    )
    values (
      item_record.producto_id,
      pedido_id_input,
      'venta_confirmada',
      item_record.cantidad * -1,
      stock_actual,
      stock_nuevo,
      'Pago confirmado',
      auth.uid()
    );
  end loop;

  update public.pedidos
  set estado = 'pagado_confirmado',
      confirmado_por = auth.uid()
  where id = pedido_id_input;
end;
$$;

create or replace function public.marcar_pedido_listo_retiro(pedido_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.pedidos
  set estado = 'listo_retiro'
  where id = pedido_id_input
    and tipo_entrega = 'retiro_local'
    and estado = 'pagado_confirmado';

  if not found then
    raise exception 'El pedido no esta pagado o no es de retiro local';
  end if;
end;
$$;

create or replace function public.marcar_pedido_retirado(pedido_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.pedidos
  set estado = 'retirado'
  where id = pedido_id_input
    and tipo_entrega = 'retiro_local'
    and estado = 'listo_retiro';

  if not found then
    raise exception 'El pedido no esta listo para retiro';
  end if;
end;
$$;

create or replace function public.marcar_pedido_enviado(pedido_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.pedidos
  set estado = 'enviado'
  where id = pedido_id_input
    and tipo_entrega = 'envio_servientrega'
    and estado = 'pagado_confirmado';

  if not found then
    raise exception 'El pedido no esta pagado o no es de envio';
  end if;
end;
$$;

create or replace function public.cancelar_pedido(pedido_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pedido_record public.pedidos%rowtype;
  item_record record;
  stock_actual integer;
  stock_nuevo integer;
begin
  if not public.es_admin() then
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
      select * from public.pedido_items where pedido_id = pedido_id_input
    loop
      select stock into stock_actual
      from public.productos
      where id = item_record.producto_id
      for update;

      if stock_actual is not null then
        stock_nuevo := stock_actual + item_record.cantidad;

        update public.productos
        set stock = stock_nuevo,
            actualizado_por = auth.uid()
        where id = item_record.producto_id;

        insert into public.movimientos_inventario (
          producto_id,
          pedido_id,
          tipo,
          cantidad_delta,
          stock_antes,
          stock_despues,
          motivo,
          creado_por
        )
        values (
          item_record.producto_id,
          pedido_id_input,
          'reversion_cancelacion',
          item_record.cantidad,
          stock_actual,
          stock_nuevo,
          'Pedido cancelado',
          auth.uid()
        );
      end if;
    end loop;
  end if;

  update public.pedidos
  set estado = 'cancelado'
  where id = pedido_id_input;
end;
$$;

create or replace view public.productos_publicos
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.nombre,
  p.sku,
  m.nombre as marca,
  c.nombre as categoria,
  c.slug as categoria_slug,
  s.nombre as subcategoria,
  s.slug as subcategoria_slug,
  p.precio,
  p.stock,
  p.descripcion,
  p.caracteristicas,
  p.youtube_video_id,
  p.destacado,
  p.activo,
  imagen_principal.cloudinary_secure_url as imagen_principal,
  imagen_principal.alt as imagen_alt
from public.productos p
join public.categorias c on c.id = p.categoria_id
left join public.subcategorias s on s.id = p.subcategoria_id
left join public.marcas m on m.id = p.marca_id
left join lateral (
  select cloudinary_secure_url, alt
  from public.producto_imagenes pi
  where pi.producto_id = p.id
    and pi.activo = true
  order by pi.principal desc, pi.orden asc
  limit 1
) imagen_principal on true
where p.activo = true;

create or replace view public.productos_admin
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.nombre,
  p.sku,
  p.precio,
  p.stock,
  p.destacado,
  p.activo,
  c.nombre as categoria,
  s.nombre as subcategoria,
  m.nombre as marca,
  count(pi.id) filter (where pi.activo = true) as cantidad_imagenes,
  bool_or(pi.principal and pi.activo) as tiene_imagen_principal
from public.productos p
join public.categorias c on c.id = p.categoria_id
left join public.subcategorias s on s.id = p.subcategoria_id
left join public.marcas m on m.id = p.marca_id
left join public.producto_imagenes pi on pi.producto_id = p.id
group by p.id, c.nombre, s.nombre, m.nombre;

create or replace view public.pedidos_admin
with (security_invoker = true) as
select
  p.id,
  p.codigo,
  p.cliente_id,
  p.cliente_nombre_completo,
  p.cliente_celular,
  p.cliente_ciudad,
  p.estado,
  p.tipo_entrega,
  p.subtotal,
  p.envio,
  p.total,
  p.creado_en,
  count(pi.id) as cantidad_lineas,
  coalesce(sum(pi.cantidad), 0) as cantidad_productos
from public.pedidos p
left join public.pedido_items pi on pi.pedido_id = p.id
group by p.id;

create or replace view public.mis_pedidos
with (security_invoker = true) as
select
  p.id,
  p.codigo,
  p.estado,
  p.tipo_entrega,
  p.subtotal,
  p.envio,
  p.total,
  p.creado_en,
  p.cliente_id,
  count(pi.id) as cantidad_lineas,
  coalesce(sum(pi.cantidad), 0) as cantidad_productos
from public.pedidos p
left join public.pedido_items pi on pi.pedido_id = p.id
where p.cliente_id = auth.uid()
group by p.id;

commit;
