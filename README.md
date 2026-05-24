# Pesca Con Fe Ecommerce Frontend

Frontend completo para un ecommerce moderno de artículos de pesca en Shushufindi, Ecuador. Está construido con Next.js App Router, TypeScript, Tailwind CSS, componentes estilo shadcn/ui, lucide-react, Zustand, React Hook Form y Zod.

## Estado del proyecto

- Tienda pública con inicio, catálogo, filtros, detalle de producto, carrito, checkout, quiénes somos y contacto.
- Checkout por transferencia bancaria con cuentas nacionales de Ecuador y mensaje de WhatsApp prellenado.
- Carrito global con Zustand, drawer rápido, página de revisión, subtotal, envío Servientrega y total.
- Panel administrador visual con dashboard, gestión de productos, formularios, ventas, venta manual y configuración.
- Datos mock estructurados para productos, pedidos, cuentas bancarias y configuración del negocio.
- Base preparada para integrar Supabase, Cloudinary, Supabase Auth, RLS y Server Actions reales.

## Stack

- Next.js con App Router
- TypeScript
- pnpm
- Tailwind CSS
- shadcn/ui style components
- lucide-react
- tailwindcss-animate
- Framer Motion
- Zustand
- React Hook Form
- Zod

## Ejecutar en local

```bash
pnpm install
pnpm dev
```

Luego abre:

```bash
http://localhost:3000
```

## Rutas principales

- `/` inicio
- `/productos` catálogo con filtros
- `/productos/[slug]` detalle de producto
- `/carrito` carrito
- `/checkout` checkout por transferencia
- `/quienes-somos` historia, misión y comunidad de Pesca Con Fe
- `/contacto` contacto y mapa
- `/login` login visual mock
- `/admin` dashboard administrador
- `/admin/productos` gestión de productos
- `/admin/productos/nuevo` crear producto
- `/admin/productos/[id]/editar` editar producto mock
- `/admin/ventas` gestión de ventas y pedidos
- `/admin/ventas/nueva` crear venta manual
- `/admin/configuracion` configuración visual

## Integraciones futuras

Los comentarios `TODO` marcan puntos de integración para:

- Supabase Database
- Supabase Auth
- Cloudinary upload
- Supabase Storage si se decide usarlo
- RLS por roles
- Server Actions reales
- Persistencia de órdenes, productos, stock y configuración

## Flujo de pedido

1. El cliente agrega productos al carrito.
2. Abre el drawer del carrito y pasa a `/carrito` para revisar cantidades, envío y total.
3. Completa sus datos en checkout.
4. Elige transferencia bancaria.
5. El sistema genera un pedido pendiente de pago.
6. Se abre WhatsApp con el mensaje prellenado.
7. El cliente envía el comprobante.
8. El administrador confirma el pago.
9. Solo al confirmar pago se simula la reducción de stock.
10. El pedido puede marcarse como enviado.

## Envío

Servicio: Servientrega Ecuador.

- Cañas: `$8.50`
- Carretes: `$6.50`
- Otros productos: mínimo `$6.50`
- Si el carrito tiene varios productos, se toma el valor más alto aplicable.


## Reglas
- No corras lint y build despues de cada cambio. hazlo cada 5 cambios.
