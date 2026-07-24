-- La vista pública usa security_invoker; el rol anónimo necesita permiso
-- únicamente sobre la nueva columna expuesta por la vista.
grant select (nombre_opcion_base)
on public.productos
to anon;

notify pgrst, 'reload schema';
