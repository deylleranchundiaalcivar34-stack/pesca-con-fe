-- Catalogo jerarquico flexible para Pesca Con Fe.
-- Ejecutar manualmente en el SQL editor de Supabase.
-- La migracion conserva categorias/subcategorias existentes y agrega un arbol nuevo.

begin;

create table if not exists public.catalogo_nodos (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.catalogo_nodos(id) on delete cascade,
  nombre text not null,
  slug text not null,
  nivel text not null default 'Categoria',
  descripcion text not null default '',
  imagen text,
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint catalogo_nodos_slug_no_vacio check (btrim(slug) <> ''),
  constraint catalogo_nodos_nombre_no_vacio check (btrim(nombre) <> '')
);

create unique index if not exists catalogo_nodos_slug_raiz_unique
  on public.catalogo_nodos(slug)
  where parent_id is null;

create unique index if not exists catalogo_nodos_parent_slug_unique
  on public.catalogo_nodos(parent_id, slug)
  where parent_id is not null;

create index if not exists catalogo_nodos_parent_idx
  on public.catalogo_nodos(parent_id, activo, orden, nombre);

create index if not exists catalogo_nodos_activo_idx
  on public.catalogo_nodos(activo, orden, nombre);

comment on table public.catalogo_nodos is
  'Arbol flexible del catalogo: categorias raiz y niveles comerciales variables por rama.';
comment on column public.catalogo_nodos.nivel is
  'Etiqueta comercial del nivel: Categoria, Modalidad, Tecnica, Tipo, Tamano, Uso, etc.';

create or replace function public.set_catalogo_nodos_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists set_catalogo_nodos_actualizado_en on public.catalogo_nodos;
create trigger set_catalogo_nodos_actualizado_en
before update on public.catalogo_nodos
for each row execute function public.set_catalogo_nodos_actualizado_en();

alter table public.productos
  add column if not exists catalogo_nodo_id uuid references public.catalogo_nodos(id) on delete set null;

-- El nuevo arbol pasa a ser la fuente principal. Las columnas antiguas quedan como respaldo temporal.
alter table public.productos
  alter column categoria_id drop not null;

create index if not exists productos_catalogo_nodo_idx
  on public.productos(catalogo_nodo_id);

alter table public.catalogo_nodos enable row level security;

drop policy if exists "Publico puede leer catalogo activo" on public.catalogo_nodos;
create policy "Publico puede leer catalogo activo"
on public.catalogo_nodos for select
using (activo = true);

drop policy if exists "Admins gestionan catalogo" on public.catalogo_nodos;
create policy "Admins gestionan catalogo"
on public.catalogo_nodos for all
using (public.es_admin())
with check (public.es_admin());

-- Migra categorias actuales como nodos raiz.
insert into public.catalogo_nodos (nombre, slug, nivel, activo, orden)
select
  c.nombre,
  c.slug,
  'Categoria',
  c.activa,
  row_number() over (order by c.nombre)::integer
from public.categorias c
on conflict do nothing;

-- Migra subcategorias actuales como hijos de su categoria.
insert into public.catalogo_nodos (parent_id, nombre, slug, nivel, activo, orden)
select
  padre.id,
  s.nombre,
  s.slug,
  'Tipo',
  s.activa,
  row_number() over (partition by s.categoria_id order by s.nombre)::integer
from public.subcategorias s
join public.categorias c on c.id = s.categoria_id
join public.catalogo_nodos padre on padre.parent_id is null and padre.slug = c.slug
on conflict do nothing;

-- Asigna cada producto al nodo mas especifico equivalente.
update public.productos p
set catalogo_nodo_id = coalesce(
  (
    select hijo.id
    from public.subcategorias s
    join public.categorias c on c.id = s.categoria_id
    join public.catalogo_nodos padre
      on padre.parent_id is null
      and padre.slug = c.slug
    join public.catalogo_nodos hijo
      on hijo.parent_id = padre.id
      and hijo.slug = s.slug
    where s.id = p.subcategoria_id
    limit 1
  ),
  (
    select padre.id
    from public.categorias c
    join public.catalogo_nodos padre
      on padre.parent_id is null
      and padre.slug = c.slug
    where c.id = p.categoria_id
    limit 1
  )
)
where p.catalogo_nodo_id is null;

create or replace view public.productos_publicos
with (security_invoker = true) as
with recursive catalogo_rutas as (
  select
    n.id as nodo_id,
    n.parent_id,
    array[n.id] as ruta_ids,
    array[n.nombre] as ruta_nombres,
    array[n.slug] as ruta_slugs,
    array[n.nivel] as ruta_niveles
  from public.catalogo_nodos n
  where n.parent_id is null

  union all

  select
    hijo.id as nodo_id,
    hijo.parent_id,
    padre.ruta_ids || hijo.id,
    padre.ruta_nombres || hijo.nombre,
    padre.ruta_slugs || hijo.slug,
    padre.ruta_niveles || hijo.nivel
  from public.catalogo_nodos hijo
  join catalogo_rutas padre on padre.nodo_id = hijo.parent_id
)
select
  p.id,
  p.slug,
  p.nombre,
  p.sku,
  m.nombre as marca,
  coalesce(cr.ruta_nombres[1], c.nombre, 'Sin categoria') as categoria,
  coalesce(cr.ruta_slugs[1], c.slug, 'sin-categoria') as categoria_slug,
  coalesce(cr.ruta_nombres[2], s.nombre) as subcategoria,
  coalesce(cr.ruta_slugs[2], s.slug) as subcategoria_slug,
  p.precio,
  p.stock,
  p.descripcion,
  p.caracteristicas,
  p.youtube_video_id,
  p.destacado,
  p.activo,
  imagen_principal.cloudinary_secure_url as imagen_principal,
  imagen_principal.alt as imagen_alt,
  p.catalogo_nodo_id,
  cr.ruta_ids as catalogo_ruta_ids,
  cr.ruta_nombres as catalogo_ruta_nombres,
  cr.ruta_slugs as catalogo_ruta_slugs,
  cr.ruta_niveles as catalogo_ruta_niveles
from public.productos p
left join catalogo_rutas cr on cr.nodo_id = p.catalogo_nodo_id
left join public.categorias c on c.id = p.categoria_id
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
  coalesce(cr.ruta_nombres[1], c.nombre, 'Sin categoria') as categoria,
  coalesce(cr.ruta_nombres[2], s.nombre) as subcategoria,
  m.nombre as marca,
  count(pi.id) filter (where pi.activo = true) as cantidad_imagenes,
  bool_or(pi.principal and pi.activo) as tiene_imagen_principal
from public.productos p
left join (
  with recursive catalogo_rutas as (
    select
      n.id as nodo_id,
      n.parent_id,
      array[n.nombre] as ruta_nombres
    from public.catalogo_nodos n
    where n.parent_id is null

    union all

    select
      hijo.id as nodo_id,
      hijo.parent_id,
      padre.ruta_nombres || hijo.nombre
    from public.catalogo_nodos hijo
    join catalogo_rutas padre on padre.nodo_id = hijo.parent_id
  )
  select nodo_id, ruta_nombres
  from catalogo_rutas
) cr on cr.nodo_id = p.catalogo_nodo_id
left join public.categorias c on c.id = p.categoria_id
left join public.subcategorias s on s.id = p.subcategoria_id
left join public.marcas m on m.id = p.marca_id
left join public.producto_imagenes pi on pi.producto_id = p.id
group by p.id, cr.ruta_nombres, c.nombre, s.nombre, m.nombre;

commit;
