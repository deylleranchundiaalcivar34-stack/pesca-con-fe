-- PayPhone durable: una señal externa se conserva antes de consultar al proveedor,
-- cerrar la cajita no borra el pedido y los fallos transitorios pueden reintentarse.

alter table private.intentos_pago
  add column if not exists provider_notificado_id bigint,
  add column if not exists notificado_en timestamptz,
  add column if not exists intentos_confirmacion integer not null default 0,
  add column if not exists proximo_reintento_en timestamptz,
  add column if not exists motivo_revision text;

alter table private.intentos_pago
  drop constraint if exists intentos_pago_estado_check;
alter table private.intentos_pago
  add constraint intentos_pago_estado_check check (
    estado in (
      'pendiente', 'preparado', 'cancelacion_solicitada', 'aprobado',
      'cancelado', 'fallido', 'expirado', 'requiere_revision'
    )
  );

alter table public.pedidos
  drop constraint if exists pedidos_estado_pago_check;
alter table public.pedidos
  add constraint pedidos_estado_pago_check check (
    estado_pago in (
      'pendiente', 'preparando', 'preparado', 'aprobado', 'cancelado',
      'fallido', 'expirado', 'requiere_revision'
    )
  );

create unique index if not exists intentos_pago_provider_notificado_unique
  on private.intentos_pago (provider_notificado_id)
  where provider_notificado_id is not null;
create index if not exists intentos_pago_reconciliacion_idx
  on private.intentos_pago (proximo_reintento_en, creado_en)
  where provider_notificado_id is not null and estado <> 'aprobado';

create or replace function public.registrar_senal_payphone_servidor(
  client_transaction_id_input text,
  provider_payment_id_input bigint
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  intento private.intentos_pago%rowtype;
  intento_duplicado uuid;
begin
  if char_length(client_transaction_id_input) not between 1 and 50
    or provider_payment_id_input <= 0 then
    return 'invalida';
  end if;

  select ip.* into intento
  from private.intentos_pago ip
  where ip.client_transaction_id = client_transaction_id_input
  for update;

  if not found then
    return 'no_encontrada';
  end if;

  select ip.id into intento_duplicado
  from private.intentos_pago ip
  where ip.provider_notificado_id = provider_payment_id_input
    and ip.id <> intento.id
  limit 1;

  if intento_duplicado is not null
    or (
      intento.provider_notificado_id is not null
      and intento.provider_notificado_id <> provider_payment_id_input
    )
    or (
      intento.provider_transaction_id is not null
      and intento.provider_transaction_id <> provider_payment_id_input
    ) then
    update private.intentos_pago
    set estado = 'requiere_revision',
        motivo_revision = 'Identificador PayPhone conflictivo',
        actualizado_en = now()
    where id = intento.id;

    update public.pedidos
    set estado_pago = 'requiere_revision'
    where id = intento.pedido_id;

    perform private.registrar_auditoria_interna(
      'payphone.signal_conflict', 'intento_pago', intento.id::text, 'revision',
      jsonb_build_object('provider_payment_id', provider_payment_id_input)
    );
    return 'conflicto';
  end if;

  update private.intentos_pago
  set provider_notificado_id = provider_payment_id_input,
      notificado_en = coalesce(notificado_en, now()),
      proximo_reintento_en = now(),
      actualizado_en = now()
  where id = intento.id;

  perform private.registrar_auditoria_interna(
    'payphone.signal_received', 'intento_pago', intento.id::text, 'ok',
    jsonb_build_object('provider_payment_id', provider_payment_id_input)
  );

  return case when intento.estado = 'aprobado' then 'aprobada' else 'registrada' end;
end;
$$;

revoke all on function public.registrar_senal_payphone_servidor(text, bigint)
  from public, anon, authenticated;
grant execute on function public.registrar_senal_payphone_servidor(text, bigint)
  to service_role;

create or replace function public.marcar_fallo_confirmacion_payphone_servidor(
  client_transaction_id_input text,
  motivo_input text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  intento_id_encontrado uuid;
  pedido_id_encontrado uuid;
  numero_intentos integer;
begin
  update private.intentos_pago
  set intentos_confirmacion = intentos_confirmacion + 1,
      estado = case when intentos_confirmacion + 1 >= 12
        then 'requiere_revision' else estado end,
      proximo_reintento_en = case when intentos_confirmacion + 1 >= 12
        then null
        else now()
          + least(300, (power(2, least(intentos_confirmacion + 1, 8)))::integer)
            * interval '1 second'
        end,
      motivo_revision = left(nullif(motivo_input, ''), 500),
      actualizado_en = now()
  where client_transaction_id = client_transaction_id_input
    and estado in ('pendiente', 'preparado', 'cancelacion_solicitada', 'expirado')
  returning id, pedido_id, intentos_confirmacion
    into intento_id_encontrado, pedido_id_encontrado, numero_intentos;

  if intento_id_encontrado is not null then
    if numero_intentos >= 12 then
      update public.pedidos
      set estado_pago = 'requiere_revision'
      where id = pedido_id_encontrado and estado_pago <> 'aprobado';
    end if;

    perform private.registrar_auditoria_interna(
      'payphone.confirm_retry', 'intento_pago', intento_id_encontrado::text,
      case when numero_intentos >= 12 then 'revision' else 'error' end,
      jsonb_build_object('intento', numero_intentos)
    );
  end if;
end;
$$;

revoke all on function public.marcar_fallo_confirmacion_payphone_servidor(text, text)
  from public, anon, authenticated;
grant execute on function public.marcar_fallo_confirmacion_payphone_servidor(text, text)
  to service_role;

create or replace function public.marcar_revision_payphone_servidor(
  client_transaction_id_input text,
  provider_payment_id_input bigint,
  motivo_input text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  intento private.intentos_pago%rowtype;
begin
  update private.intentos_pago
  set estado = 'requiere_revision',
      provider_notificado_id = coalesce(provider_notificado_id, provider_payment_id_input),
      motivo_revision = left(coalesce(nullif(motivo_input, ''), 'Discrepancia de pago'), 500),
      proximo_reintento_en = null,
      actualizado_en = now()
  where client_transaction_id = client_transaction_id_input
    and estado <> 'aprobado'
  returning * into intento;

  if not found then return; end if;

  update public.pedidos
  set estado_pago = 'requiere_revision'
  where id = intento.pedido_id and estado_pago <> 'aprobado';

  perform private.registrar_auditoria_interna(
    'payphone.requires_review', 'intento_pago', intento.id::text, 'revision',
    jsonb_build_object('provider_payment_id', provider_payment_id_input)
  );
end;
$$;

revoke all on function public.marcar_revision_payphone_servidor(text, bigint, text)
  from public, anon, authenticated;
grant execute on function public.marcar_revision_payphone_servidor(text, bigint, text)
  to service_role;

create or replace function public.listar_intentos_payphone_reconciliar_servidor(
  limite_input integer default 25
)
returns table (
  client_transaction_id text,
  provider_payment_id bigint,
  pedido_codigo text,
  intentos integer
)
language sql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
  select ip.client_transaction_id, ip.provider_notificado_id, p.codigo,
         ip.intentos_confirmacion
  from private.intentos_pago ip
  join public.pedidos p on p.id = ip.pedido_id
  where ip.provider_notificado_id is not null
    and ip.estado in ('pendiente', 'preparado', 'cancelacion_solicitada', 'expirado')
    and coalesce(ip.proximo_reintento_en, now()) <= now()
    and ip.intentos_confirmacion < 12
  order by coalesce(ip.proximo_reintento_en, ip.notificado_en, ip.creado_en)
  limit least(greatest(limite_input, 1), 100);
$$;

revoke all on function public.listar_intentos_payphone_reconciliar_servidor(integer)
  from public, anon, authenticated;
grant execute on function public.listar_intentos_payphone_reconciliar_servidor(integer)
  to service_role;

-- Cerrar la cajita es una intención del cliente, no evidencia del estado bancario.
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
  select ip.* into intento
  from private.intentos_pago ip
  where ip.client_transaction_id = client_transaction_id_input
    and (cliente_id_input is null or ip.cliente_id = cliente_id_input)
  for update;

  if not found or intento.estado not in ('pendiente', 'preparado', 'cancelacion_solicitada') then
    return false;
  end if;

  update private.intentos_pago
  set estado = 'cancelacion_solicitada',
      codigo_error = coalesce(codigo_error, 'CLIENT_CLOSED_BOX'),
      mensaje_error = coalesce(mensaje_error, 'El cliente cerró la cajita'),
      actualizado_en = now()
  where id = intento.id;

  perform private.registrar_auditoria_interna(
    'payphone.cancel_requested', 'intento_pago', intento.id::text, 'ok', '{}'::jsonb
  );

  return true;
end;
$$;

revoke all on function public.descartar_intento_payphone_servidor(text, uuid)
  from public, anon, authenticated;
grant execute on function public.descartar_intento_payphone_servidor(text, uuid)
  to service_role;

create or replace function public.cancelar_intento_payphone(
  client_transaction_id_input text,
  estado_input text,
  codigo_error_input text default null,
  mensaje_error_input text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  intento private.intentos_pago%rowtype;
  estado_normalizado text;
begin
  estado_normalizado := case
    when estado_input = 'cancelado' then 'cancelado'
    when estado_input = 'expirado' then 'expirado'
    else 'fallido'
  end;

  update private.intentos_pago
  set estado = estado_normalizado,
      codigo_error = left(nullif(codigo_error_input, ''), 100),
      mensaje_error = left(nullif(mensaje_error_input, ''), 500),
      proximo_reintento_en = null,
      actualizado_en = now()
  where client_transaction_id = client_transaction_id_input
    and estado in ('pendiente', 'preparado', 'cancelacion_solicitada', 'expirado')
  returning * into intento;

  if not found then return; end if;

  update private.reservas_stock
  set liberada_en = now()
  where pedido_id = intento.pedido_id
    and consumida_en is null
    and liberada_en is null;

  update public.pedidos
  set estado_pago = estado_normalizado,
      estado = 'cancelado'
  where id = intento.pedido_id
    and estado = 'pendiente_pago';

  perform private.registrar_auditoria_interna(
    'payphone.' || estado_normalizado, 'intento_pago', intento.id::text, 'ok', '{}'::jsonb
  );
end;
$$;

revoke all on function public.cancelar_intento_payphone(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.cancelar_intento_payphone(text, text, text, text)
  to service_role;

create or replace function public.finalizar_pago_payphone(
  client_transaction_id_input text,
  provider_payment_id_input bigint,
  monto_centavos_input bigint,
  store_id_input text default null,
  codigo_autorizacion_input text default null
)
returns table(pedido_id uuid, pedido_codigo text, ya_confirmado boolean)
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  intento private.intentos_pago%rowtype;
  reserva private.reservas_stock%rowtype;
  codigo_pedido text;
begin
  select ip.* into intento
  from private.intentos_pago ip
  where ip.client_transaction_id = client_transaction_id_input
  for update;

  if not found then raise exception 'El intento de pago no existe'; end if;

  select p.codigo into codigo_pedido
  from public.pedidos p where p.id = intento.pedido_id for update;

  if intento.estado = 'aprobado' then
    if intento.provider_transaction_id <> provider_payment_id_input
      or intento.monto_centavos <> monto_centavos_input then
      raise exception 'La confirmación repetida no coincide con el pago registrado';
    end if;
    return query select intento.pedido_id, codigo_pedido, true;
    return;
  end if;

  if intento.monto_centavos <> monto_centavos_input then
    raise exception 'El monto confirmado por PayPhone no coincide con el pedido';
  end if;

  if intento.provider_notificado_id is not null
    and intento.provider_notificado_id <> provider_payment_id_input then
    raise exception 'El identificador confirmado no coincide con la notificación';
  end if;

  for reserva in
    select rs.* from private.reservas_stock rs
    where rs.intento_id = intento.id and rs.consumida_en is null
    order by rs.producto_id, rs.variante_id nulls first
    for update
  loop
    if reserva.variante_id is not null then
      update public.producto_variantes
      set stock = stock - reserva.cantidad, actualizado_en = now()
      where id = reserva.variante_id
        and producto_id = reserva.producto_id
        and stock >= reserva.cantidad;
    else
      update public.productos
      set stock = stock - reserva.cantidad
      where id = reserva.producto_id and stock >= reserva.cantidad;
    end if;

    if not found then
      raise exception 'No existe stock suficiente para completar el pago';
    end if;

    update private.reservas_stock
    set consumida_en = now(), liberada_en = null
    where id = reserva.id;
  end loop;

  update private.intentos_pago
  set estado = 'aprobado',
      provider_transaction_id = provider_payment_id_input,
      provider_notificado_id = coalesce(provider_notificado_id, provider_payment_id_input),
      store_id = left(nullif(store_id_input, ''), 200),
      codigo_autorizacion = left(nullif(codigo_autorizacion_input, ''), 200),
      confirmado_en = now(), proximo_reintento_en = null,
      motivo_revision = null, actualizado_en = now()
  where id = intento.id;

  update public.pedidos
  set estado = 'pagado_confirmado', estado_pago = 'aprobado',
      pagado_en = coalesce(pagado_en, now()), confirmado_por = null
  where id = intento.pedido_id and estado = 'pendiente_pago';

  if not found then raise exception 'El pedido no está pendiente de pago'; end if;

  perform private.registrar_auditoria_interna(
    'payphone.approved', 'intento_pago', intento.id::text, 'ok',
    jsonb_build_object('provider_payment_id', provider_payment_id_input)
  );

  return query select intento.pedido_id, codigo_pedido, false;
end;
$$;

revoke all on function public.finalizar_pago_payphone(text, bigint, bigint, text, text)
  from public, anon, authenticated;
grant execute on function public.finalizar_pago_payphone(text, bigint, bigint, text, text)
  to service_role;

create or replace function private.expirar_intentos_payphone()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  pedidos_expirados uuid[];
begin
  select coalesce(array_agg(ip.pedido_id), '{}'::uuid[])
  into pedidos_expirados
  from private.intentos_pago ip
  where ip.estado in ('pendiente', 'preparado', 'cancelacion_solicitada')
    and ip.provider_notificado_id is null
    and ip.expira_en + interval '5 minutes' <= now();

  if cardinality(pedidos_expirados) = 0 then return; end if;

  update private.intentos_pago
  set estado = 'expirado', codigo_error = coalesce(codigo_error, 'RESERVA_EXPIRADA'),
      mensaje_error = coalesce(mensaje_error, 'La reserva de stock expiró'),
      actualizado_en = now()
  where pedido_id = any(pedidos_expirados)
    and estado in ('pendiente', 'preparado', 'cancelacion_solicitada');

  update private.reservas_stock
  set liberada_en = now()
  where pedido_id = any(pedidos_expirados)
    and consumida_en is null and liberada_en is null;

  update public.pedidos
  set estado_pago = 'expirado', estado = 'cancelado'
  where id = any(pedidos_expirados)
    and metodo_pago = 'payphone' and estado = 'pendiente_pago';
end;
$$;

revoke all on function private.expirar_intentos_payphone() from public, anon, authenticated;

create or replace function public.expirar_intentos_payphone_servidor()
returns void
language sql
security definer
set search_path = pg_catalog, private, pg_temp
as $$
  select private.expirar_intentos_payphone();
$$;

revoke all on function public.expirar_intentos_payphone_servidor()
  from public, anon, authenticated;
grant execute on function public.expirar_intentos_payphone_servidor() to service_role;
