-- Seed inicial para Pesca Con Fe.
-- Ejecutar despues de docs/supabase_pesca_con_fe_base.sql.
-- No inserta productos: los productos reales se crean desde el panel admin con Cloudinary.

insert into public.configuracion_negocio (
  nombre,
  eslogan,
  tipo_negocio,
  direccion,
  ciudad,
  pais,
  horario,
  telefonos,
  whatsapp_e164,
  correo,
  url_facebook,
  url_instagram,
  url_tiktok,
  url_youtube,
  url_whatsapp_perfil,
  url_mapa_embed,
  servicio_envio,
  costo_envio_base,
  retiro_local_habilitado,
  instrucciones_retiro,
  activo
)
values (
  'Pesca Con Fe',
  'Confianza, pasión y aventura',
  'Tienda de artículos de pesca',
  'Mega Mercado Municipal, Local Nro. 145 - Planta Alta',
  'Shushufindi',
  'Ecuador',
  'Lunes a Sábado, 08:30 AM - 06:00 PM',
  array['0939927826', '0984967946'],
  '593939927826',
  'pescaconfe@gmail.com',
  'https://www.facebook.com/share/1DgLKz6Qez/?mibextid=wwXIfr',
  'https://www.instagram.com/pesca_con_fe',
  'https://www.tiktok.com/@pescaconfe1',
  'https://www.youtube.com/@pescaconfe1/featured',
  'https://wa.me/message/3VVYXYKPQKUQP1',
  'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7979.593868717105!2d-76.637618!3d-0.187597!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d7f138f2bf2a27%3A0x76c7ed6cdb45a227!2sStore%20Fishing%20%26%20Camping%20Pesca%20Con%20Fe!5e0!3m2!1ses!2sec!4v1778720578588!5m2!1ses!2sec',
  'Servientrega Ecuador',
  6.50,
  true,
  'Retira tu pedido en el Mega Mercado Municipal, Local Nro. 145 - Planta Alta. Espera la confirmación por WhatsApp antes de acercarte.',
  true
)
on conflict do nothing;

insert into public.cuentas_bancarias (
  configuracion_negocio_id,
  banco,
  titular,
  cedula,
  tipo_cuenta,
  numero_cuenta,
  orden,
  activa
)
select
  cn.id,
  account.banco,
  account.titular,
  account.cedula,
  account.tipo_cuenta::tipo_cuenta_bancaria,
  account.numero_cuenta,
  account.orden,
  true
from public.configuracion_negocio cn
cross join (
  values
    ('Banco Pichincha', 'Deyller Miguel Anchundia Alcivar', null, 'Ahorro', '2205589763', 1),
    ('Banco Guayaquil', 'Milena Alcivar', '2100238761', 'Ahorro', '12828212', 2),
    ('Banco del Pacífico', 'Milena Alcivar', '2100238761', 'Ahorro', '12828212', 3)
) as account(banco, titular, cedula, tipo_cuenta, numero_cuenta, orden)
where cn.activo = true
on conflict do nothing;

insert into public.categorias (nombre, slug, descripcion, url_imagen, orden, activa)
values
  ('Carrete', 'carrete', 'Carretes suaves y resistentes para jornadas intensas.', '/images/categorias/carretes.webp', 1, true),
  ('Cañas', 'canas', 'Cañas para río, mar, trolling y aventura amazónica.', '/images/categorias/canas.webp', 2, true),
  ('Indumentaria', 'indumentaria', 'Protección cómoda para sol, viento y agua.', '/images/categorias/indumentaria.webp', 3, true),
  ('Señuelos', 'senuelos', 'Señuelos seleccionados para río, mar y pesca con jigs.', '/images/categorias/senuelos.webp', 4, true)
on conflict (slug) do update
set nombre = excluded.nombre,
    descripcion = excluded.descripcion,
    url_imagen = excluded.url_imagen,
    orden = excluded.orden,
    activa = excluded.activa;

insert into public.subcategorias (categoria_id, nombre, slug, orden, activa)
select c.id, s.nombre, s.slug, s.orden, true
from public.categorias c
join (
  values
    ('carrete', 'Spinning', 'spinning', 1),
    ('carrete', 'Casting', 'casting', 2),
    ('carrete', 'Convencional', 'convencional', 3),
    ('canas', 'Popping', 'popping', 1),
    ('canas', 'Spinning', 'spinning', 2),
    ('canas', 'Casting', 'casting', 3),
    ('canas', 'Trolling', 'trolling', 4),
    ('indumentaria', 'Jersey', 'jersey', 1),
    ('indumentaria', 'Pantalones', 'pantalones', 2),
    ('indumentaria', 'Buff', 'buff', 3),
    ('indumentaria', 'Máscaras', 'mascaras', 4),
    ('senuelos', 'Para río', 'para-rio', 1),
    ('senuelos', 'Para mar', 'para-mar', 2),
    ('senuelos', 'Jigs', 'jigs', 3)
) as s(categoria_slug, nombre, slug, orden) on s.categoria_slug = c.slug
on conflict (categoria_id, slug) do update
set nombre = excluded.nombre,
    orden = excluded.orden,
    activa = excluded.activa;

insert into public.marcas (nombre, slug, url_logo, orden, activa)
values
  ('Bass Pro Shops', 'bass-pro-shops', '/images/marcas/bass-pro-shop.webp', 1, true),
  ('Daiwa', 'daiwa', '/images/marcas/daiwa.webp', 2, true),
  ('PENN', 'penn', '/images/marcas/penn.webp', 3, true),
  ('Rapala', 'rapala', '/images/marcas/rapala-wordmark.webp', 4, true),
  ('Shimano', 'shimano', '/images/marcas/shimano.webp', 5, true),
  ('Ugly Stik', 'ugly-stik', '/images/marcas/ugly-stik.webp', 6, true),
  ('Okuma inspired Fishing', 'okuma-inspired-fishing', '/images/marcas/okuma.webp', 7, true),
  ('Marine High Performance', 'marine-high-performance', '/images/marcas/marine.webp', 8, true)
on conflict (slug) do update
set nombre = excluded.nombre,
    url_logo = excluded.url_logo,
    orden = excluded.orden,
    activa = excluded.activa;
