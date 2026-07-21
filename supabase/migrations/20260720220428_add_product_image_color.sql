alter table public.producto_imagenes
  add column if not exists color text null;

comment on column public.producto_imagenes.color is
  'Etiqueta de color para mostrar en los señuelos';
