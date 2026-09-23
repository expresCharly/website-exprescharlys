# Expres Charlys — React + TypeScript

Sitio de Expres Charlys desarrollado con React, TypeScript y Vite.

## Desarrollo

```bash
npm install
npm run dev
```

## Verificación y producción

```bash
npm run typecheck
npm run build
```

## Menús compartidos

El carrusel consulta la lista `const images` de `index.html` en la rama `main` de
https://github.com/expresCharly/restaurant-menus y carga las imágenes de ese mismo
repositorio. No utiliza las copias antiguas de `imgs/menus` de este sitio.

Para actualizar los menús, modifica las imágenes en
`../Pagina para mostrar los menus/imgs` y sube los cambios a GitHub. Si agregas,
eliminas o reordenas menús, actualiza también la lista `const images` en el
`index.html` de ese proyecto. Conserva las mayúsculas de los nombres de archivo.
Ambos sitios usan así la misma fuente, sin copiar imágenes manualmente.

Después de publicar esta versión de la tienda una vez, los siguientes cambios
de menú no requieren recompilarla: se consultan al abrir o recargar la página.
GitHub puede tardar algunos minutos en renovar su caché. Los cambios guardados
solo en Windows no se publican automáticamente. Si GitHub no está disponible,
el carrusel muestra un mensaje con un botón para reintentar.

## Conectar Supabase

La importación inicial ya se completó en
[expresCharly's Project](https://supabase.com/dashboard/project/xwtecoynixesfwkhuuwe):
1,061 productos y 20 fotos en Storage. La configuración local está en `.env.local`,
excluido de Git. Se comprobó la lectura con la clave pública, los datos importados,
las 20 imágenes y los permisos de solo lectura para visitantes.
Para reflejar estos cambios en un sitio publicado, configura allí las variables
públicas y despliega la nueva versión.

Los siguientes pasos documentan cómo repetir la configuración en otro entorno.

1. Crea o elige el proyecto de Supabase destinado a esta tienda.
2. Ejecuta `npm run supabase:prepare`. Genera `supabase/setup.sql` con la tabla,
   permisos, bucket de fotos y los 1,061 productos actuales (1,043 importados y
   18 preexistentes). Repetir la importación conserva las filas existentes.
3. Abre el **SQL Editor** de ese proyecto y ejecuta `supabase/setup.sql` completo.
4. Copia `.env.example` a `.env.local` y completa `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_PUBLISHABLE_KEY` con los valores del diálogo **Connect** o
   **Settings → API Keys**. También se admite `VITE_SUPABASE_ANON_KEY` si el
   proyecto utiliza la clave pública antigua.
5. Reinicia `npm run dev`. Al publicar, configura esas mismas variables públicas
   en el alojamiento y vuelve a compilar.

Sin variables se muestra el catálogo local. Con Supabase configurado, el catálogo
remoto es la fuente de datos: se consultan todas las páginas, solo productos
activos, y los errores muestran un botón para reintentar. Una tabla vacía no
recupera productos eliminados desde el catálogo local.

Los visitantes tienen únicamente lectura de productos activos. Para cambiar
precios, existencias o fotos se utiliza el Dashboard de Supabase. No se ha añadido
un panel de administración a la página ni permisos de escritura para visitantes.
El stock es informativo: los pedidos actuales siguen enviándose por WhatsApp y
esta conexión no implementa reservas ni sincronización con un punto de venta.

## Conseguir imágenes por código

```bash
# Primera tanda de hasta 50 productos; guarda los resultados para reanudar.
npm run catalog:images

# Ampliar el conjunto a consultar. Omite los códigos que ya están en caché.
npm run catalog:images -- --limit=200

# Acotar la búsqueda por nombre.
npm run catalog:images -- --limit=50 "--match=Coca|Galleta|Leche|Aceite"

# Informe visual y actualización del archivo SQL antes de importarlo.
npm run catalog:report
npm run supabase:prepare
```

La fuente es Open Food Facts. El script valida códigos comerciales, consulta el
producto exacto, descarga la imagen frontal de 400 px y guarda la atribución y la
licencia CC BY-SA 3.0. Se conserva la foto sin modificar; los créditos aparecen
junto a cada imagen. La caché local está en `.cache/product-images/` y no se
versiona. Las fotos están en `public/product-images/`.

La API individual permite 15 consultas por minuto: el script espera al menos
4.5 segundos entre solicitudes. `--batch` permite consultas por lotes si el
buscador público está disponible; durante esta preparación devolvió HTTP 503.
`--refresh` vuelve a consultar los códigos seleccionados. Ejecutar un único
proceso de búsqueda a la vez para respetar los límites.

`reports/product-images.html` permite revisar las fotos encontradas y filtrar
pendientes. `reports/product-images.json` conserva el detalle, y
`src/data/product-images.json` contiene las asignaciones utilizadas por la tienda.
`src/data/image-review.json` conserva las decisiones de revisión visual para que
una nueva búsqueda no reincorpore una foto descartada.
Las discrepancias de nombre/marca o tamaño quedan para revisión. Una coincidencia
automática por código no equivale a una revisión visual del envase.
La fuente no cubre todo el catálogo: medicamentos, artículos sin código válido y
platillos propios pueden necesitar fotos del proveedor o del negocio.

## Subir las fotos a Supabase Storage

El catálogo importado funciona inicialmente con las fotos que se publican junto
a la página. Para moverlas a `product-images` en Supabase:

1. Completa `SUPABASE_SECRET_KEY` **solo en `.env.local`**, desde API Keys del mismo
   proyecto. Nunca uses el prefijo `VITE_` para esta clave ni la publiques.
2. Ejecuta `npm run supabase:images` para comprobar qué archivos se cargarían.
3. Ejecuta `npm run supabase:images -- --apply` para subir y vincular las fotos.

La carga conserva fotos personalizadas, utiliza nombres con hash para evitar
sobrescribir archivos y se puede reanudar. No necesita ni permite escritura de
visitantes en Storage. Después de usar el script puedes retirar la clave secreta
de `.env.local`; la página solo necesita la clave pública.

También puedes usar el Dashboard sin guardar una clave secreta: ejecuta
`npm run supabase:stage-images`, sube los JPEG de `.cache/storage-upload/` al bucket
`product-images` y después ejecuta `supabase/link-images.sql` en el SQL Editor.
Esta fue la ruta utilizada para las primeras 20 fotos.

## Verificación

`npm run supabase:verify` comprueba la importación inicial contra los datos locales
y la disponibilidad de las fotos en Storage, usando la clave pública. Una vez que
edites precios o productos en Supabase, esas diferencias con la importación
original serán esperadas.

`npm test` comprueba el catálogo importado, códigos, coincidencias y la lectura
con el cliente oficial de Supabase mediante respuestas simuladas: más de 1,000
filas, límite de servidor menor, catálogo vacío y fallo a mitad de consulta.
La conexión remota y las políticas deben comprobarse también en el proyecto real
después de ejecutar el SQL y configurar las variables.

Referencias: [Supabase API Keys](https://supabase.com/docs/guides/getting-started/api-keys),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Open Food Facts API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/).
