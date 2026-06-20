-- Reinicia los datos operativos de Pesca Con Fe y simplifica el inventario.
-- Conserva usuarios, perfiles, categorias, subcategorias y marcas.
-- Ejecutar manualmente en Supabase SQL Editor despues de crear un respaldo.
-- Este script no elimina archivos en Cloudinary, solo sus referencias en Supabase.

begin;

-- El stock sigue actualizandose al confirmar o cancelar, pero sin guardar bitacora.
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

    update public.productos
    set stock = stock_actual - item_record.cantidad,
        actualizado_por = auth.uid()
    where id = item_record.producto_id;
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
security definer
set search_path = public
as $$
declare
  pedido_record public.pedidos%rowtype;
  item_record record;
  stock_actual integer;
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

drop table if exists public.movimientos_inventario;
drop type if exists public.tipo_movimiento_inventario;

alter table public.pedidos
  drop column if exists creado_por;

truncate table
  public.pedido_items,
  public.pedidos,
  public.producto_imagenes,
  public.productos,
  public.direcciones_cliente;

alter sequence if exists public.pedido_codigo_seq restart with 1001;

commit;

-- Verificacion opcional despues de ejecutar.
select 'perfiles_admin' as tabla, count(*) as registros from public.perfiles_admin
union all
select 'perfiles_cliente', count(*) from public.perfiles_cliente
union all
select 'direcciones_cliente', count(*) from public.direcciones_cliente
union all
select 'categorias', count(*) from public.categorias
union all
select 'subcategorias', count(*) from public.subcategorias
union all
select 'marcas', count(*) from public.marcas
union all
select 'productos', count(*) from public.productos
union all
select 'producto_imagenes', count(*) from public.producto_imagenes
union all
select 'pedidos', count(*) from public.pedidos
union all
select 'pedido_items', count(*) from public.pedido_items
order by tabla;
