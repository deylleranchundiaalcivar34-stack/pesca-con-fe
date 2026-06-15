# Pesca Con Fe

Proyecto ecommerce para **Pesca Con Fe**, una tienda de artículos de pesca ubicada en Shushufindi, Ecuador. El sitio permite mostrar productos, administrar catálogo, recibir pedidos, guardar clientes, manejar direcciones, controlar estados de pedidos y trabajar con imágenes de productos subidas a Cloudinary.

El proyecto ya no es solamente un frontend visual con datos de prueba: actualmente usa **Next.js App Router**, **Supabase**, **Supabase Auth**, **Server Actions**, **Cloudinary**, **Zustand**, **React Hook Form** y **Zod**.

## Documentación principal

La explicación completa para principiantes está en:

- [`docs/Documentación.md`](docs/Documentación.md)

También hay documentación específica de base de datos en:

- [`docs/MODELO-DB.md`](docs/MODELO-DB.md)
- [`docs/supabase_pesca_con_fe_base.sql`](docs/supabase_pesca_con_fe_base.sql)
- [`docs/supabase_pesca_con_fe_seed.sql`](docs/supabase_pesca_con_fe_seed.sql)

## Stack técnico

- **Next.js 16.2.6** con App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase** para base de datos, autenticación y RLS
- **Cloudinary** para imágenes de productos
- **Zustand** para el carrito
- **React Hook Form** y **Zod** para formularios y validación
- **lucide-react** para iconos
- **Framer Motion** para animaciones
- **pnpm** como gestor de paquetes

## Funcionalidades actuales

- Tienda pública con inicio, catálogo, filtros, detalle de producto, carrito, checkout, quiénes somos y contacto.
- Catálogo leído desde Supabase: categorías, subcategorías, marcas, productos e imágenes.
- Carrito persistente en el navegador usando Zustand y `localStorage`.
- Checkout con datos de cliente, dirección, tipo de entrega, items del carrito y creación de pedido en Supabase.
- Pedidos anónimos o asociados a usuarios autenticados.
- Apertura de WhatsApp con mensaje prellenado después de crear un pedido.
- Login con Supabase Auth.
- Área de cliente con perfil, direcciones y pedidos.
- Panel administrador protegido por sesión y perfil admin activo.
- Administración de productos, marcas y pedidos.
- Subida y eliminación de imágenes de productos con Cloudinary.
- SEO básico con metadata, sitemap, robots y JSON-LD.

## Estructura general

```txt
src/
  app/                 Rutas de Next.js: páginas públicas, cuenta, checkout y admin.
  components/          Componentes visuales reutilizables.
  data/                Datos fijos del negocio usados por el frontend.
  hooks/               Hooks pequeños reutilizables.
  lib/                 Utilidades, Supabase, Cloudinary, envío, WhatsApp y constantes.
  store/               Estado global del carrito.
  types/               Tipos TypeScript del dominio.

docs/                  Documentación, modelo de base de datos y scripts SQL.
public/                Imágenes y recursos públicos.
```

## Rutas principales

### Sitio público

| Ruta | Descripción |
| --- | --- |
| `/` | Página de inicio |
| `/productos` | Catálogo con filtros |
| `/productos/[slug]` | Detalle de producto |
| `/carrito` | Revisión del carrito |
| `/checkout` | Formulario para crear pedido |
| `/quienes-somos` | Información del negocio |
| `/contacto` | Información de contacto |
| `/login` | Inicio de sesión y registro |

### Cliente

| Ruta | Descripción |
| --- | --- |
| `/mi-cuenta` | Resumen de la cuenta del cliente |

### Administración

| Ruta | Descripción |
| --- | --- |
| `/admin` | Dashboard administrativo |
| `/admin/productos` | Lista y gestión de productos |
| `/admin/productos/nuevo` | Crear producto |
| `/admin/productos/[id]/editar` | Editar producto |
| `/admin/marcas` | Crear, editar y desactivar marcas |
| `/admin/pedidos` | Gestión de pedidos |

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto.

```env
NEXT_PUBLIC_SUPABASE_URL=tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_publishable_key

CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Notas:

- `NEXT_PUBLIC_SUPABASE_URL` puede escribirse como dominio corto (`tu-proyecto`) o como URL completa (`https://tu-proyecto.supabase.co`).
- Las variables de Cloudinary solo se usan del lado servidor para subir y eliminar imágenes.
- `NEXT_PUBLIC_SITE_URL` se usa para metadata, sitemap y datos estructurados. En producción debería apuntar al dominio real.

## Ejecutar en local

Instala dependencias:

```bash
pnpm install
```

Inicia el servidor de desarrollo:

```bash
pnpm dev
```

Abre:

```txt
http://localhost:3000
```

## Comandos útiles

```bash
pnpm dev
```

Ejecuta el servidor local de desarrollo.

```bash
pnpm lint
```

Revisa problemas de ESLint.

```bash
pnpm build
```

Genera una build de producción y detecta errores de compilación.

```bash
pnpm start
```

Ejecuta la build de producción después de correr `pnpm build`.

## Base de datos

La base de datos está pensada para Supabase. Las tablas principales son:

| Tabla | Uso |
| --- | --- |
| `perfiles_admin` | Define quién puede entrar al panel administrador |
| `perfiles_cliente` | Guarda datos del cliente autenticado |
| `direcciones_cliente` | Guarda direcciones reutilizables |
| `categorias` | Categorías del catálogo |
| `subcategorias` | Subcategorías por categoría |
| `marcas` | Marcas de productos |
| `productos` | Productos vendibles |
| `producto_imagenes` | URLs y metadatos de imágenes en Cloudinary |
| `pedidos` | Encabezado del pedido |
| `pedido_items` | Productos incluidos en cada pedido |
| `movimientos_inventario` | Cambios de stock |

Los scripts SQL están en `docs/`. Para entender el modelo completo, revisa [`docs/MODELO-DB.md`](docs/MODELO-DB.md).

## Flujo de pedido

1. El cliente navega el catálogo.
2. Agrega productos al carrito.
3. Revisa cantidades, subtotal, envío y total.
4. Completa el checkout.
5. El sistema crea un pedido y sus items en Supabase.
6. El carrito se limpia.
7. Se abre WhatsApp con un mensaje prellenado.
8. El administrador confirma pago, envío, retiro o cancelación desde el panel.

## Imágenes de productos

Las imágenes no se guardan directamente en Supabase. El flujo es:

1. El administrador selecciona imágenes en el formulario de producto.
2. La Server Action sube cada archivo a Cloudinary.
3. Cloudinary devuelve una URL segura y un `public_id`.
4. Supabase guarda esa URL y ese `public_id` en `producto_imagenes`.
5. El catálogo muestra las imágenes usando las URLs guardadas.

## Autenticación y permisos

- Supabase Auth maneja las sesiones.
- Los clientes normales usan `perfiles_cliente`.
- Los administradores necesitan una fila activa en `perfiles_admin`.
- Las políticas RLS de Supabase protegen lecturas y escrituras según el tipo de usuario.
- El panel admin también se protege desde la app con validaciones de sesión/perfil.

## Notas para desarrollo

- No modificar archivos dentro de `docs/` sin revisar primero si son documentación o scripts SQL necesarios.
- Después de cambios de código, ejecutar como mínimo `pnpm lint`.
- Después de cambios grandes en rutas, Server Actions, Supabase o imports, ejecutar también `pnpm build`.
- Si se renombran archivos, buscar y actualizar todos los imports afectados.
- Para una explicación paso a paso del proyecto, usar `docs/Documentación.md` como guía principal.
