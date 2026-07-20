alter table public.producto_variantes
  add column if not exists atributos jsonb not null default '{}'::jsonb;

comment on column public.producto_variantes.atributos is
  'Valores estructurados de cada opción para selectores y comparación pública, por ejemplo longitud, poder o color.';
