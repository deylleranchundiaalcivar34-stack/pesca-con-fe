-- Atributos estructurados para el catálogo. Las características libres se
-- conservan como contenido técnico; esta estructura es la fuente de filtros.
create table if not exists public.catalogo_atributos (
  id uuid primary key default gen_random_uuid(),
  catalogo_nodo_id uuid not null references public.catalogo_nodos(id) on delete cascade,
  clave text not null check (clave ~ '^[a-z0-9_-]+$'),
  etiqueta text not null,
  tipo text not null default 'texto' check (tipo in ('texto', 'numero', 'seleccion')),
  unidad text,
  opciones text[] not null default '{}',
  obligatorio boolean not null default false,
  filtrable boolean not null default true,
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (catalogo_nodo_id, clave)
);

create table if not exists public.producto_atributos (
  producto_id uuid not null references public.productos(id) on delete cascade,
  atributo_id uuid not null references public.catalogo_atributos(id) on delete cascade,
  valor text not null check (length(btrim(valor)) > 0),
  actualizado_en timestamptz not null default now(),
  primary key (producto_id, atributo_id)
);

create index if not exists catalogo_atributos_nodo_activo_orden_idx
  on public.catalogo_atributos (catalogo_nodo_id, activo, orden);
create index if not exists producto_atributos_atributo_valor_idx
  on public.producto_atributos (atributo_id, valor, producto_id);

alter table public.catalogo_atributos enable row level security;
alter table public.producto_atributos enable row level security;

create policy "Publico puede leer atributos activos del catalogo"
  on public.catalogo_atributos for select
  using (activo = true);
create policy "Admins gestionan atributos del catalogo"
  on public.catalogo_atributos for all
  using ((select private.es_admin()) is true)
  with check ((select private.es_admin()) is true);

create policy "Publico puede leer atributos de productos activos"
  on public.producto_atributos for select
  using (
    exists (
      select 1
      from public.productos p
      join public.catalogo_atributos a on a.id = producto_atributos.atributo_id
      where p.id = producto_atributos.producto_id
        and p.activo = true
        and a.activo = true
    )
  );
create policy "Admins gestionan atributos de productos"
  on public.producto_atributos for all
  using ((select private.es_admin()) is true)
  with check ((select private.es_admin()) is true);

insert into public.catalogo_atributos
  (catalogo_nodo_id, clave, etiqueta, tipo, unidad, obligatorio, filtrable, orden)
select n.id, seed.clave, seed.etiqueta, seed.tipo, seed.unidad, seed.obligatorio, true, seed.orden
from public.catalogo_nodos n
join (
  values
    ('canas', 'longitud', 'Longitud', 'texto', 'cm', true, 10),
    ('canas', 'poder', 'Poder', 'seleccion', null, true, 20),
    ('canas', 'accion', 'Acción', 'seleccion', null, true, 30),
    ('carretes', 'tamano', 'Tamaño', 'texto', null, true, 10),
    ('carretes', 'relacion', 'Relación de engranaje', 'texto', null, true, 20),
    ('carretes', 'arrastre_maximo', 'Arrastre máximo', 'texto', 'lb', true, 30),
    ('senuelos', 'longitud', 'Longitud', 'texto', 'cm', true, 10),
    ('senuelos', 'peso', 'Peso', 'texto', 'oz', true, 20),
    ('senuelos', 'tecnica', 'Técnica', 'seleccion', null, true, 30),
    ('lineas-y-aparejos', 'longitud', 'Longitud', 'texto', 'yd / m', true, 10),
    ('lineas-y-aparejos', 'libraje', 'Libraje', 'texto', 'lb', true, 20),
    ('indumentaria', 'talla', 'Talla', 'seleccion', null, true, 10)
) as seed(catalogo_slug, clave, etiqueta, tipo, unidad, obligatorio, orden)
  on n.slug = seed.catalogo_slug and n.parent_id is null
on conflict (catalogo_nodo_id, clave) do update
set etiqueta = excluded.etiqueta,
    tipo = excluded.tipo,
    unidad = excluded.unidad,
    obligatorio = excluded.obligatorio,
    filtrable = excluded.filtrable,
    orden = excluded.orden,
    activo = true,
    actualizado_en = now();

update public.catalogo_atributos a
set opciones = array['Floating', 'Sinking', 'Jigging', 'Casting', 'Spinning', 'Trolling']
from public.catalogo_nodos n
where a.catalogo_nodo_id = n.id
  and n.slug = 'senuelos'
  and a.clave = 'tecnica'
  and n.parent_id is null;

update public.catalogo_atributos
set etiqueta = case clave
  when 'accion' then U&'Acci\00F3n'
  when 'relacion' then U&'Relaci\00F3n de engranaje'
  when 'arrastre_maximo' then U&'Arrastre m\00E1ximo'
  when 'tecnica' then U&'T\00E9cnica'
  when 'tamano' then U&'Tama\00F1o'
  else etiqueta
end;

-- Migra únicamente líneas que ya tienen una etiqueta inequívoca. El resto se
-- mantiene en productos.caracteristicas para no inventar datos ni perder texto.
with recursive rutas as (
  select n.id as nodo_id, array[n.id] as ruta_ids
  from public.catalogo_nodos n
  where n.parent_id is null
  union all
  select hijo.id, padre.ruta_ids || hijo.id
  from public.catalogo_nodos hijo
  join rutas padre on padre.nodo_id = hijo.parent_id
), etiquetas as (
  select n.slug as catalogo_slug, a.id as atributo_id, a.clave,
    case a.clave
      when 'longitud' then '^(?:longitud|largo)\s*:?\s*(.+)$'
      when 'poder' then '^poder\s*:?\s*(.+)$'
      when 'accion' then '^acci[oó]n\s*:?\s*(.+)$'
      when 'tamano' then '^(?:tamañ?o|tamano)\s*:?\s*(.+)$'
      when 'relacion' then '^relaci[oó]n(?: de engranaje)?\s*:?\s*(.+)$'
      when 'arrastre_maximo' then '^(?:arrastre(?: m[aá]ximo)?|freno)\s*:?\s*(.+)$'
      when 'peso' then '^peso\s*:?\s*(.+)$'
      when 'tecnica' then '^(?:t[eé]cnica|flotabilidad|acci[oó]n)\s*:?\s*(.+)$'
      when 'libraje' then '^(?:libraje|resistencia)\s*:?\s*(.+)$'
      when 'talla' then '^talla\s*:?\s*(.+)$'
    end as patron
  from public.catalogo_atributos a
  join public.catalogo_nodos n on n.id = a.catalogo_nodo_id
), valores as (
  select p.id as producto_id, e.atributo_id,
    btrim((regexp_match(c, e.patron, 'i'))[1]) as valor
  from public.productos p
  join rutas r on r.nodo_id = p.catalogo_nodo_id
  join public.catalogo_nodos raiz on raiz.id = r.ruta_ids[1]
  join etiquetas e on e.catalogo_slug = raiz.slug
  cross join lateral unnest(p.caracteristicas) as c
  where e.patron is not null and c ~* e.patron
)
insert into public.producto_atributos (producto_id, atributo_id, valor)
select distinct on (producto_id, atributo_id) producto_id, atributo_id, valor
from valores
where valor is not null and valor <> ''
order by producto_id, atributo_id, valor
on conflict (producto_id, atributo_id) do update
set valor = excluded.valor, actualizado_en = now();

create or replace view public.productos_publicos
with (security_invoker = true) as
with recursive catalogo_rutas as (
  select n.id as nodo_id, n.parent_id, array[n.id] as ruta_ids,
    array[n.nombre] as ruta_nombres, array[n.slug] as ruta_slugs,
    array[n.nivel] as ruta_niveles
  from public.catalogo_nodos n
  where n.parent_id is null
  union all
  select hijo.id, hijo.parent_id, padre.ruta_ids || hijo.id,
    padre.ruta_nombres || hijo.nombre, padre.ruta_slugs || hijo.slug,
    padre.ruta_niveles || hijo.nivel
  from public.catalogo_nodos hijo
  join catalogo_rutas padre on padre.nodo_id = hijo.parent_id
)
select p.id, p.slug, p.nombre, p.sku, m.nombre as marca,
  coalesce(cr.ruta_nombres[1], c.nombre, 'Sin categoría') as categoria,
  coalesce(cr.ruta_slugs[1], c.slug, 'sin-categoria') as categoria_slug,
  coalesce(cr.ruta_nombres[2], s.nombre) as subcategoria,
  coalesce(cr.ruta_slugs[2], s.slug) as subcategoria_slug,
  p.precio, p.stock, p.descripcion, p.caracteristicas,
  p.youtube_video_id, p.destacado, p.activo,
  imagen_principal.cloudinary_secure_url as imagen_principal,
  imagen_principal.alt as imagen_alt, p.catalogo_nodo_id,
  cr.ruta_ids as catalogo_ruta_ids, cr.ruta_nombres as catalogo_ruta_nombres,
  cr.ruta_slugs as catalogo_ruta_slugs, cr.ruta_niveles as catalogo_ruta_niveles,
  coalesce(av.atributos, '{}'::jsonb) as atributos
from public.productos p
left join catalogo_rutas cr on cr.nodo_id = p.catalogo_nodo_id
left join public.categorias c on c.id = p.categoria_id
left join public.subcategorias s on s.id = p.subcategoria_id
left join public.marcas m on m.id = p.marca_id
left join lateral (
  select jsonb_object_agg(a.clave, pa.valor) as atributos
  from public.producto_atributos pa
  join public.catalogo_atributos a on a.id = pa.atributo_id
  where pa.producto_id = p.id and a.activo = true
) av on true
left join lateral (
  select pi.cloudinary_secure_url, pi.alt
  from public.producto_imagenes pi
  where pi.producto_id = p.id and pi.activo = true
  order by pi.principal desc, pi.orden
  limit 1
) imagen_principal on true
where p.activo = true;

grant select on public.catalogo_atributos, public.producto_atributos, public.productos_publicos
  to anon, authenticated;
