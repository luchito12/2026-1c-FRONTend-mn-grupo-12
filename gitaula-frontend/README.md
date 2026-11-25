# GitAula frontend

SPA CSR con React 19, Vite, Material UI 9, React Router, TanStack Query, React Hook
Form y Zod. Mantiene las rutas españolas de navegación y los endpoints ingleses
existentes. La identidad sólo vive en memoria; la cookie HttpOnly la administra
el backend. No hay refresh token ni renovación automática de la sesión.

```bash
npm ci
npm run dev
npm test
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Abrir `http://localhost:5173`. Vite envía `/api`, `/commissions`, `/projects`,
`/teams`, `/deliveries` y `/users` a `http://localhost:8080`. Para otro puerto,
copiar `.env.example` a `.env` y ajustar `VITE_BACKEND_URL`. La configuración y
los contratos vigentes están en [CONTRATO_BACKEND_PENDIENTE.md](./CONTRATO_BACKEND_PENDIENTE.md).

El callback OAuth es `http://localhost:5173/auth/callback`. En Docker,
`BACKEND_PUBLIC_URL` y `FRONTEND_AUTH_CALLBACK_URL` deben ser alcanzables por el
navegador y GitHub. No usar el hostname interno del servicio Docker. La ruta de
retorno temporal se valida como interna, se guarda sin credenciales en
sessionStorage y se elimina al completar el acceso. localStorage sólo conserva
la preferencia visual `gitaula-theme`.

## Organización

- `src/theme`: tema claro/oscuro, tipografía, densidad y overrides MUI.
- `src/app/router`: rutas anidadas y pantallas de error; páginas cargadas por demanda.
- `src/app/layout`: AppBar, cuenta, Drawer móvil/escritorio y breadcrumbs con nombres.
- `src/features/auth`: proveedor de sesión tipado, guard, login y callback OAuth.
- `src/features/{commissions,projects,teams,deliveries,notifications,github,dashboard}`:
  páginas, formularios, API y hooks de cada dominio.
- `src/shared/api`: HTTP cancelable, contratos Zod/TypeScript, query keys,
  invalidaciones y mutaciones protegidas por generación de sesión.
- `src/shared/ui`: estados, confirmaciones, avisos de cambios sin guardar,
  feedback y barrera de errores. Se retiró el CSS global anterior.
- `src/shared/lib`: IDs/fechas, etiquetas, mensajes de dominio y bindings de formularios.

Notificaciones y Mis comisiones usan búsqueda y paginación del servidor. La URL
conserva `q`, `page`, `size` y, para notificaciones, `status`. Buscar, cambiar de
filtro o tamaño vuelve a la primera página. El inicio muestra seis comisiones
con acceso al listado completo. La migración backend V7 añade índices para las
consultas paginadas; las respuestas de las dos listas cambiaron a un objeto con
contenido y totales, por lo que ambos proyectos deben actualizarse juntos.

El servidor decide permisos. El cliente consume `currentRole`, `allowedActions`
y los flags del equipo, y restringe visualmente las acciones. Un 403 muestra
acceso denegado sin cerrar sesión. Una falla de red conserva la identidad y el
borrador; un logout fallido permite reintentar sin anunciar éxito. BroadcastChannel
sincroniza la salida entre pestañas sin transmitir identidad ni credenciales.

## Verificación

```bash
npm run test:e2e
npm run test:live
```

Playwright usa Chrome instalado (`channel: chrome`) y arranca Vite si hace falta.
En otra máquina se puede instalar Chrome con `npx playwright install chrome`.
`test:e2e` intercepta la API únicamente dentro de tests y bloquea servicios
externos. Verifica recorridos docentes/alumnos y genera capturas en
`verification/screenshots`. `test:live` requiere el backend local en 8080: no
usa dobles y sólo verifica sesión anónima, logout anónimo y proxy/rutas protegidas.
No crea datos académicos, repositorios ni invitaciones en servicios reales.

La validación autenticada con OAuth y GitHub real requiere una cuenta, la App
instalada, template accesible, permisos de organización y webhook público. Es
una comprobación externa pendiente; no se considera cubierta por los dobles.

El detalle por etapa, decisiones y límites está al final de
[PLAN_REFACTOR_FRONTEND_MUI.md](./PLAN_REFACTOR_FRONTEND_MUI.md).
