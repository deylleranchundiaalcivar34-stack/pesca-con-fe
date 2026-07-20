-- Registra ventas realizadas en el local sin mezclarlas con los pedidos online.
create sequence if not exists public.ventas_fisicas_codigo_seq;

create table if not exists public.ventas_fisicas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default ('VF-' || lpad(nextval('public.ventas_fisicas_codigo_seq')::text, 6, '0')),
  nota text,
  metodo_pago text not null default 'efectivo'
    check (metodo_pago in ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  subtotal numeric not null check (subtotal >= 0),
  total numeric not null check (total >= 0),
  creado_por uuid not null references auth.users(id),
  creado_en timestamptz not null default now()
);

create table if not exists public.venta_fisica_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas_fisicas(id) on delete cascade,
  producto_id uuid not null references public.productos(id),
  variante_id uuid references public.producto_variantes(id),
  producto_nombre text not null,
  variante_nombre text,
  producto_sku text,
  precio numeric not null check (precio >= 0),
  cantidad integer not null check (cantidad > 0),
  total_linea numeric generated always as (precio * cantidad) stored,
  creado_en timestamptz not null default now()
);

create index if not exists ventas_fisicas_creado_en_idx on public.ventas_fisicas (creado_en desc);
create index if not exists venta_fisica_items_venta_id_idx on public.venta_fisica_items (venta_id);

alter table public.ventas_fisicas enable row level security;
alter table public.venta_fisica_items enable row level security;

create policy "Admins gestionan ventas fisicas"
  on public.ventas_fisicas for all to authenticated
  using ((select private.es_admin()))
  with check ((select private.es_admin()));

create policy "Admins gestionan items de ventas fisicas"
  on public.venta_fisica_items for all to authenticated
  using ((select private.es_admin()))
  with check ((select private.es_admin()));

-- Descuenta inventario y guarda toda la venta en una Ãºnica transacciÃ³n.
create or replace function public.registrar_venta_fisica(
  items_input jsonb,
  nota_input text default null,
  metodo_pago_input text default 'efectivo'
)
returns uuid
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  item jsonb;
  venta_id uuid;
  producto_record public.productos%rowtype;
  variante_record public.producto_variantes%rowtype;
  producto_id_input uuid;
  variante_id_input uuid;
  cantidad_input integer;
  precio_input numeric;
  subtotal_input numeric := 0;
begin
  if not private.es_admin() then
    raise exception 'No autorizado';
  end if;

  if jsonb_typeof(items_input) <> 'array' or jsonb_array_length(items_input) = 0 then
    raise exception 'Agrega al menos un producto a la venta';
  end if;

  if metodo_pago_input not in ('efectivo', 'transferencia', 'tarjeta', 'otro') then
    raise exception 'MÃ©todo de pago no vÃ¡lido';
  end if;

  insert into public.ventas_fisicas (nota, metodo_pago, subtotal, total, creado_por)
  values (nullif(btrim(nota_input), ''), metodo_pago_input, 0, 0, auth.uid())
  returning id into venta_id;

  for item in select value from jsonb_array_elements(items_input)
  loop
    begin
      producto_id_input := (item ->> 'productId')::uuid;
      variante_id_input := nullif(item ->> 'variantId', '')::uuid;
      cantidad_input := (item ->> 'quantity')::integer;
      precio_input := (item ->> 'price')::numeric;
    exception when others then
      raise exception 'Un artÃ­culo de la venta tiene datos invÃ¡lidos';
    end;

    if cantidad_input <= 0 or precio_input < 0 then
      raise exception 'Cantidad o precio invÃ¡lido';
    end if;

    select * into producto_record
    from public.productos
    where id = producto_id_input and activo = true
    for update;

    if not found then
      raise exception 'Producto no encontrado o inactivo';
    end if;

    if variante_id_input is not null then
      select * into variante_record
      from public.producto_variantes
      where id = variante_id_input and producto_id = producto_id_input and activo = true
      for update;

      if not found then
        raise exception 'Variante no encontrada o inactiva';
      end if;

      if variante_record.stock < cantidad_input then
        raise exception 'Stock insuficiente para %', producto_record.nombre || ' - ' || variante_record.nombre;
      end if;

      update public.producto_variantes
      set stock = variante_record.stock - cantidad_input,
          actualizado_en = now()
      where id = variante_id_input;
    else
      if producto_record.stock < cantidad_input then
        raise exception 'Stock insuficiente para %', producto_record.nombre;
      end if;

      update public.productos
      set stock = producto_record.stock - cantidad_input,
          actualizado_por = auth.uid()
      where id = producto_id_input;
    end if;

    insert into public.venta_fisica_items (
      venta_id, producto_id, variante_id, producto_nombre, variante_nombre,
      producto_sku, precio, cantidad
    ) values (
      venta_id, producto_id_input, variante_id_input, producto_record.nombre,
      case when variante_id_input is null then null else variante_record.nombre end,
      case when variante_id_input is null then producto_record.sku else variante_record.sku end,
      precio_input, cantidad_input
    );

    subtotal_input := subtotal_input + (precio_input * cantidad_input);
  end loop;

  update public.ventas_fisicas
  set subtotal = subtotal_input,
      total = subtotal_input
  where id = venta_id;

  return venta_id;
end;
$$;

revoke all on function public.registrar_venta_fisica(jsonb, text, text) from public;
grant execute on function public.registrar_venta_fisica(jsonb, text, text) to authenticated;
