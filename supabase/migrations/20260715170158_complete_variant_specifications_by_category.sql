begin;

with attribute_definitions (catalog_slug, clave, etiqueta, tipo, unidad, opciones, obligatorio, filtrable, orden) as (
  values
    ('canas', 'longitud', 'Longitud', 'texto', null, '{}'::text[], true, true, 10),
    ('canas', 'piezas', 'Piezas', 'numero', null, '{}'::text[], true, true, 20),
    ('canas', 'poder', 'Poder', 'texto', null, '{}'::text[], true, true, 30),
    ('canas', 'accion', 'Acción', 'texto', null, '{}'::text[], true, true, 40),
    ('canas', 'peso_lanzado', 'Peso lanzado', 'texto', 'oz', '{}'::text[], true, true, 50),
    ('canas', 'linea', 'Línea', 'texto', 'lb', '{}'::text[], true, true, 60),
    ('canas', 'guias_tip', 'Guías con TIP', 'numero', null, '{}'::text[], true, true, 70),
    ('canas', 'peso_cana', 'Peso de la caña', 'texto', 'oz', '{}'::text[], true, true, 80),

    ('carretes', 'tamano', 'Tamaño', 'texto', null, '{}'::text[], true, true, 10),
    ('carretes', 'relacion', 'Relación', 'texto', null, '{}'::text[], true, true, 20),
    ('carretes', 'arrastre_maximo', 'Freno máximo', 'texto', 'lb', '{}'::text[], true, true, 30),
    ('carretes', 'balineras', 'Número de balineras', 'numero', null, '{}'::text[], true, true, 40),
    ('carretes', 'capacidad_linea', 'Capacidad de línea', 'texto', 'yds/lb', '{}'::text[], true, true, 50),

    ('combos', 'longitud', 'Longitud', 'texto', null, '{}'::text[], true, true, 10),
    ('combos', 'piezas', 'Piezas', 'numero', null, '{}'::text[], true, true, 20),
    ('combos', 'poder', 'Poder', 'texto', null, '{}'::text[], true, true, 30),
    ('combos', 'accion', 'Acción', 'texto', null, '{}'::text[], true, true, 40),
    ('combos', 'peso_lanzado', 'Peso lanzado', 'texto', 'oz', '{}'::text[], true, true, 50),
    ('combos', 'linea', 'Línea', 'texto', 'lb', '{}'::text[], true, true, 60),
    ('combos', 'guias_tip', 'Guías con TIP', 'numero', null, '{}'::text[], true, true, 70),
    ('combos', 'peso_cana', 'Peso de la caña', 'texto', 'oz', '{}'::text[], true, true, 80),
    ('combos', 'tamano', 'Tamaño del carrete', 'texto', null, '{}'::text[], true, true, 90),
    ('combos', 'relacion', 'Relación', 'texto', null, '{}'::text[], true, true, 100),
    ('combos', 'arrastre_maximo', 'Freno máximo', 'texto', 'lb', '{}'::text[], true, true, 110),
    ('combos', 'balineras', 'Número de balineras', 'numero', null, '{}'::text[], true, true, 120),
    ('combos', 'capacidad_linea', 'Capacidad de línea', 'texto', 'yds/lb', '{}'::text[], true, true, 130),

    ('senuelos', 'longitud', 'Longitud', 'texto', 'cm', '{}'::text[], true, true, 10),
    ('senuelos', 'peso', 'Peso', 'texto', 'oz', '{}'::text[], true, true, 20),
    ('senuelos', 'tecnica', 'Técnica', 'seleccion', null, array['Floating', 'Sinking', 'Jigging', 'Casting', 'Spinning', 'Trolling']::text[], true, true, 30)
), nodes as (
  select id, slug from public.catalogo_nodos where slug in ('canas', 'carretes', 'combos', 'senuelos') and parent_id is null
), upserted as (
  insert into public.catalogo_atributos (catalogo_nodo_id, clave, etiqueta, tipo, unidad, opciones, obligatorio, filtrable, activo, orden)
  select nodes.id, defs.clave, defs.etiqueta, defs.tipo, defs.unidad, defs.opciones, defs.obligatorio, defs.filtrable, true, defs.orden
  from attribute_definitions defs
  join nodes on nodes.slug = defs.catalog_slug
  on conflict (catalogo_nodo_id, clave) do update set
    etiqueta = excluded.etiqueta,
    tipo = excluded.tipo,
    unidad = excluded.unidad,
    opciones = excluded.opciones,
    obligatorio = excluded.obligatorio,
    filtrable = excluded.filtrable,
    activo = true,
    orden = excluded.orden,
    actualizado_en = now()
  returning catalogo_nodo_id, clave
)
update public.catalogo_atributos existing
set activo = false,
    actualizado_en = now()
from nodes
where existing.catalogo_nodo_id = nodes.id
  and not exists (
    select 1
    from attribute_definitions defs
    where defs.catalog_slug = nodes.slug
      and defs.clave = existing.clave
  );

commit;
