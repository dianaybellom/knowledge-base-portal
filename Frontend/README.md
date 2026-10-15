# Frontend: guía de uso

Aplicación web del Knowledge Base Portal en React 19 + Vite. Consume la API REST de `Backend/` (ver [`Backend/API.md`](../Backend/API.md)). Las instrucciones de instalación y ejecución local están en el [README principal](../README.md).

```powershell
npm install
npm run dev       # http://localhost:5173 (redirige /api a http://localhost:3000)
npm run build     # genera dist/
npm run preview   # sirve dist/ para revisarlo
```

## Estructura de `src/`

| Carpeta o archivo | Responsabilidad |
|---|---|
| `main.jsx`, `App.jsx` | Punto de entrada y definición de rutas (`react-router-dom`). Las páginas que muestran Markdown y las de gestión se cargan bajo demanda (`lazy`), para que el ingreso y la página principal no descarguen esas librerías. |
| `api/` | `client.js`: función `apiRequest` (agrega el token, serializa JSON o `FormData`, convierte los errores en `ApiError`). `endpoints.js`: una función por endpoint, agrupadas en `authApi`, `solutionsApi`, `documentsApi`, `componentsApi` y `usersApi`. |
| `context/` | `AuthContext.jsx`: sesión del usuario. `ToastContext.jsx`: avisos emergentes (toasts). |
| `hooks/` | `useApi` (estados de una petición y reintento), `useDocumentTitle` (título de la pestaña), `useFocusFirstError` (foco al primer campo con error), `useTheme` (modo claro u oscuro) y `useUnsavedChangesWarning` (aviso al salir con cambios sin guardar). |
| `components/` | Piezas reutilizables: estructura de página (`Layout`, `AuthLayout`, `ProtectedRoute`), navegación (`Breadcrumbs`, `UserMenu`, `ThemeToggle`, `SearchField`), estados (`StateViews`: skeleton, vacío y error), formularios (`FormField`, `MarkdownEditor`), contenido (`MarkdownView`, `TableOfContents`, `SolutionCard`, `CoverageCard`, `Badges`), el modal `ConfirmDialog` y los íconos SVG (`Icon`, `Logo`). |
| `pages/` | Una vista por ruta. `pages/manage/` tiene el formulario de solución y sus bloques de componentes y secciones; `pages/admin/` tiene la administración de usuarios. `authForm.js` contiene las validaciones de ingreso y registro en el cliente. |
| `utils/` | Catálogos con las etiquetas en español (`catalog.js`), validación de URLs de video (`embeds.js`), formato de fechas, iniciales y slugs (`format.js`) y división de la descripción por encabezados `##` (`markdownSections.js`). |
| `styles.css` | Todos los estilos: variables de color para el modo claro y el oscuro, componentes y puntos de quiebre. |

`public/theme-init.js` aplica el tema guardado antes de que cargue React, para evitar un destello del tema equivocado. Es un archivo aparte y no un script en línea, para respetar la política de seguridad de contenido (CSP).

## Rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `/login` | Ingreso | público |
| `/register` | Registro | público |
| `/` | Página principal (catálogo) | con sesión |
| `/solutions/:code` | Ficha de la solución | con sesión |
| `/solutions/:code/docs/:type` | Sección de documentación | con sesión |
| `/manage/solutions/new` | Nueva solución | author, admin |
| `/manage/solutions/:code/edit` | Editar solución | author, admin |
| `/admin/users` | Usuarios | admin |
| cualquier otra | Página no encontrada | con sesión |

Sin sesión, cualquier ruta protegida redirige a `/login`, que recuerda la página pedida y vuelve a ella después de ingresar. Con un rol insuficiente se muestra la vista **Sin permiso**, que indica el rol actual y ofrece volver al catálogo.

## Guía por rol

### Todos los roles (Consultor, Autor técnico y Administrador)

**Ingreso (`/login`) y registro (`/register`).** Formulario a la izquierda y panel institucional "Be Limitless. Be Successful." a la derecha, recreado con CSS. El registro pide nombre, correo y contraseña (8 caracteres o más) y deja la cuenta como Consultor. Los errores aparecen junto a cada campo; si la sesión expiró o se cerró, la pantalla de ingreso lo indica.

**Barra superior.** Logo (vuelve al inicio), enlace **Soluciones**, buscador (en todas las páginas salvo la principal, que tiene el suyo), botón de modo claro/oscuro y menú de la cuenta con el nombre, el rol, el correo y **Cerrar sesión**. Los enlaces de gestión dependen del rol (ver abajo).

**Página principal (`/`).**
- Buscador central: busca en el nombre y el resumen mientras se escribe (con una espera de 300 ms) y refleja el término en la URL (`/?search=…`), así que la búsqueda se puede compartir o recuperar con el botón Atrás.
- Tarjetas de tipo (*Add-on ERP*, *Plugin POS*, *Integración*) con el número de soluciones; al pulsar una se filtran los resultados por ese tipo (`/?type=…`).
- Con búsqueda o tipo activos se muestran los **Resultados**, con el número de coincidencias y **Limpiar búsqueda**.
- Sin filtros se muestran **Novedades recientes** (la última publicación de la sección Novedades de cada solución, con enlace a ella), **Estado de la documentación** (porcentaje de soluciones con documentación completa y barra de progreso) y **Soluciones destacadas** (las que tienen la documentación completa).

**Ficha (`/solutions/:code`).** Migas de pan; nombre con etiquetas de tipo y de estado documental; responsables (PO y Devs) a la derecha; tarjeta **Descripción** y una tarjeta por cada encabezado `##` de la descripción (por ejemplo, *Funcionalidades*); **Secciones** publicadas con su fecha de última actualización; y **Componentes** con su versión y el botón **Descargar**. Al descargar se pide una URL prefirmada a la API, se inicia la descarga y aparece el aviso "Descarga iniciada". Los componentes sin archivo muestran "Sin instalable".

**Sección (`/solutions/:code/docs/:type`).** Migas de pan, título y fecha de actualización, contenido en Markdown (tablas y videos de YouTube o SharePoint a 16:9) y la **Tabla de contenidos** generada con los títulos `##` y `###`. En escritorio la tabla va a la derecha y resalta el título visible; en móvil aparece plegada encima del contenido. Si la sección todavía no existe, se muestra un estado vacío con **Volver a la solución**.

### Autor técnico (y Administrador)

- La barra superior agrega **Nueva solución** y la ficha muestra **Editar solución**.
- **Nueva solución (`/manage/solutions/new`).** Datos generales: código (se normaliza a minúsculas con guiones mientras se escribe y no se puede cambiar después), nombre, tipo, estado de la documentación, resumen, descripción en Markdown con vista previa y responsables (un PO y varios Devs). Al crearla se pasa a la pantalla de edición.
- **Editar solución (`/manage/solutions/:code/edit`).** Cuatro bloques que se guardan por separado:
  1. **Datos generales**, igual que al crear, pero con el código como solo lectura.
  2. **Componentes:** lista con botón para eliminar y formulario para agregar (nombre, versión y archivo opcional de hasta 50 MB; se rechaza en el cliente si es más grande).
  3. **Secciones de documentación:** lista para elegir la sección (cada opción indica si está publicada), editor Markdown con modos **Escribir** y **Vista previa**, contador de caracteres, **Publicar/Guardar sección**, **Ver sección** y **Eliminar sección**. Si hay cambios sin guardar, cambiar de sección pide confirmación.
  4. **Eliminar solución**, con un modal que indica cuántas secciones y componentes se borrarán.

### Administrador

- La barra superior agrega **Usuarios**.
- **Usuarios (`/admin/users`).** Resumen de cuentas por rol y tabla con nombre, correo, `select` de rol, fecha de registro y **Eliminar** (con modal de confirmación). El cambio de rol se aplica al momento y se revierte si la API lo rechaza. En su propia fila, el administrador no puede cambiar su rol ni eliminarse, y una nota explica por qué.

## Manejo del estado y consumo de la API

**Sesión (`AuthContext`).**
- El token JWT se guarda en `localStorage` (`kbp_token`). Al abrir la aplicación, si hay token, se valida con `GET /auth/me`; mientras tanto, las rutas protegidas muestran "Verificando tu sesión…" en lugar de redirigir.
- `login`, `register` y `logout` actualizan el usuario en el contexto. `ProtectedRoute` lee ese usuario para decidir entre mostrar la vista, redirigir a `/login` o mostrar *Sin permiso*.
- Si cualquier petición con token responde 401 (token expirado, inválido o cuenta eliminada), `apiRequest` emite el evento `kbp:unauthorized`; el contexto borra el token, cierra la sesión y muestra el motivo en la pantalla de ingreso.

**Peticiones (`api/client.js`).** Todas usan rutas relativas `/api/...`: en desarrollo las redirige el proxy de Vite. Los errores llegan como `ApiError` con `status`, el mensaje en español de la API y `fieldErrors` (los `details` por campo), que los formularios muestran junto a cada campo. Si no hay conexión, el mensaje es "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo."

**Estados de interfaz (`useApi` + `StateViews`).** Cada vista con datos maneja cuatro estados:

| Estado | Implementación |
|---|---|
| Cargando | Skeletons con la forma del contenido, dentro de una región `role="status"` con un texto para lectores de pantalla. |
| Vacío | `EmptyState` con un mensaje útil y, cuando aplica, una acción (por ejemplo, "Ver todas las soluciones"). |
| Error | `ErrorState` (`role="alert"`) con el mensaje de la API y el botón **Reintentar**. |
| Éxito | Toasts en una región `aria-live="polite"` siempre presente, que se cierran solos a los 5 s o con su botón. |

Las peticiones se cancelan con `AbortController` cuando cambia la ruta o el componente se desmonta, para evitar respuestas tardías que pisen datos nuevos.

**Tema.** `useTheme` alterna el atributo `data-theme` del documento. Sin elección guardada sigue `prefers-color-scheme`; la elección se guarda en `localStorage` (`kbp_theme`).

## Decisiones de usabilidad y accesibilidad

Solo se listan las implementadas en el código.

### Heurísticas de Nielsen

| Heurística | Dónde se aplica |
|---|---|
| Visibilidad del estado del sistema | Skeletons de carga, "Verificando tu sesión…", "Buscando…" y número de resultados, botones que cambian a "Ingresando…", "Guardando…" o "Preparando…", toasts tras cada acción, "Hay cambios sin guardar" en los formularios y resaltado del título visible en la tabla de contenidos. |
| Coincidencia con el mundo real | Etiquetas en español del dominio (*Add-on ERP*, *Plugin POS*, *Autor técnico*, *Novedades*), fechas en formato local y migas de pan con los nombres de las soluciones. |
| Control y libertad del usuario | **Cancelar** en todos los modales (con foco inicial ahí), cierre con Escape o clic en el fondo, **Limpiar búsqueda**, filtros en la URL (funciona el botón Atrás) y aviso antes de cerrar la pestaña o cambiar de sección con cambios sin guardar. |
| Consistencia y estándares | Las mismas tarjetas, botones, campos y estados en todas las vistas; las etiquetas de catálogo salen de un único archivo (`utils/catalog.js`). |
| Prevención de errores | Modal de confirmación antes de cada eliminación; código de solución normalizado al escribirlo y bloqueado al editar; validación en el cliente con las mismas reglas que la API; rechazo de archivos de más de 50 MB antes de subirlos; contador de caracteres en los campos largos; el administrador no puede quitarse su rol. |
| Reconocimiento antes que recuerdo | Ayudas bajo cada campo (formato del código, convención de Novedades, cómo insertar un video), vista previa del Markdown y estado "publicada / sin contenido" en la lista de secciones. |
| Flexibilidad y eficiencia | Buscador en la barra superior en todas las páginas, búsqueda mientras se escribe, tarjetas de tipo como atajo de filtro y enlaces directos desde Novedades recientes a la sección. |
| Diseño estético y minimalista | Página principal sin listas de filtros, color de acción solo en elementos accionables y tarjetas que agrupan cada bloque de información. |
| Ayudar a reconocer, diagnosticar y recuperarse de errores | Mensajes que dicen qué pasó y cómo resolverlo, junto al campo afectado; foco automático en el primer campo con error; **Reintentar** en cada error de carga; mensaje claro si un video no está permitido. |
| Ayuda y documentación | Subtítulos en las pantallas de gestión y textos de ayuda contextuales en los campos. |

### Otros principios

- **Ley de Fitts:** la variable `--target-size` (44 px) define el tamaño mínimo de botones, enlaces de navegación y campos; las tarjetas de tipo y de sección son objetivos grandes que se pueden pulsar completos.
- **Ley de Hick:** la página principal ofrece solo tres tarjetas de tipo y un buscador; las secciones se eligen de una lista de cuatro opciones; cada modal tiene solo dos acciones.
- **Gestalt (proximidad y región común):** cada bloque de la ficha y del formulario vive en su propia tarjeta con título; los responsables se agrupan por rol (PO, Devs); en el editor, la ayuda, el contador y el error van pegados al campo.

### Accesibilidad (WCAG)

- **HTML semántico:** `lang="es"`, `header`, `nav` (principal, migas de pan y tabla de contenidos), `main`, `aside`, `article` y un único `h1` por página con encabezados en orden. Los `#` que escribe un autor se convierten en `h2` para no romper la jerarquía.
- **Enlace "Saltar al contenido"** al inicio de cada página. Al cambiar de ruta, el foco pasa al `main` para que los lectores de pantalla anuncien la nueva vista.
- **Foco visible:** contorno de 3 px con el color de acento en todos los elementos interactivos (`:focus-visible`).
- **Teclado:** todo es operable con teclado, incluidos el menú de la cuenta (se cierra con Escape y devuelve el foco), los modales nativos `<dialog>` (atrapan el foco y lo devuelven al cerrar), las tablas con desplazamiento horizontal (enfocables) y la tabla de contenidos (mueve el foco al título elegido).
- **Formularios:** cada campo tiene un `label` asociado; la ayuda, el contador y el error se enlazan con `aria-describedby`, y los campos con error llevan `aria-invalid`. Los botones de solo ícono tienen `aria-label` (mostrar contraseña, quitar responsable, cerrar aviso).
- **Anuncios:** toasts y estados de guardado en `aria-live="polite"`, cargas en `role="status"` y errores en `role="alert"`. Los botones de alternancia usan `aria-pressed` (modo oscuro, tarjetas de tipo, Escribir/Vista previa).
- **Contraste:** paleta en variables CSS para ambos modos; `--color-text-muted` se oscureció a `#595959` (el mockup usaba `#666666`) para cumplir AA en texto pequeño.
- **Movimiento:** transiciones cortas que se desactivan con `prefers-reduced-motion: reduce`.
- **Contenido embebido:** los videos se sanitizan con una lista blanca (solo YouTube y SharePoint, con `src`, `title` y `allowfullscreen`), siempre tienen `title` y se muestran a 16:9.
- **Responsive:** diseño *mobile-first* desde 360 px de ancho, con puntos de quiebre entre 30 rem y 64 rem. La tabla de contenidos se pliega en móvil y las tablas se desplazan dentro de su contenedor sin desbordar la página.
