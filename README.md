# Pesca Con Fe

Proyecto ecommerce para **Pesca Con Fe**, una tienda de artículos de pesca ubicada en Shushufindi, Ecuador. El sitio permite mostrar productos, resolver preguntas frecuentes, administrar catálogo, recibir pedidos, guardar clientes, manejar direcciones, controlar estados de pedidos y trabajar con imágenes de productos subidas a Cloudinary.

El proyecto ya no es solamente un frontend visual con datos de prueba: actualmente usa **Next.js App Router**, **Supabase**, **Supabase Auth**, **Server Actions**, **Cloudinary**, **Zustand**, **React Hook Form** y **Zod**.

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

- Tienda pública con inicio, catálogo, filtros, detalle de producto, carrito, preguntas frecuentes, quiénes somos y contacto.
- Catálogo leído desde Supabase: categorías, subcategorías, marcas, productos e imágenes.
- Carrito persistente en el navegador usando Zustand y `localStorage`.
- Generación de pedidos con identidad bloqueada del perfil, dirección guardada o temporal, tipo de entrega e items del carrito.
- Pedidos disponibles únicamente para usuarios autenticados.
- Apertura de WhatsApp con mensajes ordenados después de crear un pedido o enviar una consulta.
- Preguntas frecuentes definidas en frontend y formulario de consulta que exige autenticación sin guardar datos en una tabla nueva.
- Login con Supabase Auth.
- Área de cliente con perfil, direcciones y pedidos.
- Panel administrador protegido por sesión y perfil admin activo.
- Administración de productos, marcas y pedidos, con indicador de guardado para evitar envíos duplicados.
- Subida y eliminación de imágenes de productos con Cloudinary.
- SEO básico con metadata, sitemap, robots y JSON-LD.

## Rutas principales

### Sitio público

| Ruta | Descripción |
| --- | --- |
| `/` | Página de inicio |
| `/productos` | Catálogo con filtros |
| `/productos/[slug]` | Detalle de producto |
| `/carrito` | Revisión del carrito |
| `/checkout` | Pantalla para generar un pedido autenticado |
| `/quienes-somos` | Información del negocio |
| `/preguntas-frecuentes` | Respuestas públicas y consulta autenticada por WhatsApp |
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
