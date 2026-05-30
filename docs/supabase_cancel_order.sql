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
            actualizado_por = auth.uid(),
            actualizado_en = now()
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
  set estado = 'cancelado',
      cancelado_en = now(),
      actualizado_en = now()
  where id = pedido_id_input;
end;
$$;
