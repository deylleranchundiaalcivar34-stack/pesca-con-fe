-- Consolidar las clasificaciones equivalentes para que filtros, rutas y productos
-- usen un solo nodo: "Trolling / Convencional".
do $$
declare
  canas_trolling_id uuid;
  canas_unificado_id uuid;
  carretes_convencional_id uuid;
  carretes_unificado_id uuid;
begin
  select nodo.id
    into canas_trolling_id
  from public.catalogo_nodos nodo
  join public.catalogo_nodos categoria on categoria.id = nodo.parent_id
  where categoria.slug = 'canas'
    and nodo.slug = 'trolling';

  select nodo.id
    into canas_unificado_id
  from public.catalogo_nodos nodo
  join public.catalogo_nodos categoria on categoria.id = nodo.parent_id
  where categoria.slug = 'canas'
    and nodo.slug = 'trolling-convencional';

  if canas_trolling_id is not null then
    if canas_unificado_id is null then
      raise exception 'No existe el nodo unificado Cañas > Trolling / Convencional';
    end if;

    update public.catalogo_nodos
      set parent_id = canas_unificado_id
      where parent_id = canas_trolling_id;

    update public.productos
      set catalogo_nodo_id = canas_unificado_id
      where catalogo_nodo_id = canas_trolling_id;

    delete from public.catalogo_nodos where id = canas_trolling_id;

    update public.catalogo_nodos
      set orden = 4
      where id = canas_unificado_id;
  end if;

  select nodo.id
    into carretes_convencional_id
  from public.catalogo_nodos nodo
  join public.catalogo_nodos categoria on categoria.id = nodo.parent_id
  where categoria.slug = 'carretes'
    and nodo.slug = 'convencional';

  select nodo.id
    into carretes_unificado_id
  from public.catalogo_nodos nodo
  join public.catalogo_nodos categoria on categoria.id = nodo.parent_id
  where categoria.slug = 'carretes'
    and nodo.slug = 'trolling-convencional';

  if carretes_convencional_id is not null then
    if carretes_unificado_id is null then
      raise exception 'No existe el nodo unificado Carretes > Trolling / Convencional';
    end if;

    update public.catalogo_nodos
      set parent_id = carretes_unificado_id
      where parent_id = carretes_convencional_id;

    update public.productos
      set catalogo_nodo_id = carretes_unificado_id
      where catalogo_nodo_id = carretes_convencional_id;

    delete from public.catalogo_nodos where id = carretes_convencional_id;

    update public.catalogo_nodos
      set orden = 1
      where id = carretes_unificado_id;
  end if;
end $$;
