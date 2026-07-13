-- Versión alineada con el registro remoto de Supabase.
begin;

-- Corrige texto mojibake en la landing y breadcrumb de accesorios para señuelos.
update public.catalogo_nodos node
set
  nombre = U&'Accesorios para se\00F1uelos',
  nivel = U&'Clasificaci\00F3n',
  descripcion = U&'Descubre nuestra selecci\00F3n de accesorios para se\00F1uelos para tu pr\00F3xima jornada de pesca.',
  titulo_landing = U&'Accesorios para se\00F1uelos',
  descripcion_corta = U&'Descubre nuestra selecci\00F3n de accesorios para se\00F1uelos para tu pr\00F3xima jornada de pesca.',
  meta_title = U&'Accesorios para se\00F1uelos',
  meta_description = U&'Encuentra accesorios para se\00F1uelos: asistentes, faldas y anillas para completar tus montajes de pesca.'
from public.catalogo_nodos root
where node.parent_id = root.id
  and root.slug = 'senuelos'
  and node.slug = 'accesorios-para-senuelos';

commit;
