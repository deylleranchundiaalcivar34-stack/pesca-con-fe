begin;

-- Conserva las asignaciones de productos existentes y adopta la URL plural usada por el mega menÃº.
update public.catalogo_nodos
set nombre = 'Carretes', slug = 'carretes', orden = 3
where parent_id is null and slug = 'carrete';

update public.categorias
set nombre = 'Carretes', slug = 'carretes'
where slug = 'carrete';

-- Las categorÃ­as antiguas se mantienen sincronizadas con las raÃ­ces comerciales.
insert into public.categorias (nombre, slug, activa)
select source.nombre, source.slug, true
from (values
  ('Combos', 'combos'),
  ('LÃ­neas y Aparejos', 'lineas-y-aparejos'),
  ('Herramientas y Accesorios', 'herramientas-y-accesorios'),
  ('Equipamiento', 'equipamiento')
) as source(nombre, slug)
where not exists (
  select 1 from public.categorias category_row where category_row.slug = source.slug
);

-- RaÃ­ces comerciales que ya estÃ¡n representadas en el mega menÃº.
insert into public.catalogo_nodos (parent_id, nombre, slug, nivel, descripcion, activo, orden)
select null, source.nombre, source.slug, 'Categoria', '', true, source.orden
from (values
  ('Combos', 'combos', 1),
  ('LÃ­neas y Aparejos', 'lineas-y-aparejos', 5),
  ('Herramientas y Accesorios', 'herramientas-y-accesorios', 6),
  ('Equipamiento', 'equipamiento', 8)
) as source(nombre, slug, orden)
where not exists (
  select 1
  from public.catalogo_nodos node
  where node.parent_id is null and node.slug = source.slug
);

update public.catalogo_nodos
set orden = case slug
  when 'combos' then 1
  when 'canas' then 2
  when 'carretes' then 3
  when 'senuelos' then 4
  when 'lineas-y-aparejos' then 5
  when 'herramientas-y-accesorios' then 6
  when 'indumentaria' then 7
  when 'equipamiento' then 8
  else orden
end
where parent_id is null;

-- Opciones de primer nivel: son las que aparecerÃ¡n directamente al clasificar un producto.
insert into public.catalogo_nodos (parent_id, nombre, slug, nivel, descripcion, activo, orden)
select root.id, source.nombre, source.slug, 'ClasificaciÃ³n', '', true, source.orden
from (values
  ('combos', 'Combo Spinning', 'combo-spinning', 1),
  ('combos', 'Combo Casting', 'combo-casting', 2),
  ('combos', 'Combo Trolling / Convencional', 'combo-trolling-convencional', 3),
  ('canas', 'Trolling / Convencional', 'trolling-convencional', 5),
  ('carretes', 'Trolling / Convencional', 'trolling-convencional', 4),
  ('senuelos', 'Spinning', 'spinning', 3),
  ('senuelos', 'Casting', 'casting', 4),
  ('senuelos', 'Jigging', 'jigging', 5),
  ('senuelos', 'Trolling', 'trolling', 6),
  ('senuelos', 'Accesorios para seÃ±uelos', 'accesorios-para-senuelos', 7),
  ('lineas-y-aparejos', 'Braid', 'braid', 1),
  ('lineas-y-aparejos', 'Monofilamento', 'monofilamento', 2),
  ('lineas-y-aparejos', 'Leaders', 'leaders', 3),
  ('lineas-y-aparejos', 'Anzuelos', 'anzuelos', 4),
  ('lineas-y-aparejos', 'Plomos', 'plomos', 5),
  ('lineas-y-aparejos', 'Destorcedores / Giradores', 'destorcedores-giradores', 6),
  ('lineas-y-aparejos', 'Flotadores', 'flotadores', 7),
  ('herramientas-y-accesorios', 'Alicates / Pinzas', 'alicates-pinzas', 1),
  ('herramientas-y-accesorios', 'Grips / BÃ¡sculas', 'grips-basculas', 2),
  ('herramientas-y-accesorios', 'Tijeras / Corta lÃ­neas', 'tijeras-corta-lineas', 3),
  ('herramientas-y-accesorios', 'Cajas / Organizadores', 'cajas-organizadores', 4),
  ('herramientas-y-accesorios', 'Herramientas varias', 'herramientas-varias', 5),
  ('indumentaria', 'Gorras', 'gorras', 5),
  ('indumentaria', 'Buff / MÃ¡scaras', 'buff-mascaras', 6),
  ('equipamiento', 'Mochilas', 'mochilas', 1),
  ('equipamiento', 'Tulas', 'tulas', 2),
  ('equipamiento', 'Bolsos', 'bolsos', 3)
) as source(root_slug, nombre, slug, orden)
join public.catalogo_nodos root on root.parent_id is null and root.slug = source.root_slug
where not exists (
  select 1
  from public.catalogo_nodos node
  where node.parent_id = root.id and node.slug = source.slug
);

-- Subniveles que el mega menÃº usa dentro de accesorios para seÃ±uelos.
insert into public.catalogo_nodos (parent_id, nombre, slug, nivel, descripcion, activo, orden)
select parent_node.id, source.nombre, source.slug, 'SubclasificaciÃ³n', '', true, source.orden
from (values
  ('Asistentes', 'asistentes', 1),
  ('Faldas', 'faldas', 2),
  ('Anillas / Split Rings', 'anillas-split-rings', 3)
) as source(nombre, slug, orden)
join public.catalogo_nodos root on root.parent_id is null and root.slug = 'senuelos'
join public.catalogo_nodos parent_node
  on parent_node.parent_id = root.id and parent_node.slug = 'accesorios-para-senuelos'
where not exists (
  select 1
  from public.catalogo_nodos node
  where node.parent_id = parent_node.id and node.slug = source.slug
);

-- Las columnas heredadas mantienen etiquetas y filtros coherentes para los productos nuevos.
insert into public.subcategorias (categoria_id, nombre, slug, activa)
select category_row.id, source.nombre, source.slug, true
from (values
  ('combos', 'Combo Spinning', 'combo-spinning'),
  ('combos', 'Combo Casting', 'combo-casting'),
  ('combos', 'Combo Trolling / Convencional', 'combo-trolling-convencional'),
  ('canas', 'Trolling / Convencional', 'trolling-convencional'),
  ('carretes', 'Trolling / Convencional', 'trolling-convencional'),
  ('senuelos', 'Spinning', 'spinning'),
  ('senuelos', 'Casting', 'casting'),
  ('senuelos', 'Jigging', 'jigging'),
  ('senuelos', 'Trolling', 'trolling'),
  ('senuelos', 'Accesorios para seÃ±uelos', 'accesorios-para-senuelos'),
  ('lineas-y-aparejos', 'Braid', 'braid'),
  ('lineas-y-aparejos', 'Monofilamento', 'monofilamento'),
  ('lineas-y-aparejos', 'Leaders', 'leaders'),
  ('lineas-y-aparejos', 'Anzuelos', 'anzuelos'),
  ('lineas-y-aparejos', 'Plomos', 'plomos'),
  ('lineas-y-aparejos', 'Destorcedores / Giradores', 'destorcedores-giradores'),
  ('lineas-y-aparejos', 'Flotadores', 'flotadores'),
  ('herramientas-y-accesorios', 'Alicates / Pinzas', 'alicates-pinzas'),
  ('herramientas-y-accesorios', 'Grips / BÃ¡sculas', 'grips-basculas'),
  ('herramientas-y-accesorios', 'Tijeras / Corta lÃ­neas', 'tijeras-corta-lineas'),
  ('herramientas-y-accesorios', 'Cajas / Organizadores', 'cajas-organizadores'),
  ('herramientas-y-accesorios', 'Herramientas varias', 'herramientas-varias'),
  ('indumentaria', 'Gorras', 'gorras'),
  ('indumentaria', 'Buff / MÃ¡scaras', 'buff-mascaras'),
  ('equipamiento', 'Mochilas', 'mochilas'),
  ('equipamiento', 'Tulas', 'tulas'),
  ('equipamiento', 'Bolsos', 'bolsos')
) as source(category_slug, nombre, slug)
join public.categorias category_row on category_row.slug = source.category_slug
where not exists (
  select 1
  from public.subcategorias subcategory_row
  where subcategory_row.categoria_id = category_row.id
    and subcategory_row.slug = source.slug
);

-- Cada slug debe ser Ãºnico dentro de su mismo padre para que una URL resuelva un solo nodo.
create unique index if not exists catalogo_nodos_parent_slug_unique_idx
  on public.catalogo_nodos (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create unique index if not exists subcategorias_categoria_slug_unique_idx
  on public.subcategorias (categoria_id, slug);

commit;
