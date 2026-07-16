# Pesca Con Fe

Ecommerce de Pesca Con Fe, tienda de pesca, camping y aventura ubicada en Shushufindi, Ecuador.

El proyecto utiliza Next.js App Router y Supabase para ofrecer catálogo jerárquico, productos con opciones, carrito, lista de deseos, autenticación, checkout y administración.

## Tecnologías

- Next.js 16.2.6 y React 19
- TypeScript y Tailwind CSS 4
- Supabase Database, Auth y Row Level Security
- Cloudinary para imágenes de productos
- Zustand para carrito y lista de deseos
- React Hook Form y Zod para formularios
- hCaptcha para proteger registro e inicio de sesión
- PayPhone para pagos con tarjeta
- pnpm como gestor de paquetes

## Funcionalidades

### Tienda pública

- Página de inicio con categorías, productos destacados y ofertas.
- Catálogo general con filtros, ordenamiento y paginación.
- Landings jerárquicas para categorías, clasificaciones y subclasificaciones.
- Detalle de producto con galería, opciones, stock, especificaciones y relacionados.
- Búsqueda desde el header.
- Carrito y lista de deseos persistentes en el navegador.
- Páginas informativas, preguntas frecuentes y contacto.
- Metadata, sitemap, robots y datos estructurados.

### Cuenta del cliente

- Registro con confirmación por correo e hCaptcha.
- Inicio y cierre de sesión con Supabase Auth.
- Recuperación y restablecimiento de contraseña.
- Perfil, direcciones y consulta de pedidos.

### Checkout

- Checkout disponible para usuarios autenticados.
- Envío a domicilio o retiro en el local.
- Pago por transferencia bancaria.
- Integración de pago con tarjeta mediante PayPhone.
- Precio, disponibilidad y stock validados nuevamente en el servidor.

> La integración de PayPhone está implementada, pero debe certificarse de extremo a extremo en el entorno configurado antes de considerarla lista para producción.

### Administración

- Acceso protegido por sesión y perfil administrador activo.
- Gestión de productos, imágenes, marcas, opciones, atributos y stock.
- Gestión del catálogo jerárquico y contenido de sus landings.
- Gestión de pedidos y estados operativos.
- Imágenes de productos almacenadas en Cloudinary.

## Rutas principales

### Sitio público

| Ruta | Descripción |
| --- | --- |
| `/` | Inicio |
| `/productos` | Catálogo general |
| `/productos/[...slug]` | Landing de categoría, clasificación o subclasificación |
| `/producto/[slug]` | Detalle de producto |
| `/carrito` | Carrito |
| `/lista-deseos` | Lista de deseos |
| `/checkout` | Checkout autenticado |
| `/checkout/resultado` | Resultado de pago |
| `/quienes-somos` | Información del negocio |
| `/preguntas-frecuentes` | Preguntas frecuentes |
| `/contacto` | Contacto |
| `/login` | Registro e inicio de sesión |
| `/recuperar-contrasena` | Solicitud de recuperación |
| `/restablecer-contrasena` | Cambio de contraseña |

### Cliente

| Ruta | Descripción |
| --- | --- |
| `/mi-cuenta` | Perfil, direcciones y pedidos |

### Administración

| Ruta | Descripción |
| --- | --- |
| `/admin` | Panel administrativo |
| `/admin/productos` | Productos |
| `/admin/productos/nuevo` | Crear producto |
| `/admin/productos/[id]/editar` | Editar producto |
| `/admin/marcas` | Marcas |
| `/admin/pedidos` | Pedidos |

## Desarrollo local

Instala las dependencias y levanta el servidor:

```bash
pnpm install
pnpm dev
```

Validaciones disponibles:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Los pull requests y cambios enviados a `main` ejecutan de forma automatizada lint, revision de tipos y pruebas unitarias mediante GitHub Actions. Dependabot revisa semanalmente actualizaciones menores y parches de dependencias.

Las credenciales y secretos deben configurarse mediante `.env.local` y variables de entorno de Vercel. Nunca deben subirse al repositorio.
