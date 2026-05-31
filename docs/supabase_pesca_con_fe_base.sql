-- Base de datos Supabase para Pesca Con Fe
-- Modelo simplificado para instalaciones nuevas.
-- Ejecutar en Supabase SQL Editor.
-- Nota: auth.users pertenece a Supabase Auth y no debe crearse manualmente.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create type estado_pedido as enum (
  'pendiente_pago',
  'pagado_confirmado',
  'listo_retiro',
  'retirado',
  'enviado',
  'cancelado'
);

create type tipo_entrega as enum (
  'envio_servientrega',
  'retiro_local'
);

create type tipo_movimiento_inventario as enum (
  'venta_confirmada',
  'venta_manual',
  'ajuste_manual',
  'reposicion',
  'reversion_cancelacion'
);

create or replace function public.es_cedula_ecuatoriana(valor text)
returns boolean
language plpgsql
immutable
as $$
declare
  cedula text;
  provincia int;
  suma int := 0;
  digito int;
  coef int;
  i int;
begin
  cedula := regexp_replace(coalesce(valor, ''), '\D', '', 'g');

  if length(cedula) <> 10 then
    return false;
  end if;

  provincia := substring(cedula from 1 for 2)::int;
  if provincia < 1 or provincia > 24 then
    return false;
  end if;

  if substring(cedula from 3 for 1)::int > 6 then
    return false;
  end if;

  for i in 1..9 loop
    coef := case when i % 2 = 1 then 2 else 1 end;
    digito := substring(cedula from i for 1)::int * coef;
    if digito >= 10 then
      digito := digito - 9;
    end if;
    suma := suma + digito;
  end loop;

  return ((10 - (suma % 10)) % 10) = substring(cedula from 10 for 1)::int;
end;
$$;

create sequence if not exists public.pedido_codigo_seq start 1001;

create or replace function public.siguiente_codigo_pedido()
returns text
language sql
as $$
  select 'PCF-' || nextval('public.pedido_codigo_seq')::text;
$$;

create table public.perfiles_admin (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  rol text not null default 'admin' check (rol in ('dueno', 'admin', 'vendedor')),
  activo boolean not null default true
);

create or replace function public.es_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles_admin
    where id = auth.uid()
      and activo = true
      and rol in ('dueno', 'admin', 'vendedor')
  );
$$;

create table public.perfiles_cliente (
  id uuid primary key references auth.users(id) on delete cascade,
  nombres text not null,
  apellidos text not null,
  nombre_completo text generated always as (trim(nombres || ' ' || apellidos)) stored,
  cedula text not null check (public.es_cedula_ecuatoriana(cedula)),
  celular text not null,
  correo citext not null
);

create unique index perfiles_cliente_cedula_unique
  on public.perfiles_cliente(cedula);

create unique index perfiles_cliente_correo_unique
  on public.perfiles_cliente(correo);

create or replace function public.crear_perfil_cliente_desde_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles_cliente (
    id,
    nombres,
    apellidos,
    cedula,
    celular,
    correo
  )
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'cedula',
    new.raw_user_meta_data->>'phone',
    new.email
  )
  on conflict (id) do update
  set nombres = excluded.nombres,
      apellidos = excluded.apellidos,
      cedula = excluded.cedula,
      celular = excluded.celular,
      correo = excluded.correo;

  return new;
end;
$$;

create trigger crear_perfil_cliente_al_registrarse
after insert on auth.users
for each row execute function public.crear_perfil_cliente_desde_auth();

create table public.direcciones_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references auth.users(id) on delete cascade,
  alias text not null default 'Dirección Principal',
  provincia text not null,
  ciudad text not null,
  direccion text not null,
  referencia text,
  celular_contacto text,
  principal boolean not null default false,
  activa boolean not null default true
);

create unique index direcciones_cliente_una_principal_activa
  on public.direcciones_cliente(cliente_id)
  where principal = true and activa = true;

create index direcciones_cliente_cliente_idx
  on public.direcciones_cliente(cliente_id, activa, principal desc);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  activa boolean not null default true
);

create table public.subcategorias (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  nombre text not null,
  slug text not null,
  activa boolean not null default true,
  unique (categoria_id, slug)
);

create table public.marcas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  slug text not null unique,
  activa boolean not null default true
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias(id) on delete restrict,
  subcategoria_id uuid references public.subcategorias(id) on delete set null,
  marca_id uuid references public.marcas(id) on delete set null,
  slug text not null unique,
  nombre text not null,
  sku text not null unique,
  precio numeric(10,2) not null check (precio >= 0),
  stock integer not null default 0 check (stock >= 0),
  descripcion text not null,
  caracteristicas text[] not null default '{}',
  youtube_video_id text,
  destacado boolean not null default false,
  activo boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null,
  actualizado_por uuid references auth.users(id) on delete set null
);

create table public.producto_imagenes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  cloudinary_public_id text not null,
  cloudinary_secure_url text not null,
  cloudinary_url text,
  cloudinary_version bigint,
  cloudinary_signature text,
  cloudinary_format text,
  cloudinary_resource_type text not null default 'image',
  cloudinary_width integer,
  cloudinary_height integer,
  cloudinary_bytes integer,
  alt text not null,
  orden integer not null default 0,
  principal boolean not null default false,
  activo boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null,
  actualizado_por uuid references auth.users(id) on delete set null,
  unique (cloudinary_public_id)
);

create unique index producto_imagenes_una_principal_activa
  on public.producto_imagenes(producto_id)
  where principal = true and activo = true;

create index producto_imagenes_producto_orden_idx
  on public.producto_imagenes(producto_id, principal desc, orden);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default public.siguiente_codigo_pedido(),
  cliente_id uuid references auth.users(id) on delete set null,
  cliente_nombre_completo text not null,
  cliente_cedula text,
  cliente_celular text not null,
  cliente_correo citext,
  cliente_provincia text,
  cliente_ciudad text,
  cliente_direccion text,
  cliente_referencia_entrega text,
  direccion_cliente_id uuid references public.direcciones_cliente(id) on delete set null,
  tipo_entrega tipo_entrega not null default 'envio_servientrega',
  subtotal numeric(10,2) not null check (subtotal >= 0),
  envio numeric(10,2) not null default 0 check (envio >= 0),
  total numeric(10,2) not null check (total >= 0),
  estado estado_pedido not null default 'pendiente_pago',
  creado_por uuid references auth.users(id) on delete set null,
  confirmado_por uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now(),
  constraint pedidos_envio_requiere_direccion check (
    tipo_entrega <> 'envio_servientrega'
    or (
      cliente_provincia is not null
      and cliente_ciudad is not null
      and cliente_direccion is not null
    )
  ),
  constraint pedidos_retiro_sin_envio check (
    tipo_entrega <> 'retiro_local'
    or envio = 0
  ),
  constraint pedidos_total_consistente check (
    total = subtotal + envio
  )
);

create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  producto_nombre text not null,
  producto_slug text not null,
  producto_sku text,
  producto_imagen text,
  categoria_slug text not null,
  precio numeric(10,2) not null check (precio >= 0),
  cantidad integer not null check (cantidad > 0),
  total_linea numeric(10,2) generated always as (precio * cantidad) stored,
  creado_en timestamptz not null default now()
);

create table public.movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete restrict,
  pedido_id uuid references public.pedidos(id) on delete set null,
  tipo tipo_movimiento_inventario not null,
  cantidad_delta integer not null,
  stock_antes integer not null check (stock_antes >= 0),
  stock_despues integer not null check (stock_despues >= 0),
  motivo text,
  creado_por uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now()
);

create or replace function public.crear_pedido_web(payload jsonb)
returns table(id uuid, codigo text)
language plpgsql
security definer
set search_path = public
as $$
declare
  pedido_id_creado uuid;
  pedido_codigo_creado text;
  cliente_actual uuid := auth.uid();
  tipo_entrega_input public.tipo_entrega;
  subtotal_input numeric(10,2);
  envio_input numeric(10,2);
  total_input numeric(10,2);
  items_input jsonb;
  item_input jsonb;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Datos de pedido invalidos';
  end if;

  if coalesce(payload->>'estado', 'pendiente_pago') <> 'pendiente_pago' then
    raise exception 'Solo se pueden crear pedidos pendientes de pago';
  end if;

  tipo_entrega_input := coalesce(payload->>'tipo_entrega', 'envio_servientrega')::public.tipo_entrega;
  subtotal_input := (payload->>'subtotal')::numeric(10,2);
  envio_input := (payload->>'envio')::numeric(10,2);
  total_input := (payload->>'total')::numeric(10,2);
  items_input := payload->'items';

  if subtotal_input is null or envio_input is null or total_input is null
    or subtotal_input < 0 or envio_input < 0 or total_input < 0
    or total_input <> subtotal_input + envio_input then
    raise exception 'Totales de pedido invalidos';
  end if;

  if jsonb_typeof(items_input) <> 'array' or jsonb_array_length(items_input) = 0 then
    raise exception 'El pedido no tiene items';
  end if;

  if tipo_entrega_input = 'retiro_local' and envio_input <> 0 then
    raise exception 'Datos de retiro invalidos';
  end if;

  insert into public.pedidos (
    cliente_id,
    cliente_nombre_completo,
    cliente_cedula,
    cliente_celular,
    cliente_correo,
    cliente_provincia,
    cliente_ciudad,
    cliente_direccion,
    cliente_referencia_entrega,
    direccion_cliente_id,
    tipo_entrega,
    subtotal,
    envio,
    total,
    estado,
    creado_por
  )
  values (
    cliente_actual,
    payload->>'cliente_nombre_completo',
    nullif(payload->>'cliente_cedula', ''),
    payload->>'cliente_celular',
    nullif(payload->>'cliente_correo', '')::citext,
    nullif(payload->>'cliente_provincia', ''),
    nullif(payload->>'cliente_ciudad', ''),
    nullif(payload->>'cliente_direccion', ''),
    nullif(payload->>'cliente_referencia_entrega', ''),
    nullif(payload->>'direccion_cliente_id', '')::uuid,
    tipo_entrega_input,
    subtotal_input,
    envio_input,
    total_input,
    'pendiente_pago',
    cliente_actual
  )
  returning pedidos.id, pedidos.codigo
  into pedido_id_creado, pedido_codigo_creado;

  for item_input in select value from jsonb_array_elements(items_input)
  loop
    insert into public.pedido_items (
      pedido_id,
      producto_id,
      producto_nombre,
      producto_slug,
      producto_sku,
      producto_imagen,
      categoria_slug,
      precio,
      cantidad
    )
    values (
      pedido_id_creado,
      nullif(item_input->>'producto_id', '')::uuid,
      item_input->>'producto_nombre',
      item_input->>'producto_slug',
      nullif(item_input->>'producto_sku', ''),
      nullif(item_input->>'producto_imagen', ''),
      item_input->>'categoria_slug',
      (item_input->>'precio')::numeric(10,2),
      (item_input->>'cantidad')::integer
    );
  end loop;

  return query select pedido_id_creado, pedido_codigo_creado;
end;
$$;

create or replace function public.confirmar_pago_pedido(pedido_id_input uuid)
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

  if pedido_record.estado <> 'pendiente_pago' then
    raise exception 'Solo se pueden confirmar pedidos pendientes de pago';
  end if;

  for item_record in
    select * from public.pedido_items where pedido_id = pedido_id_input
  loop
    select stock into stock_actual
    from public.productos
    where id = item_record.producto_id
    for update;

    if stock_actual is null then
      raise exception 'Producto no encontrado para el item %', item_record.id;
    end if;

    if stock_actual < item_record.cantidad then
      raise exception 'Stock insuficiente para %', item_record.producto_nombre;
    end if;

    stock_nuevo := stock_actual - item_record.cantidad;

    update public.productos
    set stock = stock_nuevo,
        actualizado_por = auth.uid()
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
      'venta_confirmada',
      item_record.cantidad * -1,
      stock_actual,
      stock_nuevo,
      'Pago confirmado',
      auth.uid()
    );
  end loop;

  update public.pedidos
  set estado = 'pagado_confirmado',
      confirmado_por = auth.uid()
  where id = pedido_id_input;
end;
$$;

create or replace function public.marcar_pedido_listo_retiro(pedido_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.pedidos
  set estado = 'listo_retiro'
  where id = pedido_id_input
    and tipo_entrega = 'retiro_local'
    and estado = 'pagado_confirmado';

  if not found then
    raise exception 'El pedido no esta pagado o no es de retiro local';
  end if;
end;
$$;

create or replace function public.marcar_pedido_retirado(pedido_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.pedidos
  set estado = 'retirado'
  where id = pedido_id_input
    and tipo_entrega = 'retiro_local'
    and estado = 'listo_retiro';

  if not found then
    raise exception 'El pedido no esta listo para retiro';
  end if;
end;
$$;

create or replace function public.marcar_pedido_enviado(pedido_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.pedidos
  set estado = 'enviado'
  where id = pedido_id_input
    and tipo_entrega = 'envio_servientrega'
    and estado = 'pagado_confirmado';

  if not found then
    raise exception 'El pedido no esta pagado o no es de envio';
  end if;
end;
$$;

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
            actualizado_por = auth.uid()
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
  set estado = 'cancelado'
  where id = pedido_id_input;
end;
$$;

create index categorias_activas_nombre_idx
  on public.categorias(activa, nombre);

create index subcategorias_categoria_nombre_idx
  on public.subcategorias(categoria_id, activa, nombre);

create index marcas_activas_nombre_idx
  on public.marcas(activa, nombre);

create index productos_catalogo_publico_idx
  on public.productos(activo, destacado, nombre);

create index productos_categoria_idx
  on public.productos(categoria_id, subcategoria_id);

create index productos_marca_idx
  on public.productos(marca_id);

create index productos_stock_idx
  on public.productos(stock);

create index pedidos_cliente_creado_idx
  on public.pedidos(cliente_id, creado_en desc);

create index pedidos_estado_creado_idx
  on public.pedidos(estado, creado_en desc);

create index pedidos_tipo_entrega_creado_idx
  on public.pedidos(tipo_entrega, creado_en desc);

create index pedidos_cliente_celular_idx
  on public.pedidos(cliente_celular);

create index pedido_items_pedido_idx
  on public.pedido_items(pedido_id);

create index movimientos_inventario_producto_creado_idx
  on public.movimientos_inventario(producto_id, creado_en desc);

create or replace view public.productos_publicos
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.nombre,
  p.sku,
  m.nombre as marca,
  c.nombre as categoria,
  c.slug as categoria_slug,
  s.nombre as subcategoria,
  s.slug as subcategoria_slug,
  p.precio,
  p.stock,
  p.descripcion,
  p.caracteristicas,
  p.youtube_video_id,
  p.destacado,
  p.activo,
  imagen_principal.cloudinary_secure_url as imagen_principal,
  imagen_principal.alt as imagen_alt
from public.productos p
join public.categorias c on c.id = p.categoria_id
left join public.subcategorias s on s.id = p.subcategoria_id
left join public.marcas m on m.id = p.marca_id
left join lateral (
  select cloudinary_secure_url, alt
  from public.producto_imagenes pi
  where pi.producto_id = p.id
    and pi.activo = true
  order by pi.principal desc, pi.orden asc
  limit 1
) imagen_principal on true
where p.activo = true;

create or replace view public.productos_admin
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.nombre,
  p.sku,
  p.precio,
  p.stock,
  p.destacado,
  p.activo,
  c.nombre as categoria,
  s.nombre as subcategoria,
  m.nombre as marca,
  count(pi.id) filter (where pi.activo = true) as cantidad_imagenes,
  bool_or(pi.principal and pi.activo) as tiene_imagen_principal
from public.productos p
join public.categorias c on c.id = p.categoria_id
left join public.subcategorias s on s.id = p.subcategoria_id
left join public.marcas m on m.id = p.marca_id
left join public.producto_imagenes pi on pi.producto_id = p.id
group by p.id, c.nombre, s.nombre, m.nombre;

create or replace view public.pedidos_admin
with (security_invoker = true) as
select
  p.id,
  p.codigo,
  p.cliente_id,
  p.cliente_nombre_completo,
  p.cliente_celular,
  p.cliente_ciudad,
  p.estado,
  p.tipo_entrega,
  p.subtotal,
  p.envio,
  p.total,
  p.creado_en,
  count(pi.id) as cantidad_lineas,
  coalesce(sum(pi.cantidad), 0) as cantidad_productos
from public.pedidos p
left join public.pedido_items pi on pi.pedido_id = p.id
group by p.id;

create or replace view public.mis_pedidos
with (security_invoker = true) as
select
  p.id,
  p.codigo,
  p.estado,
  p.tipo_entrega,
  p.subtotal,
  p.envio,
  p.total,
  p.creado_en,
  p.cliente_id,
  count(pi.id) as cantidad_lineas,
  coalesce(sum(pi.cantidad), 0) as cantidad_productos
from public.pedidos p
left join public.pedido_items pi on pi.pedido_id = p.id
where p.cliente_id = auth.uid()
group by p.id;

alter table public.perfiles_admin enable row level security;
alter table public.perfiles_cliente enable row level security;
alter table public.direcciones_cliente enable row level security;
alter table public.categorias enable row level security;
alter table public.subcategorias enable row level security;
alter table public.marcas enable row level security;
alter table public.productos enable row level security;
alter table public.producto_imagenes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.movimientos_inventario enable row level security;

revoke all on function public.crear_pedido_web(jsonb) from public;
grant execute on function public.crear_pedido_web(jsonb) to anon, authenticated;

create policy "Publico puede leer categorias activas"
on public.categorias for select
using (activa = true);

create policy "Publico puede leer subcategorias activas"
on public.subcategorias for select
using (activa = true);

create policy "Publico puede leer marcas activas"
on public.marcas for select
using (activa = true);

create policy "Publico puede leer productos activos"
on public.productos for select
using (activo = true);

create policy "Publico puede leer imagenes activas de productos activos"
on public.producto_imagenes for select
using (
  activo = true
  and exists (
    select 1
    from public.productos p
    where p.id = producto_imagenes.producto_id
      and p.activo = true
  )
);

create policy "Clientes leen su perfil"
on public.perfiles_cliente for select
using (id = auth.uid());

create policy "Clientes crean su perfil"
on public.perfiles_cliente for insert
with check (id = auth.uid());

create policy "Clientes actualizan su perfil"
on public.perfiles_cliente for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Clientes gestionan sus direcciones"
on public.direcciones_cliente for all
using (cliente_id = auth.uid())
with check (cliente_id = auth.uid());

create policy "Clientes leen sus pedidos"
on public.pedidos for select
using (cliente_id = auth.uid());

create policy "Clientes leen items de sus pedidos"
on public.pedido_items for select
using (
  exists (
    select 1
    from public.pedidos p
    where p.id = pedido_items.pedido_id
      and p.cliente_id = auth.uid()
  )
);

create policy "Admins leen perfiles admin"
on public.perfiles_admin for select
using (public.es_admin());

create policy "Admins gestionan perfiles cliente"
on public.perfiles_cliente for all
using (public.es_admin())
with check (public.es_admin());

create policy "Admins gestionan direcciones cliente"
on public.direcciones_cliente for all
using (public.es_admin())
with check (public.es_admin());

create policy "Admins gestionan categorias"
on public.categorias for all
using (public.es_admin())
with check (public.es_admin());

create policy "Admins gestionan subcategorias"
on public.subcategorias for all
using (public.es_admin())
with check (public.es_admin());

create policy "Admins gestionan marcas"
on public.marcas for all
using (public.es_admin())
with check (public.es_admin());

create policy "Admins gestionan productos"
on public.productos for all
using (public.es_admin())
with check (public.es_admin());

create policy "Admins gestionan imagenes de productos"
on public.producto_imagenes for all
using (public.es_admin())
with check (public.es_admin());

create policy "Admins gestionan pedidos"
on public.pedidos for all
using (public.es_admin())
with check (public.es_admin());

create policy "Admins gestionan items de pedidos"
on public.pedido_items for all
using (public.es_admin())
with check (public.es_admin());

create policy "Admins leen movimientos de inventario"
on public.movimientos_inventario for select
using (public.es_admin());

create policy "Admins crean movimientos de inventario"
on public.movimientos_inventario for insert
with check (public.es_admin());
