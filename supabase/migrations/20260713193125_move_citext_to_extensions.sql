-- Evita exponer las funciones internas de citext a través del esquema public.
create schema if not exists extensions;
alter extension citext set schema extensions;
