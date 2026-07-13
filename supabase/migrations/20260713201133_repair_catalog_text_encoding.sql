-- Versión alineada con el registro remoto de Supabase.
begin;

-- Repara texto UTF-8 que fue interpretado erróneamente como Latin-1.
-- Solo toca valores que contienen el marcador de mojibake "Ã" (U+00C3).
update public.catalogo_nodos
set
  nombre = case when nombre like '%' || chr(195) || '%' then convert_from(convert_to(nombre, 'LATIN1'), 'UTF8') else nombre end,
  nivel = case when nivel like '%' || chr(195) || '%' then convert_from(convert_to(nivel, 'LATIN1'), 'UTF8') else nivel end,
  descripcion = case when descripcion like '%' || chr(195) || '%' then convert_from(convert_to(descripcion, 'LATIN1'), 'UTF8') else descripcion end,
  titulo_landing = case when titulo_landing like '%' || chr(195) || '%' then convert_from(convert_to(titulo_landing, 'LATIN1'), 'UTF8') else titulo_landing end,
  descripcion_corta = case when descripcion_corta like '%' || chr(195) || '%' then convert_from(convert_to(descripcion_corta, 'LATIN1'), 'UTF8') else descripcion_corta end,
  contenido_tecnico = case when contenido_tecnico like '%' || chr(195) || '%' then convert_from(convert_to(contenido_tecnico, 'LATIN1'), 'UTF8') else contenido_tecnico end,
  imagen_alt = case when imagen_alt like '%' || chr(195) || '%' then convert_from(convert_to(imagen_alt, 'LATIN1'), 'UTF8') else imagen_alt end,
  meta_title = case when meta_title like '%' || chr(195) || '%' then convert_from(convert_to(meta_title, 'LATIN1'), 'UTF8') else meta_title end,
  meta_description = case when meta_description like '%' || chr(195) || '%' then convert_from(convert_to(meta_description, 'LATIN1'), 'UTF8') else meta_description end
where concat_ws('', nombre, nivel, descripcion, titulo_landing, descripcion_corta, contenido_tecnico, imagen_alt, meta_title, meta_description) like '%' || chr(195) || '%';

update public.categorias
set nombre = convert_from(convert_to(nombre, 'LATIN1'), 'UTF8')
where nombre like '%' || chr(195) || '%';

update public.subcategorias
set nombre = convert_from(convert_to(nombre, 'LATIN1'), 'UTF8')
where nombre like '%' || chr(195) || '%';

commit;
