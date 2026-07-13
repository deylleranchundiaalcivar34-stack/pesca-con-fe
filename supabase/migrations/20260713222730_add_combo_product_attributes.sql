-- Campos estructurados para productos de la categoria Combos.
-- Marca ya se resuelve desde productos.marca_id; estos campos completan los filtros tecnicos.
insert into public.catalogo_atributos
  (catalogo_nodo_id, clave, etiqueta, tipo, unidad, obligatorio, filtrable, activo, orden)
select
  n.id,
  seed.clave,
  seed.etiqueta,
  seed.tipo,
  seed.unidad,
  true,
  true,
  true,
  seed.orden
from public.catalogo_nodos n
join (
  values
    ('longitud', 'Longitud', 'texto', 'cm', 10),
    ('poder', 'Poder', 'texto', null, 20),
    ('piezas', 'Piezas', 'numero', null, 30),
    ('tamano', U&'Tama\00F1o', 'texto', null, 40)
) as seed(clave, etiqueta, tipo, unidad, orden) on true
where n.slug = 'combos'
  and n.parent_id is null
on conflict (catalogo_nodo_id, clave) do update
set etiqueta = excluded.etiqueta,
    tipo = excluded.tipo,
    unidad = excluded.unidad,
    obligatorio = excluded.obligatorio,
    filtrable = excluded.filtrable,
    activo = excluded.activo,
    orden = excluded.orden,
    actualizado_en = now();
