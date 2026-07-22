-- Gestion administrativa de marcas con un unico logo opcional en Cloudinary.
alter table public.marcas
  add column cloudinary_public_id text,
  add column cloudinary_secure_url text,
  add column cloudinary_format text,
  add column cloudinary_width integer,
  add column cloudinary_height integer,
  add column cloudinary_bytes integer;

alter table public.marcas
  add constraint marcas_cloudinary_public_id_key unique (cloudinary_public_id),
  add constraint marcas_logo_metadata_consistente check (
    (
      cloudinary_public_id is null
      and cloudinary_secure_url is null
      and cloudinary_format is null
      and cloudinary_width is null
      and cloudinary_height is null
      and cloudinary_bytes is null
    )
    or
    (
      btrim(cloudinary_public_id) <> ''
      and cloudinary_secure_url ~ '^https://res\.cloudinary\.com/'
      and btrim(cloudinary_format) <> ''
      and cloudinary_width > 0
      and cloudinary_height > 0
      and cloudinary_bytes > 0
    )
  );

comment on column public.marcas.cloudinary_public_id is
  'Identificador interno del logo administrado en Cloudinary; no se expone al cliente.';
comment on column public.marcas.cloudinary_secure_url is
  'URL HTTPS publica del logo administrado. Si es null, el frontend puede usar un logo local por slug.';

drop policy if exists "Publico puede leer marcas activas" on public.marcas;
drop policy if exists "Publico puede leer marcas" on public.marcas;
create policy "Publico puede leer marcas"
on public.marcas
for select
to anon, authenticated
using (true);

-- La relacion de productos conserva el nombre y el logo de una marca inactiva.
-- Las listas de seleccion siguen filtrando `activa = true` desde la aplicacion.
create or replace view public.productos_publicos
with (security_invoker = true)
as
with recursive catalogo_rutas as (
  select
    n.id as nodo_id,
    n.parent_id,
    array[n.id] as ruta_ids,
    array[n.nombre] as ruta_nombres,
    array[n.slug] as ruta_slugs,
    array[n.nivel] as ruta_niveles
  from public.catalogo_nodos as n
  where n.parent_id is null

  union all

  select
    hijo.id,
    hijo.parent_id,
    padre.ruta_ids || hijo.id,
    padre.ruta_nombres || hijo.nombre,
    padre.ruta_slugs || hijo.slug,
    padre.ruta_niveles || hijo.nivel
  from public.catalogo_nodos as hijo
  join catalogo_rutas as padre on padre.nodo_id = hijo.parent_id
)
select
  p.id,
  p.slug,
  p.nombre,
  p.sku,
  m.nombre as marca,
  coalesce(cr.ruta_nombres[1], c.nombre, 'Sin categoría'::text) as categoria,
  coalesce(cr.ruta_slugs[1], c.slug, 'sin-categoria'::text) as categoria_slug,
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
  cr.ruta_niveles as catalogo_ruta_niveles,
  coalesce(av.atributos, '{}'::jsonb) as atributos,
  p.precio_oferta,
  m.slug as marca_slug,
  m.cloudinary_secure_url as marca_logo_url,
  m.cloudinary_width as marca_logo_width,
  m.cloudinary_height as marca_logo_height
from public.productos as p
left join catalogo_rutas as cr on cr.nodo_id = p.catalogo_nodo_id
left join public.categorias as c on c.id = p.categoria_id
left join public.subcategorias as s on s.id = p.subcategoria_id
left join public.marcas as m on m.id = p.marca_id
left join lateral (
  select jsonb_object_agg(a.clave, pa.valor) as atributos
  from public.producto_atributos as pa
  join public.catalogo_atributos as a on a.id = pa.atributo_id
  where pa.producto_id = p.id and a.activo = true
) as av on true
left join lateral (
  select pi.cloudinary_secure_url, pi.alt
  from public.producto_imagenes as pi
  where pi.producto_id = p.id and pi.activo = true
  order by pi.principal desc, pi.orden
  limit 1
) as imagen_principal on true
where p.activo = true;

-- El proyecto revoca privilegios por defecto; la migracion declara exactamente
-- que columnas puede leer la Data API y mantiene oculto el public_id.
revoke select on table public.marcas from anon, authenticated;
grant select (
  id,
  nombre,
  slug,
  activa,
  cloudinary_secure_url,
  cloudinary_width,
  cloudinary_height
) on public.marcas to anon, authenticated;
grant insert, update, delete on table public.marcas to authenticated;
grant all on table public.marcas to service_role;

grant select on table public.productos_publicos to anon, authenticated;

notify pgrst, 'reload schema';
