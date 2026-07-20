-- PayPhone usa dos identificadores distintos:
-- paymentId (alfanumÃ©rico, devuelto por Prepare) y transactionId (numÃ©rico,
-- recibido/confirmado al finalizar la transacciÃ³n).

alter table private.intentos_pago
  rename column provider_payment_id to provider_prepare_id;

alter table private.intentos_pago
  alter column provider_prepare_id type text using provider_prepare_id::text,
  add column provider_transaction_id bigint;

alter table private.intentos_pago
  drop constraint if exists intentos_pago_provider_payment_id_key;

create unique index if not exists intentos_pago_provider_prepare_id_key
  on private.intentos_pago (provider_prepare_id)
  where provider_prepare_id is not null;

create unique index if not exists intentos_pago_provider_transaction_id_key
  on private.intentos_pago (provider_transaction_id)
  where provider_transaction_id is not null;

drop function if exists public.registrar_preparacion_payphone(text, bigint);

create function public.registrar_preparacion_payphone(
  client_transaction_id_input text,
  provider_prepare_id_input text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  pedido_encontrado uuid;
begin
  if nullif(trim(provider_prepare_id_input), '') is null then
    raise exception 'PayPhone no devolviÃ³ un identificador de preparaciÃ³n vÃ¡lido';
  end if;

  update private.intentos_pago
  set provider_prepare_id = left(trim(provider_prepare_id_input), 200),
      estado = 'preparado',
      preparado_en = now(),
      actualizado_en = now()
  where client_transaction_id = client_transaction_id_input
    and estado = 'pendiente'
    and expira_en > now()
  returning pedido_id into pedido_encontrado;

  if pedido_encontrado is null then
    raise exception 'El intento de pago no estÃ¡ disponible para preparaciÃ³n';
  end if;

  update public.pedidos
  set estado_pago = 'preparado'
  where id = pedido_encontrado;
end;
$$;

revoke all on function public.registrar_preparacion_payphone(text, text)
  from public, anon, authenticated;
grant execute on function public.registrar_preparacion_payphone(text, text)
  to service_role;

drop function if exists public.obtener_intento_payphone(text);

create function public.obtener_intento_payphone(
  client_transaction_id_input text
)
returns table (
  pedido_id uuid,
  pedido_codigo text,
  cliente_id uuid,
  provider_prepare_id text,
  provider_transaction_id bigint,
  estado text,
  monto_centavos bigint,
  moneda text,
  expira_en timestamptz
)
language sql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
  select
    ip.pedido_id,
    p.codigo,
    ip.cliente_id,
    ip.provider_prepare_id,
    ip.provider_transaction_id,
    ip.estado,
    ip.monto_centavos,
    ip.moneda,
    ip.expira_en
  from private.intentos_pago as ip
  join public.pedidos as p on p.id = ip.pedido_id
  where ip.client_transaction_id = client_transaction_id_input;
$$;

revoke all on function public.obtener_intento_payphone(text)
  from public, anon, authenticated;
grant execute on function public.obtener_intento_payphone(text)
  to service_role;

create or replace function public.finalizar_pago_payphone(
  client_transaction_id_input text,
  provider_payment_id_input bigint,
  monto_centavos_input bigint,
  store_id_input text default null,
  codigo_autorizacion_input text default null
)
returns table (
  pedido_id uuid,
  pedido_codigo text,
  ya_confirmado boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  intento private.intentos_pago%rowtype;
  reserva private.reservas_stock%rowtype;
  codigo_pedido text;
begin
  select ip.*
    into intento
  from private.intentos_pago as ip
  where ip.client_transaction_id = client_transaction_id_input
  for update;

  if not found then
    raise exception 'El intento de pago no existe';
  end if;

  select p.codigo
    into codigo_pedido
  from public.pedidos as p
  where p.id = intento.pedido_id
  for update;

  if intento.estado = 'aprobado' then
    if intento.provider_transaction_id <> provider_payment_id_input
      or intento.monto_centavos <> monto_centavos_input then
      raise exception 'La confirmaciÃ³n repetida no coincide con el pago registrado';
    end if;

    return query select intento.pedido_id, codigo_pedido, true;
    return;
  end if;

  if intento.estado <> 'preparado' then
    raise exception 'El intento de pago no estÃ¡ preparado para confirmaciÃ³n';
  end if;

  if intento.monto_centavos <> monto_centavos_input then
    raise exception 'El monto confirmado por PayPhone no coincide con el pedido';
  end if;

  if intento.expira_en <= now() then
    raise exception 'La reserva de stock del pago expirÃ³';
  end if;

  for reserva in
    select rs.*
    from private.reservas_stock as rs
    where rs.intento_id = intento.id
      and rs.consumida_en is null
      and rs.liberada_en is null
    order by rs.producto_id, rs.variante_id nulls first
    for update
  loop
    if reserva.variante_id is not null then
      update public.producto_variantes
      set stock = stock - reserva.cantidad,
          actualizado_en = now()
      where id = reserva.variante_id
        and producto_id = reserva.producto_id
        and stock >= reserva.cantidad;
    else
      update public.productos
      set stock = stock - reserva.cantidad
      where id = reserva.producto_id
        and stock >= reserva.cantidad;
    end if;

    if not found then
      raise exception 'No existe stock suficiente para completar el pago';
    end if;

    update private.reservas_stock
    set consumida_en = now()
    where id = reserva.id;
  end loop;

  update private.intentos_pago
  set estado = 'aprobado',
      provider_transaction_id = provider_payment_id_input,
      store_id = left(nullif(store_id_input, ''), 200),
      codigo_autorizacion = left(nullif(codigo_autorizacion_input, ''), 200),
      confirmado_en = now(),
      actualizado_en = now()
  where id = intento.id;

  update public.pedidos
  set estado = 'pagado_confirmado',
      estado_pago = 'aprobado',
      pagado_en = now(),
      confirmado_por = null
  where id = intento.pedido_id
    and estado = 'pendiente_pago';

  if not found then
    raise exception 'El pedido no estÃ¡ pendiente de pago';
  end if;

  return query select intento.pedido_id, codigo_pedido, false;
end;
$$;

revoke all on function public.finalizar_pago_payphone(text, bigint, bigint, text, text)
  from public, anon, authenticated;
grant execute on function public.finalizar_pago_payphone(text, bigint, bigint, text, text)
  to service_role;
