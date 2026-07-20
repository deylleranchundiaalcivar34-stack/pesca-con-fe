-- Fundacion segura para pagos PayPhone por redireccion.
-- Mantiene transferencia bancaria como flujo predeterminado y separa los
-- datos operativos del proveedor en el esquema privado.

alter table public.pedidos
  add column if not exists metodo_pago text not null default 'transferencia',
  add column if not exists proveedor_pago text,
  add column if not exists estado_pago text not null default 'pendiente',
  add column if not exists referencia_pago text,
  add column if not exists pagado_en timestamptz;

alter table public.pedidos
  drop constraint if exists pedidos_metodo_pago_check,
  add constraint pedidos_metodo_pago_check
    check (metodo_pago in ('transferencia', 'payphone')),
  drop constraint if exists pedidos_proveedor_pago_check,
  add constraint pedidos_proveedor_pago_check
    check (proveedor_pago is null or proveedor_pago = 'payphone'),
  drop constraint if exists pedidos_estado_pago_check,
  add constraint pedidos_estado_pago_check
    check (estado_pago in (
      'pendiente',
      'preparando',
      'preparado',
      'aprobado',
      'cancelado',
      'fallido',
      'expirado'
    ));

create index if not exists pedidos_metodo_estado_pago_idx
  on public.pedidos (metodo_pago, estado_pago, creado_en desc);

create schema if not exists private;

create table if not exists private.intentos_pago (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  cliente_id uuid not null references auth.users(id) on delete cascade,
  proveedor text not null default 'payphone'
    check (proveedor = 'payphone'),
  client_transaction_id text not null unique
    check (char_length(client_transaction_id) between 1 and 50),
  provider_payment_id bigint unique,
  estado text not null default 'pendiente'
    check (estado in (
      'pendiente',
      'preparado',
      'aprobado',
      'cancelado',
      'fallido',
      'expirado'
    )),
  monto_centavos bigint not null check (monto_centavos > 0),
  moneda text not null default 'USD' check (moneda = 'USD'),
  store_id text,
  codigo_autorizacion text,
  codigo_error text,
  mensaje_error text,
  expira_en timestamptz not null,
  preparado_en timestamptz,
  confirmado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists intentos_pago_pedido_activo_idx
  on private.intentos_pago (pedido_id)
  where estado in ('pendiente', 'preparado');

create index if not exists intentos_pago_expiracion_idx
  on private.intentos_pago (estado, expira_en)
  where estado in ('pendiente', 'preparado');

create table if not exists private.reservas_stock (
  id uuid primary key default gen_random_uuid(),
  intento_id uuid not null references private.intentos_pago(id) on delete cascade,
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete cascade,
  variante_id uuid references public.producto_variantes(id) on delete cascade,
  cantidad integer not null check (cantidad > 0),
  expira_en timestamptz not null,
  consumida_en timestamptz,
  liberada_en timestamptz,
  creado_en timestamptz not null default now(),
  check (not (consumida_en is not null and liberada_en is not null))
);

create index if not exists reservas_stock_producto_activa_idx
  on private.reservas_stock (producto_id, variante_id, expira_en)
  where consumida_en is null and liberada_en is null;

create index if not exists reservas_stock_intento_idx
  on private.reservas_stock (intento_id);

alter table private.intentos_pago enable row level security;
alter table private.reservas_stock enable row level security;

revoke all on table private.intentos_pago from public, anon, authenticated;
revoke all on table private.reservas_stock from public, anon, authenticated;

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
  from private.intentos_pago as ip
  where ip.estado in ('pendiente', 'preparado')
    and ip.expira_en <= now();

  if cardinality(pedidos_expirados) = 0 then
    return;
  end if;

  update private.intentos_pago
  set estado = 'expirado',
      codigo_error = coalesce(codigo_error, 'RESERVA_EXPIRADA'),
      mensaje_error = coalesce(mensaje_error, 'La reserva de stock expirÃ³'),
      actualizado_en = now()
  where pedido_id = any(pedidos_expirados)
    and estado in ('pendiente', 'preparado');

  update private.reservas_stock
  set liberada_en = now()
  where pedido_id = any(pedidos_expirados)
    and consumida_en is null
    and liberada_en is null;

  update public.pedidos
  set estado_pago = 'expirado',
      estado = 'cancelado'
  where id = any(pedidos_expirados)
    and metodo_pago = 'payphone'
    and estado = 'pendiente_pago';
end;
$$;

revoke all on function private.expirar_intentos_payphone() from public, anon, authenticated;

create or replace function public.crear_pedido_payphone(payload jsonb)
returns table (
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
  cliente_actual uuid := auth.uid();
  pedido_creado record;
  item_reserva record;
  intento_id_creado uuid;
  transaccion_cliente text;
  total_centavos bigint;
  expiracion timestamptz := now() + interval '10 minutes';
  stock_actual integer;
  stock_reservado integer;
begin
  if cliente_actual is null then
    raise exception 'Debes iniciar sesiÃ³n para pagar con PayPhone';
  end if;

  perform private.expirar_intentos_payphone();

  select pedido.id, pedido.codigo
    into pedido_creado
  from public.crear_pedido_web(payload) as pedido;

  select round(p.total * 100)::bigint
    into total_centavos
  from public.pedidos as p
  where p.id = pedido_creado.id
    and p.cliente_id = cliente_actual
  for update;

  if total_centavos is null or total_centavos <= 0 then
    raise exception 'El total del pedido no es vÃ¡lido para PayPhone';
  end if;

  transaccion_cliente := 'PCF-' || replace(pedido_creado.id::text, '-', '');

  update public.pedidos
  set metodo_pago = 'payphone',
      proveedor_pago = 'payphone',
      estado_pago = 'preparando',
      referencia_pago = transaccion_cliente
  where pedidos.id = pedido_creado.id;

  insert into private.intentos_pago (
    pedido_id,
    cliente_id,
    client_transaction_id,
    monto_centavos,
    expira_en
  )
  values (
    pedido_creado.id,
    cliente_actual,
    transaccion_cliente,
    total_centavos,
    expiracion
  )
  returning intentos_pago.id into intento_id_creado;

  for item_reserva in
    select
      pi.producto_id,
      pi.variante_id,
      sum(pi.cantidad)::integer as cantidad
    from public.pedido_items as pi
    where pi.pedido_id = pedido_creado.id
    group by pi.producto_id, pi.variante_id
  loop
    if item_reserva.producto_id is null then
      raise exception 'El pedido contiene un producto invÃ¡lido';
    end if;

    if item_reserva.variante_id is not null then
      select pv.stock
        into stock_actual
      from public.producto_variantes as pv
      where pv.id = item_reserva.variante_id
        and pv.producto_id = item_reserva.producto_id
        and pv.activo = true
      for update;

      if not found then
        raise exception 'La variante seleccionada ya no estÃ¡ disponible';
      end if;

      select coalesce(sum(rs.cantidad), 0)::integer
        into stock_reservado
      from private.reservas_stock as rs
      where rs.variante_id = item_reserva.variante_id
        and rs.consumida_en is null
        and rs.liberada_en is null
        and rs.expira_en > now();
    else
      select p.stock
        into stock_actual
      from public.productos as p
      where p.id = item_reserva.producto_id
        and p.activo = true
      for update;

      if not found then
        raise exception 'El producto seleccionado ya no estÃ¡ disponible';
      end if;

      select coalesce(sum(rs.cantidad), 0)::integer
        into stock_reservado
      from private.reservas_stock as rs
      where rs.producto_id = item_reserva.producto_id
        and rs.variante_id is null
        and rs.consumida_en is null
        and rs.liberada_en is null
        and rs.expira_en > now();
    end if;

    if stock_actual - stock_reservado < item_reserva.cantidad then
      raise exception 'Stock insuficiente para reservar el pedido';
    end if;

    insert into private.reservas_stock (
      intento_id,
      pedido_id,
      producto_id,
      variante_id,
      cantidad,
      expira_en
    )
    values (
      intento_id_creado,
      pedido_creado.id,
      item_reserva.producto_id,
      item_reserva.variante_id,
      item_reserva.cantidad,
      expiracion
    );
  end loop;

  return query
  select
    pedido_creado.id,
    pedido_creado.codigo,
    transaccion_cliente,
    total_centavos,
    expiracion;
end;
$$;

revoke all on function public.crear_pedido_payphone(jsonb) from public, anon;
grant execute on function public.crear_pedido_payphone(jsonb) to authenticated;

create or replace function public.registrar_preparacion_payphone(
  client_transaction_id_input text,
  provider_payment_id_input bigint
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  pedido_encontrado uuid;
begin
  update private.intentos_pago
  set provider_payment_id = provider_payment_id_input,
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

revoke all on function public.registrar_preparacion_payphone(text, bigint)
  from public, anon, authenticated;
grant execute on function public.registrar_preparacion_payphone(text, bigint)
  to service_role;

create or replace function public.obtener_intento_payphone(
  client_transaction_id_input text
)
returns table (
  pedido_id uuid,
  pedido_codigo text,
  cliente_id uuid,
  provider_payment_id bigint,
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
    ip.provider_payment_id,
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
  pedido_encontrado uuid;
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
      actualizado_en = now()
  where client_transaction_id = client_transaction_id_input
    and estado in ('pendiente', 'preparado')
  returning pedido_id into pedido_encontrado;

  if pedido_encontrado is null then
    return;
  end if;

  update private.reservas_stock
  set liberada_en = now()
  where pedido_id = pedido_encontrado
    and consumida_en is null
    and liberada_en is null;

  update public.pedidos
  set estado_pago = estado_normalizado,
      estado = 'cancelado'
  where id = pedido_encontrado
    and estado = 'pendiente_pago';
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
    if intento.provider_payment_id <> provider_payment_id_input
      or intento.monto_centavos <> monto_centavos_input then
      raise exception 'La confirmaciÃ³n repetida no coincide con el pago registrado';
    end if;

    return query select intento.pedido_id, codigo_pedido, true;
    return;
  end if;

  if intento.estado <> 'preparado' then
    raise exception 'El intento de pago no estÃ¡ preparado para confirmaciÃ³n';
  end if;

  if intento.provider_payment_id is distinct from provider_payment_id_input then
    raise exception 'El identificador de PayPhone no coincide';
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

comment on column public.pedidos.metodo_pago is
  'MÃ©todo elegido: transferencia bancaria o PayPhone.';
comment on table private.intentos_pago is
  'Estado tÃ©cnico mÃ­nimo de pagos; no almacena datos completos de tarjeta ni secretos.';
comment on table private.reservas_stock is
  'Reservas temporales de inventario para pagos PayPhone en curso.';
