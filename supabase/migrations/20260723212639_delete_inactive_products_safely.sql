-- Elimina definitivamente productos inactivos solo cuando no forman parte del
-- historial comercial ni tienen una reserva de stock vigente. La validacion y
-- el DELETE viven en la misma transaccion para evitar condiciones de carrera.
create or replace function private.eliminar_producto_inactivo(
  producto_id_input uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, private, public, pg_temp
as $$
declare
  producto_activo boolean;
  cloudinary_public_ids text[];
begin
  if not private.tiene_permiso('catalog.write', true) then
    raise exception using
      errcode = '42501',
      message = 'No autorizado para eliminar productos.';
  end if;

  select p.activo
  into producto_activo
  from public.productos as p
  where p.id = producto_id_input
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if producto_activo then
    return jsonb_build_object('status', 'active');
  end if;

  if exists (
    select 1
    from private.reservas_stock as rs
    where rs.producto_id = producto_id_input
      and rs.consumida_en is null
      and rs.liberada_en is null
      and rs.expira_en > now()
  ) then
    return jsonb_build_object('status', 'active_reservation');
  end if;

  if exists (
    select 1
    from public.pedido_items as pi
    where pi.producto_id = producto_id_input
  ) then
    return jsonb_build_object('status', 'order_history');
  end if;

  if exists (
    select 1
    from public.venta_fisica_items as vfi
    where vfi.producto_id = producto_id_input
  ) then
    return jsonb_build_object('status', 'sale_history');
  end if;

  select coalesce(
    array_agg(pi.cloudinary_public_id order by pi.orden)
      filter (where pi.cloudinary_public_id is not null),
    array[]::text[]
  )
  into cloudinary_public_ids
  from public.producto_imagenes as pi
  where pi.producto_id = producto_id_input;

  delete from public.productos
  where id = producto_id_input
    and activo = false;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  return jsonb_build_object(
    'status', 'deleted',
    'cloudinary_public_ids', to_jsonb(cloudinary_public_ids)
  );
end;
$$;

revoke all on function private.eliminar_producto_inactivo(uuid)
  from public, anon, authenticated;
grant execute on function private.eliminar_producto_inactivo(uuid)
  to authenticated, service_role;

-- El wrapper permanece SECURITY INVOKER y solo expone la operacion por RPC.
-- La funcion privilegiada se conserva en el esquema privado y repite la
-- autorizacion dentro de la transaccion.
create or replace function public.eliminar_producto_inactivo(
  producto_id_input uuid
)
returns jsonb
language sql
volatile
security invoker
set search_path = pg_catalog, private, public, pg_temp
as $$
  select private.eliminar_producto_inactivo(producto_id_input);
$$;

revoke all on function public.eliminar_producto_inactivo(uuid)
  from public, anon;
grant execute on function public.eliminar_producto_inactivo(uuid)
  to authenticated;
