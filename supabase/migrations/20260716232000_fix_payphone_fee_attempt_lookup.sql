-- Evita ambigüedad entre el campo retornado por la función y la columna del intento.
create or replace function public.crear_pedido_payphone_con_recargo(payload jsonb)
returns table(
  id uuid,
  codigo text,
  client_transaction_id text,
  amount_cents bigint,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  pedido_base record;
  recargo_centavos constant bigint := 45;
begin
  select * into pedido_base
  from public.crear_pedido_payphone(payload);

  update public.pedidos
  set recargo_pago = recargo_centavos::numeric / 100,
      total = total + (recargo_centavos::numeric / 100)
  where pedidos.id = pedido_base.id
    and pedidos.cliente_id = auth.uid();

  if not found then
    raise exception 'No se pudo aplicar el recargo de PayPhone';
  end if;

  update private.intentos_pago as intento
  set monto_centavos = intento.monto_centavos + recargo_centavos
  where intento.client_transaction_id = pedido_base.client_transaction_id
    and intento.cliente_id = auth.uid();

  if not found then
    raise exception 'No se pudo preparar el importe de PayPhone';
  end if;

  return query
  select
    pedido_base.id,
    pedido_base.codigo,
    pedido_base.client_transaction_id,
    pedido_base.amount_cents + recargo_centavos,
    pedido_base.expires_at;
end;
$$;

revoke all on function public.crear_pedido_payphone_con_recargo(jsonb) from public;
grant execute on function public.crear_pedido_payphone_con_recargo(jsonb) to authenticated;
