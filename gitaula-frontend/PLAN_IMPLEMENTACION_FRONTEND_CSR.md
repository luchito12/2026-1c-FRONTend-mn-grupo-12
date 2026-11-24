# Plan de implementación — Frontend CSR de GitAula

## Decisión de arquitectura

El cliente será una **SPA CSR** con React y Vite. No se utilizará SSR, Next.js ni se almacenará el JWT en el navegador.

- La sesión vive en la cookie `HttpOnly` emitida por el backend.
- Todas las llamadas usan `credentials: 'include'`.
- El backend decide la autorización; el frontend sólo adapta las vistas y acciones al rol que devuelve la API.
- El frontend se despliega como estático e independiente del backend.

## Prompt para implementación

```text
Trabajá en `/Users/facu/2026-1c-FRONTend-mn-grupo-12/gitaula-frontend` e implementá el frontend completo de GitAula como una SPA CSR con React y Vite.

No uses SSR, Next.js, cookies accesibles por JavaScript, `localStorage` para tokens ni mocks permanentes de negocio. La autenticación se realiza con la cookie `HttpOnly` del backend.

## Contexto

- Backend Spring Boot: OAuth GitHub, cookie de sesión, Cursos, Entregas y Servicio de Integración Git.
- La sesión se consulta en `GET /api/auth/me`; login inicia en `GET /api/auth/github/login`; logout usa `POST /api/auth/logout`.
- Las solicitudes HTTP deben usar siempre `credentials: 'include'`.
- El usuario puede ser `DOCENTE` en una comisión y `ALUMNO` en otra. No existe un rol global.
- Las rutas de negocio deben estar bajo `/api`. Si un endpoint del backend aún no usa ese prefijo, no inventar rutas paralelas: documentar el desajuste para corregir el contrato backend.

## Dependencias

Instalá únicamente lo necesario:

```bash
npm install react-router-dom @tanstack/react-query react-hook-form zod @hookform/resolvers
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

No agregar una librería de UI pesada. Reutilizar CSS propio y componentes accesibles.

## Estructura objetivo

```text
src/
  api/
    http.js
    auth.js
    commissions.js
    projects.js
    teams.js
    deliveries.js
    github.js
  app/
    App.jsx
    router.jsx
    queryClient.js
  auth/
    AuthProvider.jsx
    RequireSession.jsx
    useCurrentUser.js
  components/
    AppShell.jsx
    Header.jsx
    Sidebar.jsx
    PageHeader.jsx
    EmptyState.jsx
    ErrorState.jsx
    LoadingState.jsx
    StatusBadge.jsx
    ConfirmDialog.jsx
    FormField.jsx
  features/
    commissions/
    projects/
    teams/
    deliveries/
    reviews/
  pages/
    LoginPage.jsx
    AuthCallbackPage.jsx
    DashboardPage.jsx
    CommissionsPage.jsx
    CommissionCreatePage.jsx
    CommissionDetailPage.jsx
    ProjectCreatePage.jsx
    ProjectDetailPage.jsx
    TeamDetailPage.jsx
    DeliveryDetailPage.jsx
    GithubDebugPage.jsx
    NotFoundPage.jsx
  styles/
    tokens.css
    global.css
    layout.css
    components.css
```

No mantener toda la aplicación en un único `App.jsx`.

## Cliente HTTP

Crear `api/http.js` como único punto de acceso a `fetch`:

- Base URL: `import.meta.env.VITE_API_BASE_URL || '/api'`.
- Header `Accept: application/json`.
- Para JSON, enviar `Content-Type: application/json`.
- Siempre `credentials: 'include'`.
- Parsear respuestas JSON y texto de error de manera segura.
- Normalizar errores a un objeto con `status`, `message` y `details`.
- Para `401`, limpiar el estado de sesión y redirigir a `/login` desde el guard o la capa de auth.
- Manejar `403` con mensaje de permisos, `404` con estado vacío/no encontrado y `409` como conflicto de negocio visible para el usuario.

No leer ni manipular manualmente cookies de autenticación.

## Sesión y routing

Configurar `react-router-dom` y React Query.

### Rutas

| Ruta | Vista | Requiere sesión |
| --- | --- | --- |
| `/login` | Inicio de sesión con GitHub | No |
| `/auth/callback` | Canjea `loginCode` y redirige | No |
| `/` | Dashboard personal | Sí |
| `/comisiones` | Mis comisiones | Sí |
| `/comisiones/nueva` | Crear comisión | Sí |
| `/comisiones/:commissionId` | Detalle de comisión | Sí |
| `/comisiones/:commissionId/tps/nuevo` | Crear TP | Sí, docente |
| `/tps/:projectId` | Detalle de TP | Sí |
| `/equipos/:teamId` | Equipo y miembros | Sí |
| `/entregas/:deliveryId` | Entrega y actividad | Sí |
| `/debug/github` | Diagnóstico GitHub | Sí; no incluir en navegación principal |
| `*` | 404 | No |

Implementar `AuthProvider`:

1. Al iniciar, consultar `/auth/me`.
2. Durante la carga, mostrar una pantalla de inicio y no redirigir prematuramente.
3. Si hay sesión, conservar sólo el perfil devuelto por backend en estado React.
4. Si no hay sesión, permitir `/login` y redirigir rutas protegidas a `/login`.
5. Para login, navegar a `/api/auth/github/login`.
6. En callback, leer `loginCode`, hacer `POST /auth/exchange`, invalidar/refrescar `auth/me`, limpiar la URL y redirigir a `/`.
7. Logout: `POST /auth/logout`, limpiar caché React Query y navegar a `/login`.

## Contrato de API esperado

Implementar clientes separados para estas rutas. Si el backend aún no las expone, dejar la función preparada y mostrar un error claro de API; no inventar datos.

### Autenticación

```text
GET  /api/auth/me
POST /api/auth/exchange
POST /api/auth/logout
GET  /api/auth/github/login
```

### Comisiones

```text
GET   /api/comisiones
POST  /api/comisiones
GET   /api/comisiones/{id}
GET   /api/comisiones/{id}/participaciones
POST  /api/comisiones/{id}/participaciones
PATCH /api/comisiones/{id}/participaciones/{usuarioId}
```

### Trabajos prácticos, equipos y entregas

```text
GET  /api/comisiones/{id}/tps
POST /api/comisiones/{id}/tps
GET  /api/tps/{id}
POST /api/tps/{id}/equipos
PUT  /api/equipos/{id}/miembros/me
DELETE /api/equipos/{id}/miembros/me
POST /api/equipos/{id}/confirmacion
GET  /api/equipos/{id}
GET  /api/entregas/{id}
```

El actor nunca se envía como `userId` en body o query: el backend lo deriva de la cookie. Para gestionar a otra persona, el docente envía solamente el ID del participante objetivo.

## Pantallas y casos de uso

### 1. Dashboard (`/`)

Mostrar:

- saludo y perfil GitHub;
- resumen de comisiones donde participa;
- próximos deadlines;
- entregas con estado pendiente/requiere acción;
- accesos rápidos: crear comisión para docentes y ver mis TPs para alumnos.

El dashboard no asume un rol global. Cada tarjeta de comisión debe mostrar el rol de esa participación.

### 2. Mis comisiones (`/comisiones`)

- Lista o grilla de comisiones activas.
- Materia, código, período, nombre y badge `Docente` / `Alumno`.
- Estado vacío útil para un usuario sin comisiones.
- Botón “Crear comisión”.

### 3. Crear comisión (`/comisiones/nueva`)

Formulario con validación Zod:

- nombre y código de materia;
- nombre de comisión;
- año;
- cuatrimestre.

Al crear, redirigir al detalle. No pedir ni mostrar un `creatorUserId`: el creador proviene de la sesión.

### 4. Detalle de comisión (`/comisiones/:commissionId`)

Cabecera con materia/comisión, período y rol actual.

Para cualquier miembro:

- lista de TPs;
- fechas y estados visibles;
- lista resumida de participantes.

Extras exclusivos de docente, ocultos visualmente si no corresponde:

- crear TP;
- administrar participantes;
- agregar alumno/docente;
- cambiar rol o estado, con confirmación antes de desactivar;
- no permitir quitar/degradar al último docente; mostrar el error `409` del backend.

La ocultación en UI no reemplaza la autorización backend.

### 5. Crear TP (`/comisiones/:commissionId/tps/nuevo`)

Formulario docente con:

- título y descripción;
- tipo `individual` / `grupal`;
- fecha de entrega;
- template owner y repositorio template;
- política de entrega tardía;
- formación de equipos `manual` / `autoorganizada`;
- fecha límite de equipos si aplica.

Validar dependencias: la fecha límite de equipos es obligatoria sólo para modo autoorganizado y no puede ser posterior a la entrega.

### 6. Detalle de TP (`/tps/:projectId`)

Para docente:

- equipos, integrantes, estado y entrega asociada;
- crear equipo manual;
- confirmar equipo;
- enlace al repo cuando exista;
- estado de aprovisionamiento y errores recuperables.

Para alumno:

- su equipo actual, o estado “sin equipo”; 
- crear/unirse/salir de equipo dentro del plazo y sólo en modo autoorganizado;
- enlace al repositorio, estado de entrega y deadline.

No mostrar el formulario técnico actual que pide `teamId`, usuarios y repositorio manualmente. La creación de repo debe ocurrir al confirmar el equipo desde el backend.

### 7. Equipo (`/equipos/:teamId`)

- miembros, estado `Formándose` / `Confirmado`;
- acciones permitidas según rol, estado y deadline;
- docente puede reasignar integrantes;
- alumno sólo puede gestionar su propia pertenencia antes de la confirmación;
- repo, invitaciones y fallos de aprovisionamiento como información de estado, no como formulario técnico.

### 8. Entrega (`/entregas/:deliveryId`)

- estado con una línea de progreso: Repo creado, En progreso, Entregada, En revisión, Cambios solicitados, Aprobada, Fuera de término;
- enlace seguro al repositorio y Pull Request cuando existan;
- fecha de última actividad;
- actividad proveniente de GitHub;
- lugar reservado para revisiones, rúbrica y devolución formal.

### 9. Diagnóstico GitHub (`/debug/github`)

Mover aquí la funcionalidad actual de aprovisionar repositorios y listar eventos. No mostrarla en la navegación principal. Debe advertir que es una herramienta técnica y limitarse a docentes autorizados cuando backend lo permita.

## Diseño y experiencia

- Mantener la identidad visual oscura ya iniciada, pero separar estilos por tokens, layout y componentes.
- Layout responsive: sidebar/cabecera en desktop y navegación compacta en móvil.
- Todas las acciones mutables deben tener estados loading, disabled y feedback de éxito/error.
- Usar HTML semántico, labels asociados, foco visible, navegación por teclado y mensajes `aria-live` para errores/notificaciones.
- Usar badges consistentes para roles, estados de equipo, entrega y aprovisionamiento.
- Confirmar acciones irreversibles o sensibles: desactivar participación, quitar miembro y confirmar equipo.

## Datos, caché y mutaciones

- Usar React Query para caché por recurso y para invalidar consultas luego de mutaciones.
- Ejemplos de query keys: `['session']`, `['commissions']`, `['commission', id]`, `['projects', commissionId]`, `['project', id]`, `['team', id]`, `['delivery', id]`.
- Luego de crear comisión invalidar `['commissions']`.
- Luego de editar participación invalidar comisión y participantes.
- Luego de confirmar equipo invalidar TP, equipo y entrega.
- No duplicar estado remoto en `useState` salvo para formularios o interacción local.

## Pruebas

Configurar Vitest + React Testing Library + MSW.

Cubrir como mínimo:

1. Restauración de sesión con cookie mediante `/auth/me`.
2. Redirección a login ante `401` en ruta protegida.
3. Callback OAuth: intercambio de `loginCode`, limpieza de URL y redirección.
4. Formulario de comisión sin `creatorUserId` y validaciones de campos.
5. Un alumno no ve acciones docentes en el detalle de comisión.
6. Un docente ve las acciones de participantes y crear TP.
7. Error `409` visible al duplicar participación o dejar una comisión sin docente.
8. Flujo de alumno para unirse/salir de equipo autoorganizado.
9. Estados loading/error/empty de las listas principales.

Agregar scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

## Secuencia de implementación

### Fase 0 — Contrato backend

1. Confirmar que todas las rutas de negocio usan `/api`.
2. Confirmar los JSON definitivos de Comisiones, TPs, Equipos y Entregas.
3. No iniciar una pantalla que dependa de una ruta inexistente sin registrar el desajuste.

### Fase 1 — Fundación CSR

1. Router, React Query, cliente HTTP y AuthProvider.
2. AppShell, navegación, login, callback, logout, 404.
3. Migrar la pantalla GitHub actual a `/debug/github`.

### Fase 2 — Comisiones y roles

1. Dashboard y Mis comisiones.
2. Crear comisión.
3. Detalle y administración de participantes por docente.

### Fase 3 — TPs y equipos

1. Crear/listar TPs.
2. Detalle de TP docente/alumno.
3. Formación, reasignación y confirmación de equipos.

### Fase 4 — Entregas e integración Git

1. Estado de repo y enlace a GitHub.
2. Detalle de entrega y línea de estados.
3. Feed de actividad de webhooks.

### Fase 5 — Code Review y cierre

1. Rúbricas, evaluación formal y métricas cuando el backend las exponga.
2. Centro de notificaciones.
3. Pruebas de regresión, accesibilidad, responsive y build de producción.

## Criterios de aceptación

- Es una SPA CSR pura servible con `npm run build`; no hay SSR.
- No hay JWT ni secretos en `localStorage`, `sessionStorage` o estado persistente del navegador.
- Todas las llamadas autenticadas usan cookies `HttpOnly` mediante `credentials: 'include'`.
- Un usuario ve datos y acciones según su participación por comisión, no por un rol global.
- El flujo demostrable es: login → comisión → TP → equipo → confirmación → repo/entrega → estado GitHub.
- La consola técnica de GitHub no es el flujo principal de la aplicación.
- `npm run build` y `npm test` finalizan correctamente.
```
