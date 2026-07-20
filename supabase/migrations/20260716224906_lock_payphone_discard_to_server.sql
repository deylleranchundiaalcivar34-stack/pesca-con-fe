-- Reemplaza la primera versión por un único RPC exclusivo del servidor.
drop function if exists public.descartar_intento_payphone(text);
drop function if exists public.descartar_intento_payphone_servidor(text);

create or replace function public.descartar_intento_payphone_servidor(
  client_transaction_id_input text,
  cliente_id_input uuid default null
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
    and (cliente_id_input is null or ip.cliente_id = cliente_id_input)
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

revoke all on function public.descartar_intento_payphone_servidor(text, uuid) from public, anon, authenticated;
grant execute on function public.descartar_intento_payphone_servidor(text, uuid) to service_role;
