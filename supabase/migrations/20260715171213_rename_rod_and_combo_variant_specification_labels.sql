update public.catalogo_atributos
set etiqueta = case clave
  when 'peso_lanzado' then 'Peso señuelo'
  when 'guias_tip' then 'Número de guías'
  else etiqueta
end,
actualizado_en = now()
where catalogo_nodo_id in (
  select id
  from public.catalogo_nodos
  where parent_id is null
    and slug in ('canas', 'combos')
)
and clave in ('peso_lanzado', 'guias_tip');
