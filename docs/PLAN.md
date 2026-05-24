# Plan del proyecto Pesca Con Fe

## 1. Vision

Construir el frontend completo de un ecommerce moderno para Pesca Con Fe, tienda de articulos de pesca ubicada en Shushufindi, Ecuador. La aplicacion debe funcionar hoy con datos mock, carrito, checkout por transferencia y WhatsApp, y panel administrador visual; a la vez debe quedar preparada para integrarse despues con Supabase, Cloudinary, autenticacion real y persistencia de pedidos.

El producto no busca ser una app minima. Debe ser una base profesional, escalable y lista para evolucionar hacia ecommerce real sin reescribir la arquitectura principal.

## 2. Alcance general

### Tienda publica

- Home comercial con identidad de marca, categorias, productos destacados, beneficios, marcas, ubicacion, CTA y boton flotante inferior derecho para volver arriba.
- Catalogo en `/productos` con busqueda, filtros, ordenamiento y grilla responsive.
- Detalle de producto en `/productos/[slug]` con galeria, miniaturas, caracteristicas, stock, video de YouTube opcional y relacionados.
- Carrito en `/carrito` como pagina completa de revision previa al checkout, mas drawer animado que lleva a la pagina de carrito.
- Checkout en `/checkout` con datos de cliente, envio Servientrega, pago por transferencia, cuentas bancarias y mensaje WhatsApp prellenado.
- Pagina `/quienes-somos` con historia, mision, vision, comunidad, marcas, ubicacion y CTA.
- Pagina `/contacto` con telefonos, correo, redes incluyendo YouTube, horario, ubicacion, mapa embebido y CTA a WhatsApp.
- Login visual en `/login`, sin autenticacion real, preparado para Supabase Auth.

### Panel administrador visual

- Dashboard en `/admin` con metricas, pedidos recientes, bajo stock y acciones rapidas.
- Gestion de productos en `/admin/productos`.
- Crear producto en `/admin/productos/nuevo`.
- Editar producto en `/admin/productos/[id]/editar`.
- Gestion de ventas/pedidos en `/admin/ventas`.
- Crear venta manual en `/admin/ventas/nueva`.
- Configuracion visual del negocio en `/admin/configuracion`.
- Simulacion con estado local/mock para crear/editar/desactivar productos, registrar ventas, confirmar pago, reducir stock y cambiar estados de pedidos.

## 3. Estado actual del repositorio

- Framework: Next.js 16.2.6 con App Router en `src/app`.
- Lenguaje: TypeScript.
- Paquete: pnpm.
- UI base: Tailwind CSS 4, componentes UI propios estilo shadcn/Radix, lucide-react, tailwindcss-animate y framer-motion.
- Estado global existente: carrito con Zustand en `src/store/cart-store.ts`.
- Datos mock existentes:
  - `src/data/mock-business.ts`
  - `src/data/mock-products.ts`
  - `src/data/mock-orders.ts`
- Tipos existentes:
  - `src/types/product.ts`
  - `src/types/order.ts`
  - `src/types/business.ts`
- Utilidades existentes:
  - `src/lib/shipping.ts`
  - `src/lib/stock.ts`
  - `src/lib/whatsapp.ts`
  - `src/lib/constants.ts`
  - `src/lib/utils.ts`
- Pendiente relevante: `src/app/page.tsx` conserva el template inicial de create-next-app.

## 4. Stack y reglas tecnicas

- Usar Next.js App Router, TypeScript, pnpm, Tailwind CSS, shadcn/ui, lucide-react y tailwindcss-animate.
- Usar Framer Motion solo donde aporte microinteracciones reales.
- Respetar las guias locales de Next.js en `node_modules/next/dist/docs/`, especialmente cambios de Next 16.
- Usar Server Components por defecto para paginas, layouts, metadata y contenido estatico.
- Usar Client Components solo para interaccion: filtros, carrito, formularios, drawers, upload mock, tabs, tablas con acciones y panel admin simulado.
- Mantener secretos fuera del cliente. Solo exponer variables `NEXT_PUBLIC_*` cuando sea intencional.
- No implementar backend real, Supabase, Cloudinary real, Supabase Storage, Stripe ni pasarela de pago.
- Dejar comentarios `TODO` concretos donde luego entren Supabase Database, Supabase Auth, Cloudinary Upload, Storage, RLS y Server Actions reales.

## 5. Identidad visual

### Tokens de color

- Azul principal: `#215EA1`
- Azul oscuro: `#253B5B`
- Azul medio: `#2563B0`
- Dorado principal: `#C5AD84`
- Dorado claro: `#E1CE9A`
- Blanco: `#FFFFFF`
- Blanco grisaceo: `#F2FAFA`
- Grafito: `#3D3638`

### Direccion UI

- Sensacion: confianza, pesca, aventura, calidad, comercio profesional.
- Azul oscuro como base premium.
- Azul principal/medio para acciones e interacciones.
- Dorado para acentos, bordes especiales, highlights y detalles premium.
- Fondos blancos y blanco grisaceo para lectura limpia.
- Cards limpias, bordes redondeados moderados, sombras suaves, hover elegante y foco visible.
- No usar texto generico tipo Lorem ipsum en areas importantes.

## 6. Informacion del negocio

- Nombre: Pesca Con Fe.
- Tipo: tienda de articulos de pesca.
- Ubicacion: Mega Mercado Municipal, Local Nro. 145 - Planta Alta, Shushufindi, Ecuador.
- Horario: lunes a sabado, 08:30 AM - 06:00 PM.
- Celulares: `0939927826`, `0984967946`.
- Correo: `pescaconfe@gmail.com`.
- Facebook: `https://www.facebook.com/share/1DgLKz6Qez/?mibextid=wwXIfr`
- Instagram: `https://www.instagram.com/pesca_con_fe`
- TikTok: `https://www.tiktok.com/@pescaconfe1`
- YouTube: `https://www.youtube.com/@pescaconfe1/featured`
- WhatsApp perfil: `https://wa.me/message/3VVYXYKPQKUQP1`
- WhatsApp prellenado: usar numero E.164 en helper alternativo porque los enlaces `wa.me/message/<codigo>` no garantizan `?text=`.
- Mapa: usar el iframe de Google Maps provisto con `title`, `loading="lazy"` y `referrerPolicy`.

## 7. Dominio y datos mock

### Categorias

- Carrete: Spinning, Casting, Convencional.
- Canas: Popping, Spinning, Casting, Trolling.
- Indumentaria: Jersey, Pantalones, Buff, Mascaras.
- Senuelos: Para rio, Para mar, Jigs.

### Marcas

- Bass Pro Shops.
- Daiwa.
- PENN.
- Rapala.
- Shimano.
- Ugly Stik.
- Okuma inspired Fishing.
- Marine High Performance.

### Producto

Cada producto debe incluir:

- `id`
- `slug`
- `name`
- `sku`
- `brand`
- `category`
- `categorySlug`
- `subcategory`
- `subcategorySlug`
- `price`
- `stock`
- `description`
- `features`
- `images`
- `mainImage`
- `imageAlt`
- `youtubeVideoId?`
- `isFeatured`
- `isActive`
- `createdAt`

### Pedido y venta

- Estados: `pendiente_pago`, `pagado_confirmado`, `enviado`, `cancelado`.
- Canales: `presencial`, `whatsapp`, `web`.
- El pedido generado por cliente queda en `pendiente_pago`.
- El stock no se descuenta al generar pedido.
- El stock se descuenta solo cuando el admin confirma el pago o confirma una venta manual.

### Pago

- Banco Pichincha:
  - Deyller Miguel Anchundia Alcivar.
  - Cedula: `2100948740`
  - Cuenta de ahorro `2205589763`.
- Banco Guayaquil:
  - Milena Alcivar.
  - Cedula `2100238761`.
  - Cuenta de ahorro `12828212`.
- Banco del Pacifico:
  - Milena Alcivar.
  - Cedula `2100238761`.
  - Cuenta de ahorro `12828212`.

### Envio

- Servicio: Servientrega Ecuador.
- Canas: `$8.50`.
- Carretes: `$6.50`.
- Otros productos: minimo `$6.50`.
- Si el carrito tiene varios productos, usar el valor mas alto aplicable.
- Mostrar el calculo de forma clara en carrito y checkout.

## 8. Arquitectura de rutas

```text
src/app/
  page.tsx
  productos/
    page.tsx
    [slug]/
      page.tsx
  carrito/
    page.tsx
  checkout/
    page.tsx
  quienes-somos/
    page.tsx
  contacto/
    page.tsx
  login/
    page.tsx
  admin/
    page.tsx
    productos/
      page.tsx
      nuevo/
        page.tsx
      [id]/
        editar/
          page.tsx
    ventas/
      page.tsx
      nueva/
        page.tsx
    configuracion/
      page.tsx
```

## 9. Arquitectura de carpetas

```text
src/
  app/
  components/
    layout/
    home/
    products/
    cart/
    checkout/
    admin/
    shared/
    ui/
  data/
    mock-products.ts
    mock-orders.ts
    mock-business.ts
  hooks/
    use-cart.ts
    use-products.ts
  lib/
    constants.ts
    shipping.ts
    stock.ts
    utils.ts
    whatsapp.ts
  store/
    cart-store.ts
  types/
    business.ts
    order.ts
    product.ts
```

## 10. Componentes clave

### Layout y compartidos

- `Header`
- `Footer`
- `MobileNav`
- `BackToTopButton`
- `WhatsAppButton`
- `StatusBadge`
- `YouTubeEmbed`
- `JsonLd`

### Home

- `HeroSection`
- `CategoryCard`
- `FeaturedProducts`
- `BrandStrip`
- `BenefitsSection`
- `LocationPreview`
- `FinalCta`

### Productos

- `ProductCard`
- `ProductGrid`
- `ProductFilters`
- `ProductSort`
- `ProductGallery`
- `AddToCartButton`
- `RelatedProducts`

### Carrito y checkout

- `CartDrawer`
- `CartPageClient`
- `CartSummary`
- `CartLineItem`
- `CheckoutForm`
- `BankAccountCard`
- `OrderSuccess`

### Admin

- `AdminSidebar`
- `AdminHeader`
- `AdminMetricCard`
- `AdminProductTable`
- `AdminOrderTable`
- `ProductForm`
- `ImageUploaderMock`
- `ManualSaleForm`
- `BusinessSettingsForm`

## 11. Plan por fases

### Fase 1: Base visual, datos y layout

- Definir tokens CSS/Tailwind de Pesca Con Fe.
- Corregir textos mal codificados en datos mock.
- Revisar que productos, categorias, bancos y negocio cubran todo el prompt.
- Crear layout publico con header, mobile nav, footer y CTA a WhatsApp.
- Usar iconos accesibles para acciones compactas del header, como carrito y acceso administrativo.
- Configurar metadata global, Open Graph base y JSON-LD `LocalBusiness`.
- Reemplazar el template inicial de `src/app/page.tsx`.

Criterios de aceptacion:

- No quedan placeholders de Next.js en la home.
- La identidad visual usa la paleta indicada.
- La informacion del negocio esta centralizada.
- La navegacion publica funciona en desktop y mobile, con botones de icono identificados por `aria-label`.

### Fase 2: Home publica

- Construir hero con mensaje principal y botones "Ver productos" y "Comprar por WhatsApp".
- Mostrar categorias destacadas, productos destacados y marcas.
- Agregar beneficios: equipos de calidad, senuelos seleccionados, pasion por la pesca y aventura sin fronteras.
- Agregar ubicacion, horario y CTA final.
- Agregar boton flotante inferior derecho para volver arriba despues de hacer scroll.
- Incorporar animaciones sutiles donde mejoren la experiencia.

Criterios de aceptacion:

- La primera pantalla comunica marca, categoria y accion principal.
- Los CTAs llevan a `/productos` y WhatsApp.
- El boton de volver arriba no tapa contenido clave, mantiene contraste sobre el footer y respeta el scroll suave.
- El contenido se ve profesional en movil y escritorio.

### Fase 3: Catalogo `/productos`

- Crear grilla responsive de productos.
- Crear filtros laterales en desktop y drawer/modal en mobile.
- Implementar busqueda por nombre.
- Filtrar por categoria, subcategoria, marca, precio y disponibilidad.
- Ordenar por precio, nombre, destacados y recientes.
- Agregar estados vacios y skeletons si aplica.

Criterios de aceptacion:

- El usuario puede encontrar productos por cualquier criterio importante.
- Los filtros no rompen la navegacion mobile.
- Las cards muestran imagen, categoria, marca, precio, stock y agregar al carrito.

### Fase 4: Detalle `/productos/[slug]`

- Crear galeria con imagen principal y miniaturas.
- Mostrar marca, categoria, subcategoria, precio, stock y selector de cantidad.
- Agregar botones de carrito y consulta por WhatsApp.
- Mostrar descripcion, caracteristicas y video YouTube si existe.
- Mostrar productos relacionados.
- Implementar metadata dinamica y JSON-LD `Product`.
- Manejar producto inexistente con `notFound()`.

Criterios de aceptacion:

- El detalle permite decidir compra sin volver al catalogo.
- El iframe de YouTube carga de forma diferida y tiene `title`.
- Los productos agotados no permiten agregar cantidades invalidas.

### Fase 5: Carrito

- Crear `/carrito`.
- Conectar UI al store Zustand existente.
- Presentar `/carrito` como pagina de revision completa antes del checkout.
- Permitir quitar, cambiar cantidad y vaciar carrito.
- Mostrar subtotal, envio, total, conteo de items y CTA principal hacia `/checkout`.
- Respetar stock maximo por producto.
- Mantener resumen sticky en desktop y drawer animado para acceso rapido con CTA hacia `/carrito`.

Criterios de aceptacion:

- El carrito persiste al recargar.
- Las cantidades nunca superan el stock.
- El envio usa `src/lib/shipping.ts`.
- Hay estado de carrito vacio con vuelta al catalogo.
- La pagina de carrito comunica que el pedido se confirma por WhatsApp y transferencia.

### Fase 6: Checkout y WhatsApp

- Crear `/checkout`.
- Implementar formulario con React Hook Form y Zod.
- Validar nombre, celular, provincia, ciudad, direccion y referencia opcional.
- Mostrar metodo de envio Servientrega Ecuador.
- Mostrar metodo de pago transferencia bancaria.
- Permitir seleccionar cuenta bancaria.
- Generar resumen del pedido.
- Crear pedido visual en estado `pendiente_pago`.
- Abrir WhatsApp con mensaje prellenado.
- Mostrar pantalla de exito con instrucciones para adjuntar comprobante.

Criterios de aceptacion:

- El mensaje incluye cliente, productos, cantidades, subtotal, envio, total, banco elegido y nota de comprobante.
- No se descuenta stock al generar pedido.
- El flujo completo funciona desde mobile.

### Fase 7: Paginas informativas

- Crear `/quienes-somos`.
- Crear `/contacto`.
- Presentar historia, mision, vision, comunidad, marcas y ubicacion con una UI visual preparada para fotos reales.
- Embeder mapa con accesibilidad basica.
- Mostrar telefonos, correo, redes incluyendo YouTube, horario, ubicacion y CTA.
- Agregar metadata por pagina.

Criterios de aceptacion:

- El cliente entiende la historia, confianza y presencia local de Pesca Con Fe.
- La informacion de contacto se puede accionar facilmente desde celular.

### Fase 8: Login visual

- Crear `/login`.
- Disenar formulario profesional con correo y contrasena.
- Simular acceso al panel admin.
- Dejar `TODO` para integrar Supabase Auth y proteccion real de rutas.

Criterios de aceptacion:

- La ruta comunica claramente acceso administrativo.
- No existe autenticacion falsa insegura disfrazada de real.
- El panel queda protegido solo a nivel visual/mock.

### Fase 9: Admin dashboard

- Crear layout admin con sidebar, header y navegacion.
- Crear `/admin` con metricas:
  - Ventas del dia.
  - Pedidos pendientes.
  - Productos activos.
  - Productos con bajo stock.
- Mostrar pedidos recientes y bajo stock.
- Agregar acciones rapidas.

Criterios de aceptacion:

- El dashboard se ve operativo aunque use datos mock.
- Las metricas salen de datos existentes o derivados.
- Hay rutas claras hacia productos, ventas y configuracion.

### Fase 10: Admin productos

- Crear `/admin/productos` con tabla, busqueda y filtros.
- Crear acciones editar, desactivar y eliminar simuladas.
- Crear `/admin/productos/nuevo`.
- Crear `/admin/productos/[id]/editar`.
- Implementar `ProductForm` reusable.
- Implementar subida simulada de multiples imagenes con preview, imagen principal y alt text.
- Permitir link o ID de YouTube.
- Dejar `TODO` para Cloudinary/Supabase Storage.

Criterios de aceptacion:

- Crear/editar producto se siente funcional desde UI.
- Las imagenes se previsualizan aunque no se suban realmente.
- El formulario valida campos principales y mantiene estructura compatible con el tipo `Product`.

### Fase 11: Admin ventas y pedidos

- Crear `/admin/ventas` con tabla y filtros por estado.
- Acciones: ver detalle, confirmar pago, marcar enviado y cancelar.
- Al confirmar pago, simular reduccion de stock.
- Crear `/admin/ventas/nueva`.
- Permitir seleccionar productos, cantidades, cliente, canal y metodo de pago.
- Confirmar venta manual y descontar stock de forma simulada.

Criterios de aceptacion:

- El flujo respeta que el stock baja solo cuando se confirma pago/venta.
- Los estados de pedido se ven con badges accesibles.
- Hay feedback visual para confirmaciones y cancelaciones.

### Fase 12: Admin configuracion

- Crear `/admin/configuracion`.
- Mostrar y editar en estado local:
  - Datos del negocio.
  - Cuentas bancarias.
  - Costos de envio.
  - Redes sociales, incluido YouTube.
  - Horario.
- Dejar `TODO` para persistencia en Supabase.

Criterios de aceptacion:

- La pantalla permite simular cambios sin backend.
- La estructura anticipa una futura tabla/configuracion remota.

### Fase 13: SEO, accesibilidad y rendimiento

- Metadata global y por pagina.
- Metadata dinamica para producto.
- Open Graph y Twitter Cards.
- `sitemap.ts` y `robots.ts` preparados.
- JSON-LD `LocalBusiness` y `Product`.
- `next/image` en imagenes de producto.
- Lazy loading para iframes.
- Labels, foco visible, aria-labels, alt text y contraste.
- Revisar que no se comunique estado solo por color.

Criterios de aceptacion:

- Las rutas principales tienen titulo y descripcion.
- La navegacion por teclado es usable.
- No hay imagenes importantes sin alt util.
- El build de produccion no falla por metadata o rutas.

### Fase 14: Validacion final y README

- Ejecutar `pnpm lint`.
- Ejecutar `pnpm build`.
- Revisar responsive mobile/desktop.
- Verificar flujo completo:
  - Home -> productos -> detalle -> carrito -> checkout -> WhatsApp.
  - Login -> admin -> productos -> ventas -> configuracion.
- Actualizar README con:
  - Requisitos.
  - Instalacion `pnpm install`.
  - Desarrollo `pnpm dev`.
  - Build `pnpm build`.
  - Notas de integracion futura.

Criterios de aceptacion:

- El proyecto corre con `pnpm install` y `pnpm dev`.
- El README explica el estado mock y el camino de integracion.
- No quedan placeholders criticos ni texto generico.

## 12. SEO tecnico

- `metadata` global en layout raiz.
- Metadata especifica en home, productos, checkout, quienes somos, contacto y login.
- Metadata dinamica en `/productos/[slug]`.
- Open Graph con imagen y descripcion comercial.
- Twitter Card.
- `sitemap.ts` con rutas publicas y productos activos.
- `robots.ts`.
- JSON-LD `LocalBusiness` en la app publica.
- JSON-LD `Product` en detalle de producto.
- URLs limpias con slugs.

## 13. Accesibilidad

- HTML semantico.
- Navegacion por teclado.
- Focus states visibles.
- Contraste adecuado sobre azul y dorado.
- `aria-label` en botones de icono.
- Labels asociados a inputs.
- Mensajes de error claros en formularios.
- `alt` descriptivo en imagenes.
- `title` en iframes.
- Estados de stock acompanados por texto, no solo color.

## 14. Rendimiento

- Usar `next/image` para productos y recursos principales.
- Evitar convertir paginas completas en Client Components.
- Mantener filtros, carrito, formularios y admin interactivo en componentes cliente aislados.
- Lazy loading en videos de YouTube.
- Evitar librerias nuevas si lo existente cubre el caso.
- Reducir renderizados innecesarios en tablas, filtros y carrito.

## 15. Preparacion para integraciones futuras

### Supabase Database

- Reemplazar `src/data/mock-*` por consultas.
- Mapear productos, categorias, pedidos, order_items, bancos, configuracion y ventas.
- Agregar Server Actions o Route Handlers segun convenga en Next 16.

### Supabase Auth

- Reemplazar login visual por autenticacion real.
- Proteger rutas `/admin`.
- Aplicar RLS.
- Separar roles admin/cliente si se habilita cuenta de cliente.

### Cloudinary o Storage

- Reemplazar `ImageUploaderMock` por upload real.
- Guardar `public_id`, url, alt, orden e imagen principal.
- Validar formatos y tamanos.

### Pedidos reales

- Persistir pedido al finalizar checkout.
- Mantener estado `pendiente_pago` hasta confirmacion manual.
- Descontar stock solo al confirmar pago desde admin.

## 16. Riesgos y mitigaciones

- Textos mock mal codificados: corregir antes de construir UI definitiva.
- Imagenes faltantes: usar placeholders controlados y reemplazar por assets reales antes de lanzamiento.
- Flujo sin pago automatico: comunicar claramente que la confirmacion ocurre por WhatsApp.
- Admin sin backend: presentar como panel visual/mock y dejar TODOs de integracion.
- Stock manual: advertir disponibilidad y confirmar por WhatsApp.
- WhatsApp `wa.me/message`: mantener helper con alternativa E.164 para prellenar texto.
- Exceso de Client Components: aislar interactividad para cuidar rendimiento.

## 17. Checklist de lanzamiento

- [ ] Paleta y tokens aplicados.
- [ ] Home terminada.
- [ ] Boton volver arriba en home verificado.
- [ ] Catalogo `/productos` terminado.
- [ ] Detalle `/productos/[slug]` terminado.
- [ ] Carrito funcional.
- [ ] Pagina de carrito completa antes de checkout verificada.
- [ ] Checkout funcional.
- [ ] WhatsApp prellenado verificado.
- [ ] Pagina quienes somos terminada.
- [ ] Pagina contacto terminada.
- [ ] Login visual terminado.
- [ ] Dashboard admin terminado.
- [ ] Admin productos terminado.
- [ ] Admin ventas terminado.
- [ ] Admin configuracion terminado.
- [ ] Productos reales revisados.
- [ ] Precios revisados.
- [ ] Stock inicial revisado.
- [ ] Cuentas bancarias verificadas.
- [ ] Numero WhatsApp E.164 verificado.
- [ ] Redes sociales y canal de YouTube verificados.
- [ ] Mapa y direccion verificados.
- [ ] Metadata y JSON-LD revisados.
- [ ] Accesibilidad basica revisada.
- [ ] Responsive mobile y desktop revisado.
- [ ] README actualizado.
- [ ] `pnpm lint` exitoso.
- [ ] `pnpm build` exitoso.

## 18. Orden recomendado de implementacion

1. Corregir datos mock, tokens y layout publico.
2. Construir home.
3. Construir catalogo `/productos`.
4. Construir detalle de producto.
5. Construir carrito.
6. Construir checkout y WhatsApp.
7. Construir `/quienes-somos` y `/contacto`.
8. Construir `/login`.
9. Construir layout admin y dashboard.
10. Construir admin de productos.
11. Construir admin de ventas.
12. Construir admin de configuracion.
13. Agregar SEO estructurado, sitemap y robots.
14. Revisar accesibilidad y rendimiento.
15. Actualizar README y ejecutar validaciones finales.


## Reglas
- No corras lint y build despues de cada cambio. hazlo cada 5 cambios.
