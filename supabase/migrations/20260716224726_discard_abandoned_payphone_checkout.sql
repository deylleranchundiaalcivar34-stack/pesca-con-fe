-- Un intento abandonado no debe aparecer como pedido ni retener inventario.
-- Solo se elimina mientras PayPhone todavía no haya aprobado el cobro.
create or replace function public.descartar_intento_payphone(
  client_transaction_id_input text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  intento private.intentos_pago%rowtype;
begin
  if auth.uid() is null then
    return false;
  end if;

  select ip.*
    into intento
  from private.intentos_pago as ip
  where ip.client_transaction_id = client_transaction_id_input
    and ip.cliente_id = auth.uid()
  for update;

  if not found or intento.estado not in ('pendiente', 'preparado') then
    return false;
  end if;

  delete from public.pedidos as pedido
  where pedido.id = intento.pedido_id
    and pedido.cliente_id = auth.uid()
    and pedido.estado = 'pendiente_pago';

  return found;
end;
$$;

-- Este uso es exclusivamente para el callback verificado del servidor, cuando
-- PayPhone comunica que el pago fue cancelado o no aprobado.
create or replace function public.descartar_intento_payphone_servidor(
  client_transaction_id_input text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  intento private.intentos_pago%rowtype;
begin
  select ip.*
    into intento
  from private.intentos_pago as ip
  where ip.client_transaction_id = client_transaction_id_input
  for update;

  if not found or intento.estado not in ('pendiente', 'preparado') then
    return false;
  end if;

  delete from public.pedidos as pedido
  where pedido.id = intento.pedido_id
    and pedido.estado = 'pendiente_pago';

  return found;
end;
$$;

revoke all on function public.descartar_intento_payphone(text) from public;
revoke all on function public.descartar_intento_payphone_servidor(text) from public;
grant execute on function public.descartar_intento_payphone(text) to authenticated;
grant execute on function public.descartar_intento_payphone_servidor(text) to service_role;
