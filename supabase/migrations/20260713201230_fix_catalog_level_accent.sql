begin;

-- Mantiene las etiquetas de nivel consistentes en las landings públicas.
update public.catalogo_nodos
set nivel = U&'Categor\00EDa'
where nivel = 'Categoria';

commit;
