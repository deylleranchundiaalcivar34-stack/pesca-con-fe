-- Idempotencia transaccional: reintentar la misma solicitud no crea otro pedido.

alter table public.pedidos add column if not exists idempotency_key uuid;

create unique index if not exists pedidos_cliente_idempotency_unique
  on public.pedidos (cliente_id, idempotency_key)
  where cliente_id is not null and idempotency_key is not null;

create or replace function public.crear_pedido_web_idempotente(
  payload jsonb,
  idempotency_key_input uuid
)
returns table(id uuid, codigo text)
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  cliente_actual uuid := auth.uid();
  existente record;
  creado record;
begin
  if cliente_actual is null then raise exception 'Debes iniciar sesión'; end if;
  if idempotency_key_input is null then raise exception 'Solicitud inválida'; end if;

  perform pg_advisory_xact_lock(
    hashtextextended(cliente_actual::text || ':' || idempotency_key_input::text, 0)
  );

  select p.id, p.codigo into existente
  from public.pedidos p
  where p.cliente_id = cliente_actual and p.idempotency_key = idempotency_key_input;

  if found then
    if exists (
      select 1 from public.pedidos p
      where p.id = existente.id and p.metodo_pago <> 'transferencia'
    ) then
      raise exception 'La solicitud ya pertenece a otro método de pago';
    end if;
    return query select existente.id, existente.codigo;
    return;
  end if;

  select * into creado from public.crear_pedido_web(payload);
  update public.pedidos p
  set idempotency_key = idempotency_key_input
  where p.id = creado.id and p.cliente_id = cliente_actual;

  return query select creado.id, creado.codigo;
end;
$$;

create or replace function public.crear_pedido_payphone_idempotente(
  payload jsonb,
  idempotency_key_input uuid
)
returns table(
  id uuid,
  codigo text,
  client_transaction_id text,
  amount_cents bigint,
  expires_at timestamptz,
  estado_intento text
)
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  cliente_actual uuid := auth.uid();
  existente record;
  creado record;
begin
  if cliente_actual is null then raise exception 'Debes iniciar sesión'; end if;
  if idempotency_key_input is null then raise exception 'Solicitud inválida'; end if;

  perform pg_advisory_xact_lock(
    hashtextextended(cliente_actual::text || ':' || idempotency_key_input::text, 0)
  );

  select p.id, p.codigo, ip.client_transaction_id, ip.monto_centavos,
         ip.expira_en, ip.estado
  into existente
  from public.pedidos p
  join private.intentos_pago ip on ip.pedido_id = p.id
  where p.cliente_id = cliente_actual and p.idempotency_key = idempotency_key_input;

  if found then
    return query select existente.id, existente.codigo, existente.client_transaction_id,
      existente.monto_centavos, existente.expira_en, existente.estado;
    return;
  end if;

  if exists (
    select 1 from public.pedidos p
    where p.cliente_id = cliente_actual and p.idempotency_key = idempotency_key_input
  ) then
    raise exception 'La solicitud ya pertenece a otro método de pago';
  end if;

  select * into creado from public.crear_pedido_payphone_con_recargo(payload);
  update public.pedidos p
  set idempotency_key = idempotency_key_input
  where p.id = creado.id and p.cliente_id = cliente_actual;

  return query select creado.id, creado.codigo, creado.client_transaction_id,
    creado.amount_cents, creado.expires_at, 'pendiente'::text;
end;
$$;

-- Las RPC anteriores permanecen temporalmente disponibles para la versión productiva
-- previa. La migración contractual 175000 las revoca después del despliegue.
revoke all on function public.crear_pedido_web_idempotente(jsonb, uuid)
  from public, anon;
revoke all on function public.crear_pedido_payphone_idempotente(jsonb, uuid)
  from public, anon;
grant execute on function public.crear_pedido_web_idempotente(jsonb, uuid)
  to authenticated, service_role;
grant execute on function public.crear_pedido_payphone_idempotente(jsonb, uuid)
  to authenticated, service_role;
