# Plan

## 1. Rutas dinámicas por categoría (arregla el 404 de "prueba")

Hoy hay un archivo de ruta por cada categoría fija (`identity.tsx`, `intersections.tsx`, `rhythmic-matrices.tsx`, `photography.tsx`) más sus hijos `.$work.$piece` y `.$work.index`. Como `prueba` no tiene archivo, TanStack devuelve 404.

**Solución**: reemplazar las 4 familias de rutas por una única familia dinámica basada en el slug de categoría de la DB.

Nuevas rutas:
- `src/routes/$category.tsx` — layout (`<Outlet />`), valida que el slug exista y no colisione con rutas reservadas (`admin`, `auth`, `contact`, `news`, `media`, `press-dossier`, `sitemap.xml`).
- `src/routes/$category.index.tsx` — galería de la categoría (usa `ThemeGallery`).
- `src/routes/$category.$work.index.tsx` — galería de la subcategoría (usa `ThemeWorkPage`).
- `src/routes/$category.$work.$piece.tsx` — ficha de obra (usa `ArtworkPage`).

Cada loader hace `themeBySlug(themes, params.category)`; si no existe → `notFound()`. Se mantienen los `notFoundComponent`, `errorComponent` y `head()` actuales adaptados a params dinámicos.

Se borran los 16 archivos hardcodeados (`identity.*`, `intersections.*`, `rhythmic-matrices.*`, `photography.*`). Los links internos ya usan `theme.path` (que sale de la DB), así que siguen funcionando para las 4 categorías originales **y** para "prueba".

**Sitemap** (`sitemap[.]xml.ts`): ya lee de la DB, se revisa que emita todas las categorías activas.

## 2. Obra nueva en Micro-Identities no aparece

Causa más probable: la obra está en `status = 'draft'`. `getSiteContent` filtra por `.eq("status", "published")`. Se verifica en la DB y, si es eso, la nueva UX del toggle (punto 3) lo hace evidente al usuario.

Si estuviera publicada pero sin imagen destacada, tampoco aparece (línea `if (!principal) continue`). Se agrega en el admin un aviso "sin imagen destacada" en la fila.

## 3. Admin — mejoras en el listado de obras

Archivo: `src/routes/_authenticated/admin.works.tsx`.

- **Toggle publicado/borrador en el listado**: switch visible por fila que llama al `toggleStatus` existente + toast "Publicada" / "Guardada como borrador".
- **Quitar "Estado" del formulario interior** (bloque 12 del diálogo). Al crear una obra nueva, `status` arranca en `"draft"` por defecto; el usuario la publica desde el listado con el toggle.
- **Indicador visual** en la fila (columna existente) — badge verde "Publicada" / gris "Borrador" al lado del toggle.

## 4. Validaciones de guardado (toasts consistentes)

En los 3 admins (`admin.categories.tsx`, `admin.subcategories.tsx`, `admin.works.tsx`):
- Al guardar OK → `toast.success("Categoría guardada")` / `"Subcategoría guardada"` / `"Obra guardada"` (con el nombre entre comillas).
- Al fallar → `toast.error(mensaje)` (ya existe, se homogeneiza el texto).
- En works, si falta imagen destacada al publicar → aviso "Publicada sin imagen destacada — no se mostrará en la web".

## Notas técnicas

- Las rutas dinámicas viven al final del orden de matching, así que `/admin`, `/auth`, `/news`, etc. no chocan. Igual se añade una lista de slugs reservados en el loader para devolver `notFound()` si alguien crea una categoría con slug reservado.
- `routeTree.gen.ts` se regenera solo.
- `ThemeGallery`, `ThemeWorkPage`, `ArtworkPage` no cambian.
- No se toca la DB (schema ya soporta todo).

## Fuera de alcance (confirmar si querés incluir)

- Reordenar categorías desde el admin con drag & drop.
- Toggle también en el listado de categorías y subcategorías (hoy ya existe `is_active` en la DB — se puede sumar si querés).
