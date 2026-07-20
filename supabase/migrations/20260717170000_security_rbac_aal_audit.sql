-- Expansión compatible: capacidades administrativas y auditoría append-only.
-- No activa todavía las políticas AAL2; el contrato vive en la migración 175000
-- y se aplica únicamente después de desplegar y validar /admin/seguridad.

create schema if not exists private;

create or replace function private.tiene_permiso(
  permiso_input text,
  exigir_aal2 boolean default true
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select exists (
    select 1
    from public.perfiles_admin pa
    where pa.id = auth.uid()
      and pa.activo = true
      and pa.rol in ('dueno', 'admin', 'vendedor')
      and (
        not exigir_aal2
        or coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
      )
      and (
        pa.rol = 'dueno'
        or (
          pa.rol = 'admin'
          and permiso_input = any (array[
            'admin.access', 'dashboard.read', 'catalog.read', 'catalog.write',
            'orders.read', 'orders.write', 'customers.read', 'sales.read',
            'sales.create', 'sales.override_price', 'inventory.export'
          ])
        )
        or (
          pa.rol = 'vendedor'
          and permiso_input = any (array[
            'admin.access', 'catalog.read', 'sales.read', 'sales.create'
          ])
        )
      )
  );
$$;

revoke all on function private.tiene_permiso(text, boolean) from public, anon;
grant execute on function private.tiene_permiso(text, boolean) to authenticated, service_role;

create or replace function private.rol_admin_actual()
returns text
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select pa.rol
  from public.perfiles_admin pa
  where pa.id = auth.uid()
    and pa.activo = true
    and pa.rol in ('dueno', 'admin', 'vendedor')
  limit 1;
$$;

revoke all on function private.rol_admin_actual() from public, anon;
grant execute on function private.rol_admin_actual() to authenticated, service_role;

-- Se conserva por compatibilidad, pero ya no concede acceso sensible por sí sola.
create or replace function private.es_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select private.tiene_permiso('admin.access', false);
$$;

revoke all on function private.es_admin() from public, anon;
grant execute on function private.es_admin() to authenticated, service_role;

create table if not exists private.auditoria_seguridad (
  id bigint generated always as identity primary key,
  creado_en timestamptz not null default now(),
  actor_id uuid,
  actor_rol text,
  evento text not null check (char_length(evento) between 1 and 120),
  recurso_tipo text not null check (char_length(recurso_tipo) between 1 and 80),
  recurso_id text,
  resultado text not null default 'ok' check (resultado in ('ok', 'denegado', 'error', 'revision')),
  correlacion_id uuid not null default gen_random_uuid(),
  metadatos jsonb not null default '{}'::jsonb,
  constraint auditoria_metadatos_objeto check (jsonb_typeof(metadatos) = 'object'),
  constraint auditoria_recurso_id_limite check (recurso_id is null or char_length(recurso_id) <= 200),
  constraint auditoria_metadatos_limite check (octet_length(metadatos::text) <= 8192)
);

create index if not exists auditoria_seguridad_creado_en_idx
  on private.auditoria_seguridad (creado_en desc);
create index if not exists auditoria_seguridad_actor_idx
  on private.auditoria_seguridad (actor_id, creado_en desc);
create index if not exists auditoria_seguridad_evento_idx
  on private.auditoria_seguridad (evento, creado_en desc);

revoke all on table private.auditoria_seguridad from public, anon, authenticated;
revoke all on sequence private.auditoria_seguridad_id_seq from public, anon, authenticated;

create or replace function private.registrar_auditoria_interna(
  evento_input text,
  recurso_tipo_input text,
  recurso_id_input text default null,
  resultado_input text default 'ok',
  metadatos_input jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, private, public, pg_temp
as $$
declare
  correlacion uuid := gen_random_uuid();
begin
  insert into private.auditoria_seguridad (
    actor_id, actor_rol, evento, recurso_tipo, recurso_id, resultado,
    correlacion_id, metadatos
  ) values (
    auth.uid(), private.rol_admin_actual(), left(evento_input, 120),
    left(recurso_tipo_input, 80), left(recurso_id_input, 200),
    case when resultado_input in ('ok', 'denegado', 'error', 'revision')
      then resultado_input else 'error' end,
    correlacion,
    case when jsonb_typeof(coalesce(metadatos_input, '{}'::jsonb)) = 'object'
      then coalesce(metadatos_input, '{}'::jsonb) else '{}'::jsonb end
  );

  return correlacion;
end;
$$;

revoke all on function private.registrar_auditoria_interna(text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function private.registrar_auditoria_interna(text, text, text, text, jsonb)
  to service_role;

create or replace function private.auditar_cambio_sensible()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private, public, pg_temp
as $$
declare
  fila_id text;
  fila jsonb;
begin
  fila := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  fila_id := coalesce(
    fila ->> 'id', fila ->> 'pedido_id', fila ->> 'venta_id', fila ->> 'producto_id'
  );

  perform private.registrar_auditoria_interna(
    lower(tg_op) || '.' || tg_table_name,
    tg_table_name,
    fila_id,
    'ok',
    jsonb_build_object('operacion', tg_op)
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.auditar_cambio_sensible() from public, anon, authenticated;

drop trigger if exists auditar_categorias on public.categorias;
create trigger auditar_categorias
after insert or update or delete on public.categorias
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_subcategorias on public.subcategorias;
create trigger auditar_subcategorias
after insert or update or delete on public.subcategorias
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_marcas on public.marcas;
create trigger auditar_marcas
after insert or update or delete on public.marcas
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_catalogo_nodos on public.catalogo_nodos;
create trigger auditar_catalogo_nodos
after insert or update or delete on public.catalogo_nodos
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_catalogo_atributos on public.catalogo_atributos;
create trigger auditar_catalogo_atributos
after insert or update or delete on public.catalogo_atributos
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_producto_atributos on public.producto_atributos;
create trigger auditar_producto_atributos
after insert or update or delete on public.producto_atributos
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_productos on public.productos;
create trigger auditar_productos
after insert or update or delete on public.productos
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_producto_variantes on public.producto_variantes;
create trigger auditar_producto_variantes
after insert or update or delete on public.producto_variantes
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_producto_imagenes on public.producto_imagenes;
create trigger auditar_producto_imagenes
after insert or update or delete on public.producto_imagenes
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_pedidos on public.pedidos;
create trigger auditar_pedidos
after insert or update or delete on public.pedidos
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_pedido_items on public.pedido_items;
create trigger auditar_pedido_items
after insert or update or delete on public.pedido_items
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_perfiles_admin on public.perfiles_admin;
create trigger auditar_perfiles_admin
after insert or update or delete on public.perfiles_admin
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_ventas_fisicas on public.ventas_fisicas;
create trigger auditar_ventas_fisicas
after insert or update or delete on public.ventas_fisicas
for each row execute function private.auditar_cambio_sensible();

drop trigger if exists auditar_venta_fisica_items on public.venta_fisica_items;
create trigger auditar_venta_fisica_items
after insert or update or delete on public.venta_fisica_items
for each row execute function private.auditar_cambio_sensible();

-- El propio perfil puede leerse en AAL1 para completar/desafiar MFA. Gestionar
-- otros perfiles sigue reservado al dueño con AAL2.
/* CONTRATO AAL2: se conserva aquí solo como referencia histórica del diseño.
   La versión ejecutable está en 20260717175000_least_privilege_limits_and_physical_prices.sql.
drop policy if exists "Admins leen perfiles admin" on public.perfiles_admin;
create policy "Admin lee su perfil o dueno gestiona roles"
on public.perfiles_admin for select to authenticated
using (
  (id = (select auth.uid()) and activo = true and rol in ('dueno', 'admin', 'vendedor'))
  or (select private.tiene_permiso('roles.manage', true))
);

drop policy if exists "Admins gestionan categorias" on public.categorias;
create policy "Catalogo gestionado con permiso" on public.categorias
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan subcategorias" on public.subcategorias;
create policy "Subcategorias gestionadas con permiso" on public.subcategorias
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan marcas" on public.marcas;
create policy "Marcas gestionadas con permiso" on public.marcas
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan catalogo" on public.catalogo_nodos;
create policy "Nodos gestionados con permiso" on public.catalogo_nodos
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan atributos del catalogo" on public.catalogo_atributos;
create policy "Atributos gestionados con permiso" on public.catalogo_atributos
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan atributos de productos" on public.producto_atributos;
create policy "Atributos producto gestionados con permiso" on public.producto_atributos
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan productos" on public.productos;
create policy "Productos gestionados con permiso" on public.productos
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan variantes" on public.producto_variantes;
create policy "Variantes gestionadas con permiso" on public.producto_variantes
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan imagenes de productos" on public.producto_imagenes;
create policy "Imagenes gestionadas con permiso" on public.producto_imagenes
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan pedidos" on public.pedidos;
create policy "Personal autorizado lee pedidos" on public.pedidos
for select to authenticated
using ((select private.tiene_permiso('orders.read', true)));
create policy "Personal autorizado gestiona pedidos" on public.pedidos
for all to authenticated
using ((select private.tiene_permiso('orders.write', true)))
with check ((select private.tiene_permiso('orders.write', true)));

drop policy if exists "Admins gestionan items de pedidos" on public.pedido_items;
create policy "Personal autorizado lee items pedidos" on public.pedido_items
for select to authenticated
using ((select private.tiene_permiso('orders.read', true)));
create policy "Personal autorizado gestiona items pedidos" on public.pedido_items
for all to authenticated
using ((select private.tiene_permiso('orders.write', true)))
with check ((select private.tiene_permiso('orders.write', true)));

drop policy if exists "Admins gestionan perfiles cliente" on public.perfiles_cliente;
create policy "Personal autorizado lee perfiles cliente" on public.perfiles_cliente
for select to authenticated
using ((select private.tiene_permiso('customers.read', true)));

drop policy if exists "Admins gestionan direcciones cliente" on public.direcciones_cliente;
create policy "Personal autorizado lee direcciones cliente" on public.direcciones_cliente
for select to authenticated
using ((select private.tiene_permiso('customers.read', true)));

drop policy if exists "Admins gestionan ventas fisicas" on public.ventas_fisicas;
create policy "Personal autorizado lee ventas fisicas" on public.ventas_fisicas
for select to authenticated
using ((select private.tiene_permiso('sales.read', true)));

drop policy if exists "Admins gestionan items de ventas fisicas" on public.venta_fisica_items;
create policy "Personal autorizado lee items venta fisica" on public.venta_fisica_items
for select to authenticated
using ((select private.tiene_permiso('sales.read', true)));
*/
