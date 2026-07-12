-- Migracion incremental para landings dinamicas del catalogo de Pesca Con Fe.
-- Ejecutar manualmente en el SQL Editor de Supabase despues de revisar un respaldo.
-- No elimina tablas, columnas ni datos existentes.

begin;

-- Contenido editorial y SEO opcional por nodo.
alter table public.catalogo_nodos
  add column if not exists titulo_landing text,
  add column if not exists descripcion_corta text,
  add column if not exists contenido_tecnico text,
  add column if not exists imagen_alt text,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists open_graph_image text,
  add column if not exists indexable boolean not null default true,
  add column if not exists actualizado_en timestamptz not null default now();

comment on column public.catalogo_nodos.titulo_landing is
  'Titulo editorial opcional de la landing; si esta vacio se usa nombre.';
comment on column public.catalogo_nodos.descripcion_corta is
  'Resumen breve para el hero o tarjetas relacionadas.';
comment on column public.catalogo_nodos.contenido_tecnico is
  'Contenido largo o tecnico de la landing. Puede migrarse a secciones estructuradas en el futuro.';
comment on column public.catalogo_nodos.imagen_alt is
  'Texto alternativo accesible de la imagen destacada del nodo.';
comment on column public.catalogo_nodos.meta_title is
  'Titulo SEO opcional; si esta vacio se usa titulo_landing o nombre.';
comment on column public.catalogo_nodos.meta_description is
  'Descripcion SEO opcional; si esta vacia se usa descripcion_corta o descripcion.';
comment on column public.catalogo_nodos.open_graph_image is
  'URL opcional de imagen especifica para compartir la landing.';
comment on column public.catalogo_nodos.indexable is
  'Controla si la landing debe incluirse en sitemap e indexarse.';
comment on column public.catalogo_nodos.actualizado_en is
  'Fecha de la ultima actualizacion, mantenida por el trigger existente.';

create index if not exists catalogo_nodos_publicacion_idx
  on public.catalogo_nodos(activo, indexable, orden, nombre);

-- Expone un camino canonico por nodo. Los slugs siguen siendo unicos entre hermanos,
-- por eso la ruta completa es la identidad publica de una landing.
create or replace view public.catalogo_rutas_publicas
with (security_invoker = true) as
with recursive rutas as (
  select
    n.id as nodo_id,
    n.parent_id,
    array[n.id] as ruta_ids,
    array[n.slug] as ruta_slugs,
    array[n.nombre] as ruta_nombres,
    array[n.nivel] as ruta_niveles
  from public.catalogo_nodos n
  where n.parent_id is null
    and n.activo = true

  union all

  select
    hijo.id as nodo_id,
    hijo.parent_id,
    padre.ruta_ids || hijo.id,
    padre.ruta_slugs || hijo.slug,
    padre.ruta_nombres || hijo.nombre,
    padre.ruta_niveles || hijo.nivel
  from public.catalogo_nodos hijo
  join rutas padre on padre.nodo_id = hijo.parent_id
  where hijo.activo = true
)
select
  r.nodo_id,
  r.parent_id,
  r.ruta_ids,
  r.ruta_slugs,
  r.ruta_nombres,
  r.ruta_niveles,
  array_to_string(r.ruta_slugs, '/') as ruta_path,
  n.nombre,
  n.slug,
  n.nivel,
  n.descripcion,
  n.imagen,
  n.titulo_landing,
  n.descripcion_corta,
  n.contenido_tecnico,
  n.imagen_alt,
  n.meta_title,
  n.meta_description,
  n.open_graph_image,
  n.indexable,
  n.orden,
  n.actualizado_en
from rutas r
join public.catalogo_nodos n on n.id = r.nodo_id;

comment on view public.catalogo_rutas_publicas is
  'Nodos activos con su camino completo, contenido editorial y configuracion SEO.';

grant select on public.catalogo_rutas_publicas to anon, authenticated;

-- Devuelve el nodo indicado y todos sus descendientes activos. Esta funcion permite
-- consultar productos de una landing incluyendo las ramas que cuelgan de ella.
create or replace function public.catalogo_nodos_descendientes(nodo_raiz_id uuid)
returns table (nodo_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive descendientes as (
    select n.id
    from public.catalogo_nodos n
    where n.id = nodo_raiz_id
      and n.activo = true

    union all

    select hijo.id
    from public.catalogo_nodos hijo
    join descendientes padre on padre.id = hijo.parent_id
    where hijo.activo = true
  )
  select id as nodo_id
  from descendientes;
$$;

comment on function public.catalogo_nodos_descendientes(uuid) is
  'Lista el nodo raiz solicitado y todos sus descendientes activos.';

revoke all on function public.catalogo_nodos_descendientes(uuid) from public;
grant execute on function public.catalogo_nodos_descendientes(uuid) to anon, authenticated;

commit;

-- Ejemplo de resolucion exacta del caso piloto:
-- select *
-- from public.catalogo_rutas_publicas
-- where ruta_path = 'senuelos/para-mar/curricanes';

-- Ejemplo para obtener los IDs que debe incluir una landing:
-- select * from public.catalogo_nodos_descendientes(
--   (select nodo_id
--    from public.catalogo_rutas_publicas
--    where ruta_path = 'senuelos/para-mar/curricanes')
-- );
