-- La aplicacion usa exclusivamente el wrapper que incorpora el recargo. La funcion
-- base sigue siendo interna para conservar la logica atomica de reserva de stock.
revoke execute on function public.crear_pedido_payphone(jsonb)
  from public, anon, authenticated;

-- Las ventas fisicas requieren una sesion administrativa. El REVOKE a PUBLIC de la
-- migracion original no retiro el grant directo que Supabase asigno al rol anon.
revoke execute on function public.registrar_venta_fisica(jsonb, text, text)
  from public, anon;
grant execute on function public.registrar_venta_fisica(jsonb, text, text)
  to authenticated;
alter function public.registrar_venta_fisica(jsonb, text, text)
  set search_path = pg_catalog, public, private, pg_temp;

-- Las funciones de trigger no forman parte de la API REST y no deben invocarse
-- directamente. Los triggers conservan su funcionamiento sin estos grants.
revoke execute on function public.set_catalogo_nodos_actualizado_en()
  from public, anon, authenticated;
revoke execute on function public.set_producto_variantes_actualizado_en()
  from public, anon, authenticated;

-- Confirma exclusivamente transferencias manuales y registra el momento real del
-- cobro. PayPhone solo puede aprobarse mediante su callback verificado.
create or replace function public.confirmar_pago_pedido(pedido_id_input uuid)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, private, pg_temp
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

  if pedido_record.metodo_pago <> 'transferencia' then
    raise exception 'Los pagos PayPhone solo se confirman mediante PayPhone';
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
      estado_pago = 'aprobado',
      pagado_en = now(),
      confirmado_por = auth.uid()
  where id = pedido_id_input;
end;
$$;

revoke execute on function public.confirmar_pago_pedido(uuid) from public, anon;
grant execute on function public.confirmar_pago_pedido(uuid) to authenticated;

-- El unico cobro por transferencia historico fue confirmado antes de existir
-- pagado_en. Se conserva creado_en como la mejor marca temporal disponible.
update public.pedidos
set estado_pago = 'aprobado',
    pagado_en = coalesce(pagado_en, creado_en)
where metodo_pago = 'transferencia'
  and estado in ('pagado_confirmado', 'listo_retiro', 'retirado', 'enviado')
  and (estado_pago <> 'aprobado' or pagado_en is null);
