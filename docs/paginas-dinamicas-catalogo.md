# Páginas dinámicas del catálogo

## Propósito

Este documento define la arquitectura propuesta para convertir cada nodo del catálogo jerárquico de Pesca Con Fe en una landing page dinámica, navegable e indexable.

El alcance de esta fase es exclusivamente documental. No implica cambios en las rutas, los componentes, la base de datos ni la implementación actual.

## 1. Diagnóstico del estado actual

El proyecto mantiene dos representaciones del catálogo:

1. El modelo original, compuesto por las tablas `categorias` y `subcategorias` y por las relaciones `productos.categoria_id` y `productos.subcategoria_id`.
2. El modelo jerárquico flexible, compuesto por la tabla autorreferencial `catalogo_nodos` y la relación `productos.catalogo_nodo_id`.

El modelo jerárquico permite una cantidad variable de niveles mediante `catalogo_nodos.parent_id`. Sin embargo, la interfaz pública actual interpreta únicamente cuatro posiciones:

| Posición | Nombre usado en la interfaz | Query param |
| --- | --- | --- |
| 0 | Categoría | `categoria` |
| 1 | Clasificación | `clasificacion` |
| 2 | Subclasificación | `subclasificacion` |
| 3 | Tipo de producto | `tipo` |

### Carga del catálogo

La función `getCatalogNavigation()` de `src/lib/supabase/data.ts` obtiene los nodos activos desde `catalogo_nodos`. Posteriormente, `buildCatalogTree()` transforma las filas planas en un árbol de objetos `CatalogNode`, relacionando cada nodo con su padre y ordenando recursivamente sus hijos.

Si la consulta no devuelve datos, la aplicación utiliza como respaldo las categorías y subcategorías del modelo original y los datos locales de `src/data/datos-negocio.ts`.

Paralelamente, `getCategories()` continúa consultando `categorias` y `subcategorias`. Esta representación antigua se utiliza en el inicio, como respaldo visual y en algunas partes de los filtros y formularios administrativos.

### Mega menú

El componente servidor `Header` carga el árbol mediante `getCatalogNavigation()` y lo entrega a:

- `CatalogMegaMenu` para escritorio.
- `MobileCatalogTree` para dispositivos móviles.

El árbol se representa recursivamente. Los nodos intermedios se utilizan para desplegar ramas y solamente los nodos hoja se convierten en enlaces. Como consecuencia, un nodo que contiene hijos no funciona actualmente como destino navegable.

La función `catalogHref()` convierte la posición de cada nodo en query params. Sólo utiliza los primeros cuatro niveles del camino.

### Productos y ruta jerárquica

La vista `productos_publicos` construye, mediante una CTE recursiva, los siguientes arreglos para cada producto:

- `catalogo_ruta_ids`
- `catalogo_ruta_nombres`
- `catalogo_ruta_slugs`
- `catalogo_ruta_niveles`

`mapProduct()` transforma esos arreglos en `Product.catalogPath`. Si no existe una ruta jerárquica, utiliza como respaldo la categoría y subcategoría antiguas.

### Filtrado

La página `src/app/productos/page.tsx` carga inicialmente:

- Todos los productos públicos.
- Categorías antiguas.
- Árbol jerárquico.
- Marcas activas.

Después entrega toda la información a `ProductCatalog`, un Client Component. El filtrado, ordenamiento y paginación ocurren en el navegador mediante estado React y `useMemo()`.

La jerarquía se compara por posición dentro de `product.catalogPath`. La paginación se realiza aplicando `slice()` al arreglo ya filtrado, con 12 productos por página.

La implementación actual no consulta a Supabase por el nodo seleccionado ni pagina los resultados en la base de datos.

## 2. Diferencia entre el filtro actual y una landing dinámica

### Filtro actual

Una URL como:

```text
/productos?categoria=senuelos&clasificacion=para-mar&subclasificacion=curricanes
```

representa el catálogo general con un estado inicial de filtros. La página conserva el mismo título, descripción, hero y metadata para cualquier combinación jerárquica.

Sus características son:

- La jerarquía vive en query params.
- Se descargan todos los productos antes de filtrar.
- El filtrado se ejecuta en el navegador.
- No se valida en el servidor que la combinación forme una ruta real.
- Los nodos intermedios no tienen una página propia.
- No existe contenido editorial o metadata específica para el nodo.
- Los buscadores no reciben una landing especializada.

### Landing dinámica

Una landing dinámica representa una entidad real del catálogo mediante su pathname:

```text
/productos/senuelos/para-mar/curricanes
```

El servidor debe resolver el camino completo, comprobar que el nodo existe y cargar contenido específico.

Cada landing podrá contener:

- Título propio.
- Descripción corta y contenido editorial.
- Imagen destacada y texto alternativo.
- Información técnica.
- Breadcrumbs.
- Nodos hijos o categorías relacionadas.
- Productos asociados al nodo y a sus descendientes.
- Metadata SEO y Open Graph.
- Canonical.
- Datos estructurados.

La jerarquía debe formar parte del pathname. Los query params deben reservarse para facetas temporales como marca, disponibilidad, precio, ordenamiento y paginación.

Ejemplo:

```text
/productos/senuelos/para-mar/curricanes?marca=rapala&orden=precio-asc&pagina=2
```

## 3. Colisión entre `/productos/[slug]` y `/productos/[...slug]`

Actualmente, la ruta:

```text
src/app/productos/[slug]/page.tsx
```

utiliza cualquier segmento dinámico de primer nivel como slug de producto. Por ejemplo:

```text
/productos/cana-casting-okuma-alaris
```

La ruta propuesta:

```text
src/app/productos/[...slug]/page.tsx
```

también debe capturar rutas de un solo segmento, por ejemplo:

```text
/productos/senuelos
```

Por ello, ambas rutas compiten por el mismo espacio de URL. No es recomendable mantener dos significados dinámicos en el mismo nivel:

- Un segmento podría ser el slug de una categoría.
- El mismo segmento podría ser el slug de un producto.
- Una categoría y un producto podrían llegar a compartir slug.
- La resolución dependería de consultas y reglas de precedencia difíciles de mantener.

Tampoco se recomienda utilizar un único catch-all que primero intente resolver un nodo y después un producto. Esa estrategia introduciría ambigüedad, aumentaría el costo de cada solicitud y complicaría los redirects, la caché y la metadata.

## 4. Recomendación de rutas

La arquitectura recomendada separa claramente el catálogo, sus landings y los detalles de producto:

| Ruta | Responsabilidad |
| --- | --- |
| `/productos` | Catálogo general |
| `/productos/[...slug]` | Landing dinámica de un nodo del catálogo |
| `/producto/[slug]` | Detalle individual de un producto |

### Catálogo general

```text
/productos
```

Debe continuar funcionando como punto de entrada general, sin seleccionar un nodo específico.

### Landings del catálogo

```text
/productos/senuelos
/productos/senuelos/para-mar
/productos/senuelos/para-mar/curricanes
/productos/canas/spinning/medium
/productos/indumentaria/camisetas/proteccion-uv
```

Todas estas rutas serán atendidas por:

```text
src/app/productos/[...slug]/page.tsx
```

En Next.js 16, la propiedad `params` será una promesa cuyo campo `slug` contendrá un arreglo de segmentos:

```ts
params: Promise<{ slug: string[] }>
```

### Detalle de producto

```text
/producto/cana-casting-okuma-alaris
```

La separación mediante el singular `producto` evita la colisión con las landings del catálogo y permite distinguir inmediatamente el tipo de recurso.

Las URLs antiguas de productos deberán conservarse temporalmente mediante redirects permanentes, después de verificar posibles colisiones.

## 5. Ejemplo: `/productos/senuelos/para-mar/curricanes`

Next.js entregará:

```ts
{
  slug: ["senuelos", "para-mar", "curricanes"]
}
```

El flujo esperado será:

```text
Solicitud de URL
    ↓
Validar y normalizar los segmentos
    ↓
Resolver en Supabase el camino completo
    ↓
¿Existe el nodo y está activo?
    ├── No → notFound()
    └── Sí
         ↓
         Cargar nodo, ancestros e hijos
         ↓
         Obtener IDs del nodo y de todo su subárbol
         ↓
         Consultar productos asociados y paginarlos
         ↓
         Generar metadata, breadcrumbs y contenido
         ↓
         Renderizar la landing
```

La búsqueda debe resolver la ruta completa. No debe buscar únicamente `curricanes`, porque los slugs sólo son únicos entre nodos hermanos y el mismo slug podría existir bajo padres diferentes.

La landing debería mostrar:

- Breadcrumb: `Productos > Señuelos > Para mar > Curricanes`.
- Título editorial del nodo.
- Descripción e información técnica.
- Imagen destacada.
- Productos asignados directamente a `Curricanes`.
- Productos asignados a nodos descendientes, si existieran.
- Hijos o categorías relacionadas.
- Metadata y canonical correspondientes a la URL completa.

Nota: antes de implementar se debe confirmar la escritura comercial y el slug definitivo entre `curricanes` y cualquier variante existente en los datos.

## 6. Cambios futuros en Supabase

No se realizarán en esta fase. La implementación futura debería considerar los siguientes cambios.

### Vista reutilizable de rutas

Extraer la CTE recursiva actualmente incorporada en `productos_publicos` y crear una vista pública de rutas de catálogo. Conceptualmente podría exponer:

- `nodo_id`
- `parent_id`
- `ruta_ids`
- `ruta_slugs`
- `ruta_nombres`
- `ruta_niveles`
- Una ruta textual como `senuelos/para-mar/curricanes`

Esta vista permitiría resolver el camino completo sin repetir lógica recursiva en varias consultas.

### Resolución de nodo por camino

Crear una función SQL o consulta controlada que reciba un arreglo de slugs y devuelva únicamente el nodo cuya ruta completa coincida.

La resolución debe:

- Validar todos los segmentos.
- Excluir nodos inactivos.
- Diferenciar slugs iguales ubicados bajo padres diferentes.
- Devolver los ancestros necesarios para breadcrumbs.

### Productos por subárbol

La consulta de una landing debe incluir productos asignados directamente al nodo y a todos sus descendientes.

Una función paginada debería aceptar:

- ID del nodo.
- Marca.
- Disponibilidad.
- Precio máximo.
- Ordenamiento.
- Página y tamaño de página.

La consulta deberá devolver los productos de la página y el total de coincidencias.

Inicialmente puede utilizarse una CTE recursiva. No es necesario introducir una tabla de clausura mientras el tamaño y la profundidad del catálogo sean moderados.

### Contenido editorial y SEO

`catalogo_nodos` ya contiene `nombre`, `descripcion` e `imagen`, pero se deberán evaluar campos adicionales:

- `titulo_landing`
- `descripcion_corta`
- `imagen_alt`
- `meta_title`
- `meta_description`
- `open_graph_image`
- `indexable`
- `contenido_tecnico`

Para contenido técnico compuesto por varias secciones ordenadas, se deberá evaluar una tabla hija como `catalogo_nodo_secciones` en lugar de guardar todo en una sola columna.

### Redirects e historial de rutas

Cambiar el slug o el padre de un nodo modifica su URL y las URLs de todos sus descendientes. Se recomienda registrar caminos anteriores en una estructura como:

```text
catalogo_rutas_redirect
- ruta_anterior
- nodo_id
- creado_en
- activo
```

Esto permitirá redirecciones permanentes y reducirá la pérdida de enlaces y posicionamiento.

### Integridad del árbol

Se deberán añadir protecciones para:

- Impedir ciclos.
- Impedir mover un nodo debajo de uno de sus descendientes.
- Normalizar slugs.
- Definir slugs reservados.
- Revisar el uso de `ON DELETE CASCADE` sobre subárboles.
- Mantener RLS pública únicamente para nodos activos.

## 7. Cambios futuros en Next.js

No se realizarán en esta fase.

### Página catch-all

Crear posteriormente:

```text
src/app/productos/[...slug]/page.tsx
```

La página deberá:

- Esperar y validar `params.slug`.
- Resolver el camino completo en Supabase.
- Ejecutar `notFound()` cuando la ruta no exista o esté inactiva.
- Cargar productos paginados en servidor.
- Renderizar breadcrumbs, contenido y nodos relacionados.
- Implementar `generateMetadata()`.
- Evaluar `generateStaticParams()` para prerenderizar nodos activos.

La ruta estática `src/app/productos/page.tsx` podrá continuar atendiendo `/productos` sin necesidad de utilizar un catch-all opcional.

### Nueva ruta de producto

El detalle deberá trasladarse conceptualmente a:

```text
src/app/producto/[slug]/page.tsx
```

Antes de hacerlo se deben definir redirects, actualizar enlaces internos y comprobar colisiones.

### Navegación

El mega menú, el menú móvil y las tarjetas del inicio deberán generar pathnames jerárquicos en lugar de query params.

Todos los nodos deberán ser enlaces, incluidos los que tengan hijos. La acción de navegar a la landing y la acción de desplegar una rama deben ser controles separados y accesibles.

### Filtrado y paginación

La jerarquía permanecerá en el pathname. Los filtros comerciales se expresarán mediante query params:

```text
?marca=rapala&disponibilidad=en-stock&orden=precio-asc&pagina=2
```

La página deberá leer `searchParams` en servidor y solicitar únicamente los productos necesarios. Los controles cliente actualizarán la URL y producirán una nueva renderización del resultado.

### SEO

Será necesario:

- Generar metadata por nodo.
- Definir canonical.
- Incluir nodos indexables en `sitemap.ts`.
- Añadir datos estructurados `BreadcrumbList` e `ItemList`.
- Evaluar `CollectionPage` para la landing.
- Evitar la indexación de combinaciones arbitrarias de filtros.

### Caché

Se deberán separar e invalidar funciones cacheadas para:

- Nodo por ruta.
- Rutas activas.
- Hijos y relacionados.
- Productos por nodo y filtros.
- Sitemap y metadata.

Cuando cambie el slug, el padre o el estado de un nodo, la invalidación deberá considerar al nodo, sus ancestros, sus descendientes y los productos afectados.

## 8. Plan de implementación por fases

### Fase 1: contrato de URLs

- Confirmar `/producto/[slug]` como ruta definitiva de detalle.
- Definir slugs reservados.
- Inventariar colisiones entre slugs de nodos y productos.
- Definir canonical y estrategia de redirects.
- Confirmar la escritura y slug de `curricanes`.

### Fase 2: base de datos

- Crear una migración incremental.
- Añadir campos o tablas de contenido editorial.
- Crear la vista reutilizable de rutas.
- Crear la resolución de nodo por camino.
- Crear la consulta paginada de productos por subárbol.
- Añadir validaciones contra ciclos.
- Añadir historial de rutas si se aprueba.

### Fase 3: capa de datos y tipos

- Separar los tipos de árbol, resumen y landing.
- Añadir funciones para resolver nodos y productos.
- Añadir funciones para rutas activas.
- Implementar caché e invalidación.
- Mantener temporalmente las funciones antiguas como compatibilidad.

### Fase 4: landing dinámica

- Crear `src/app/productos/[...slug]/page.tsx`.
- Implementar `notFound()` y metadata.
- Renderizar breadcrumbs, hero y contenido técnico.
- Mostrar nodos relacionados.
- Mostrar productos paginados.

### Fase 5: migración de navegación

- Actualizar mega menú y menú móvil.
- Hacer navegables los nodos intermedios.
- Actualizar tarjetas del inicio.
- Mantener temporalmente compatibilidad con URLs antiguas.

### Fase 6: migración del detalle de producto

- Crear `/producto/[slug]`.
- Actualizar enlaces internos.
- Actualizar JSON-LD, breadcrumbs y sitemap.
- Implementar redirects permanentes desde las URLs anteriores.

### Fase 7: filtros en servidor

- Representar facetas mediante query params.
- Consultar, ordenar y paginar en Supabase.
- Mantener controles interactivos cliente.
- Añadir canonical y reglas de indexación.

### Fase 8: administración

- Permitir editar contenido, imagen y SEO del nodo.
- Mostrar la URL resultante.
- Advertir sobre cambios de slug y padre.
- Evitar ciclos tanto en UI como en base de datos.

### Fase 9: pruebas y publicación

- Probar rutas profundas y nodos vacíos.
- Probar rutas inválidas e inactivas.
- Probar redirects y colisiones.
- Probar cambios de slug y padre.
- Verificar navegación móvil y escritorio.
- Verificar metadata, sitemap y datos estructurados.
- Ejecutar lint y build de producción.

## 9. Riesgos técnicos

### Colisiones de rutas

Mantener detalles y landings dinámicas bajo `/productos` podría producir ambigüedad entre slugs de producto y slugs de nodos.

### Pérdida de URLs existentes

Mover los productos a `/producto/[slug]` sin redirects rompería enlaces guardados, enlaces externos e indexación previa.

### Cambios en slugs y padres

Modificar un nodo padre cambia también las URLs de todos sus descendientes. La operación necesita invalidación de caché y registro de rutas anteriores.

### Ciclos jerárquicos

Un ciclo puede romper consultas recursivas, construcción de breadcrumbs y generación de rutas.

### Caché obsoleta

Una invalidación incompleta puede mostrar navegación, contenido o productos que ya no corresponden a la ruta actual.

### Contenido duplicado

Filtros, paginaciones y URLs antiguas pueden producir múltiples URLs con productos equivalentes. Se deberán definir canonical y reglas de indexación.

### Prerenderizado excesivo

Prerenderizar todos los nodos puede incrementar el tiempo de build si el catálogo crece considerablemente. Se debe evaluar una combinación de generación estática y renderizado bajo demanda.

### Compatibilidad temporal

Mientras convivan query params antiguos y rutas jerárquicas nuevas, diferentes enlaces podrían representar el mismo nodo.

### Productos sin nodo jerárquico

Los productos que todavía dependan exclusivamente de `categoria_id` y `subcategoria_id` deberán migrarse o tratarse explícitamente.

### Fallbacks que oculten errores

Los datos locales de respaldo permiten que la interfaz continúe funcionando, pero podrían ocultar fallos de consulta o migraciones incompletas.

## 10. Archivos que no deben modificarse todavía

Hasta aprobar el contrato de URLs y preparar la migración de Supabase, no se deben modificar:

- `src/app/productos/[slug]/page.tsx`
- `src/app/productos/page.tsx`
- `src/components/products/tarjeta-producto.tsx`
- `src/components/products/catalogo-productos.tsx`
- `src/components/products/filtros-productos.tsx`
- `src/components/layout/mega-menu-catalogo.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/controles-header-cliente.tsx`
- `src/components/home/tarjeta-categoria.tsx`
- `src/components/shared/producto-json-ld.tsx`
- `src/app/sitemap.ts`
- `src/lib/supabase/data.ts`
- `src/types/producto.ts`
- `src/app/admin/catalogo/acciones.ts`
- `src/components/admin/gestor-catalogo.tsx`
- `src/app/admin/productos/acciones.ts`
- `src/components/admin/formulario-producto.tsx`
- Los scripts SQL base ya aplicados.
- Las tablas antiguas `categorias` y `subcategorias`.
- Los módulos de carrito, checkout, autenticación y pedidos.

Cuando comience la implementación, los cambios de Supabase deberán realizarse mediante una migración incremental y reversible. No se deben reescribir scripts históricos ni eliminar el modelo anterior durante la primera etapa.

## Decisión arquitectónica propuesta

La recomendación que debe aprobarse antes de implementar es:

```text
/productos                    → catálogo general
/productos/[...slug]          → landings jerárquicas
/producto/[slug]              → detalle de producto
```

Esta separación elimina la ambigüedad entre nodos y productos, permite rutas jerárquicas de profundidad variable y ofrece una base clara para contenido especializado, consultas en servidor y SEO por nodo.
