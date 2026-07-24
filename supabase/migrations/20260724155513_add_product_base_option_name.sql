-- Permite nombrar la configuración base de cada curricán.
alter table public.productos
  add column if not exists nombre_opcion_base text;

alter table public.productos
  drop constraint if exists productos_nombre_opcion_base_limite;

alter table public.productos
  add constraint productos_nombre_opcion_base_limite
  check (
    nombre_opcion_base is null
    or (
      btrim(nombre_opcion_base) <> ''
      and char_length(nombre_opcion_base) <= 160
    )
  ) not valid;

alter table public.productos
  validate constraint productos_nombre_opcion_base_limite;

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
  m.cloudinary_height as marca_logo_height,
  p.nombre_opcion_base
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

grant select (nombre_opcion_base)
on public.productos
to authenticated;

grant select on table public.productos_publicos to anon, authenticated;

notify pgrst, 'reload schema';
