-- Variantes opcionales de productos para Pesca Con Fe.
-- Ejecutar manualmente en el SQL Editor de Supabase despues de revisar un respaldo.
-- Esta migracion es incremental: no elimina ni modifica datos existentes de productos.

begin;

create table if not exists public.producto_variantes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  nombre text not null,
  descripcion text,
  sku text,
  precio numeric(10, 2) not null,
  precio_adicional numeric(10, 2),
  stock integer not null default 0,
  imagen text,
  activo boolean not null default true,
  orden integer not null default 1,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint producto_variantes_nombre_no_vacio check (btrim(nombre) <> ''),
  constraint producto_variantes_precio_no_negativo check (precio >= 0),
  constraint producto_variantes_precio_adicional_valido check (
    precio_adicional is null or precio_adicional >= 0
  ),
  constraint producto_variantes_stock_no_negativo check (stock >= 0),
  constraint producto_variantes_orden_no_negativo check (orden >= 0)
);

comment on table public.producto_variantes is
  'Presentaciones, colores, tamanos o configuraciones opcionales de un producto.';
comment on column public.producto_variantes.precio is
  'Precio final de venta de la variante.';
comment on column public.producto_variantes.precio_adicional is
  'Importe adicional opcional respecto al producto base, reservado para reglas comerciales futuras.';
comment on column public.producto_variantes.imagen is
  'URL opcional de una imagen especifica para la variante.';

create index if not exists producto_variantes_producto_orden_idx
  on public.producto_variantes(producto_id, activo, orden, nombre);

create unique index if not exists producto_variantes_sku_unique
  on public.producto_variantes(sku)
  where sku is not null and btrim(sku) <> '';

create or replace function public.set_producto_variantes_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists set_producto_variantes_actualizado_en on public.producto_variantes;
create trigger set_producto_variantes_actualizado_en
before update on public.producto_variantes
for each row execute function public.set_producto_variantes_actualizado_en();

alter table public.producto_variantes enable row level security;

drop policy if exists "Publico lee variantes activas" on public.producto_variantes;
create policy "Publico lee variantes activas"
on public.producto_variantes for select
using (
  activo = true
  and exists (
    select 1
    from public.productos p
    where p.id = producto_id
      and p.activo = true
  )
);

drop policy if exists "Admins gestionan variantes" on public.producto_variantes;
create policy "Admins gestionan variantes"
on public.producto_variantes for all
using (public.es_admin())
with check (public.es_admin());

revoke all on table public.producto_variantes from anon, authenticated;
grant select on table public.producto_variantes to anon, authenticated;
grant insert, update, delete on table public.producto_variantes to authenticated;

commit;

-- Ejemplo opcional despues de aplicar la migracion:
-- insert into public.producto_variantes
--   (producto_id, nombre, sku, precio, stock, activo, orden)
-- values
--   ('UUID_DEL_PRODUCTO', 'Sin aparejo', null, 25.00, 10, true, 1),
--   ('UUID_DEL_PRODUCTO', 'Con 1 anzuelo Mustad 10/0', null, 35.00, 5, true, 2),
--   ('UUID_DEL_PRODUCTO', 'Con 2 anzuelos Mustad 10/0', null, 40.00, 3, true, 3);
