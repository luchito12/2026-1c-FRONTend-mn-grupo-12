# Refactor del frontend de GitAula con Material UI

## Instrucción para el agente implementador

Implementá este plan en el frontend existente de GitAula. El objetivo es que la
aplicación sea clara, consistente y mantenible, con Material UI como base visual
y un manejo confiable de sesiones, navegación, formularios y acciones.

Trabajá sobre los flujos reales existentes. No reemplaces funcionalidades por
mocks, no inventes endpoints ni agregues datos ficticios de producción.
Inspeccioná los repositorios antes de modificar código: el estado actual puede
haber cambiado desde la elaboración de este documento.

Persistí hasta completar las etapas y sus verificaciones. Registrá los avances,
decisiones y bloqueos concretos al final de este archivo. No declares completado
un recorrido únicamente porque compila o porque sus componentes se renderizan.

## 1. Contexto y alcance

- Frontend: `/Users/facu/2026-1c-FRONTend-mn-grupo-12/gitaula-frontend`.
- Backend de referencia: `/Users/facu/dsi-proyecto-backend`.
- Stack actual: React 19, Vite, React Router, TanStack Query, React Hook Form y Zod.
- Arquitectura: SPA CSR. Conservarla.
- Autenticación: OAuth GitHub y cookie HttpOnly emitida por el backend.
- Cada usuario tiene un rol por comisión; no existe un rol docente global.
- Las rutas de navegación usan español; las rutas HTTP de negocio usan inglés.
- El backend local suele ejecutarse con Docker Compose en el puerto 8080.
- El frontend de desarrollo suele usar el puerto 5173 con proxy de Vite.

El alcance comprende tema, arquitectura frontend, sesión, login/logout,
navegación, componentes compartidos y todas las pantallas actuales:

- Inicio y dashboard académico.
- Listado, creación y detalle de comisiones.
- Administración de participantes.
- Creación, edición y detalle de trabajos prácticos.
- Equipos, integrantes, reasignación y repositorios.
- Entregas, actividad, evaluación y métricas.
- Rúbricas y notificaciones.
- Login, callback OAuth, acceso denegado y página no encontrada.
- Diagnóstico de GitHub como herramienta secundaria.

## 2. Reglas de trabajo

1. Leer los `AGENTS.md` aplicables y revisar el estado de Git de ambos repositorios.
2. Preservar cambios previos del usuario y evitar sobrescribir trabajo ajeno.
3. Mantener los contratos y rutas vigentes durante la migración.
4. Usar el backend como fuente de verdad de autorización y estado.
5. Mostrar estados de error y datos ausentes de forma explícita; no disfrazarlos
   con valores ficticios ni fallbacks que oculten un contrato roto.
6. Resolver las decisiones ordinarias dentro del alcance y documentarlas.
7. No crear repositorios reales, enviar invitaciones de GitHub ni modificar
   permisos externos como parte de las pruebas automáticas. Usar dobles de red
   exclusivamente en tests y explicar qué falta verificar con el servicio real.
8. No publicar, desplegar en servicios externos ni hacer commits/push sin una
   instrucción adicional. Los cambios de backend que sean necesarios deben ser
   mínimos, justificados y cubiertos por pruebas.

## 3. Diagnóstico inicial

Confirmar y corregir los problemas presentes, incluyendo:

- Páginas que mezclan consultas, mutaciones, permisos, formularios y presentación.
- JSX y CSS comprimidos en líneas difíciles de leer.
- Formularios grandes permanentemente visibles dentro de pantallas de detalle.
- Estilos globales con reglas que afectan controles de otras pantallas.
- Interpretaciones diferentes de IDs, roles, estados y fechas entre componentes.
- Invalidación de caché dispersa y acceso al QueryClient global desde componentes.
- Repetición del layout y del guard de sesión por cada ruta.
- Mensajes técnicos o ambiguos y acciones sin feedback localizado.
- Cierre de sesión que limpia la interfaz aunque falle la solicitud al servidor.
- Riesgos de cargas infinitas o respuestas tardías durante expiración/logout.

Antes de migrar, elaborar una matriz breve con cada pantalla, sus endpoints,
roles, acciones y estados de carga/error/vacío. Usarla para evitar regresiones.

## 4. Base visual con Material UI

### Dependencias

Conservar React, Vite, React Router, TanStack Query, React Hook Form y Zod.
Incorporar versiones compatibles de:

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

Revisar la documentación oficial vigente y actualizar el lockfile con el gestor
del proyecto. No agregar otra biblioteca de UI paralela.

Referencias:

- https://mui.com/material-ui/getting-started/installation/
- https://mui.com/material-ui/customization/theming/
- https://mui.com/material-ui/customization/theme-components/
- https://mui.com/x/react-data-grid/

### Dirección visual

Diseñar una aplicación académica sobria y legible:

- Títulos moderados y jerarquía tipográfica consistente.
- Superficies y separadores discretos, sin exceso de tarjetas o sombras.
- Espaciado, radios, densidad y tamaños definidos en el tema.
- Color principal reservado para acciones importantes.
- Colores semánticos para éxito, advertencia, error e información.
- Modo claro y oscuro; inicialmente respetar la preferencia del sistema.
- Permitir persistir únicamente preferencias visuales no sensibles.
- Adaptación real a escritorio y móvil.

Centralizar el tema con `ThemeProvider`, `CssBaseline`, tokens y overrides de
componentes. Usar `sx` para ajustes locales pequeños. Extraer estilos repetidos
y evitar acumular excepciones por pantalla.

### Componentes recomendados

| Necesidad | Componentes |
|---|---|
| Layout y navegación | AppBar, Toolbar, Drawer, Breadcrumbs, Container |
| Acciones | Button, IconButton, Menu, Tooltip |
| Formularios | TextField, Select, Autocomplete, Checkbox, FormControl |
| Listados | Table, TablePagination, List |
| Estados y avisos | Chip, Alert, Snackbar, Skeleton |
| Diálogos | Dialog, DialogTitle, DialogContent, DialogActions |
| Organización | Tabs, Paper, Card, Divider, Stack |

Empezar con tablas de Material UI. Incorporar Data Grid Community sólo si una
pantalla necesita su complejidad adicional. No depender de funciones pagas.

## 5. Arquitectura del código

Organizar por funcionalidad, con responsabilidades claras:

```text
src/
  app/
    providers/
    router/
  theme/
  shared/
    api/
    ui/
    lib/
  features/
    auth/
    commissions/
    projects/
    teams/
    deliveries/
    notifications/
```

Cada funcionalidad debe contener sus consultas, mutaciones, esquemas,
componentes y páginas según lo necesite. Evitar carpetas vacías y abstracciones
sin consumidores reales.

Las páginas coordinan la vista. Extraer componentes por responsabilidad real;
por ejemplo, el detalle de TP puede componerse de `ProjectHeader`,
`ProjectOverview`, `TeamsTable`, `RepositoryStatus`, `ProjectForm` y
`RubricEditor`.

### Contratos y datos

- Centralizar query keys y definir invalidación junto a cada mutación.
- Crear hooks de dominio, como `useProject`, `useCreateTeam` y `useSubmitDelivery`.
- Usar `useQueryClient()` dentro del árbol de React.
- Normalizar DTOs en la capa API, no dentro de cada pantalla.
- Validar identidad y campos obligatorios sin coerciones que conviertan valores
  vacíos o inválidos en IDs utilizables.
- Unificar roles y estados internos. Traducir etiquetas sólo en presentación.
- Eliminar fallbacks dispersos como `projectName || title || name` cuando el
  contrato ya tiene un campo definido.
- Incorporar TypeScript gradualmente, empezando por contratos, sesión y hooks.
  Los archivos migrados deben tener tipos útiles y evitar `any` indiscriminado.
- Manejar cancelación de consultas mediante las señales soportadas por el
  cliente HTTP y TanStack Query.

Configurar formato automático, ESLint y reglas de hooks. Incorporar scripts
de verificación adecuados, incluyendo typecheck si se introduce TypeScript.

## 6. Sesión y autenticación

### Estados explícitos

| Estado | Comportamiento |
|---|---|
| Comprobando | Carga breve; no mostrar contenido privado ni redirigir prematuramente |
| Autenticada | Acceso a la aplicación y a los recursos autorizados |
| Sin sesión | Login con recuperación del destino interno solicitado |
| Error de conexión | Mensaje recuperable y reintento; no afirmar que venció la sesión |
| Cerrando sesión | Progreso visible y prevención de nuevas acciones privadas |

### Reglas de seguridad y consistencia

- Mantener cookie HttpOnly y `credentials: 'include'`.
- No guardar JWT, cookies ni credenciales en localStorage o sessionStorage.
- Aceptar una identidad autenticada sólo si el contrato contiene un `userId`
  válido; normalizar variantes documentadas en un único punto.
- Centralizar el tratamiento de `401` y evitar redirecciones o avisos repetidos
  cuando fallen varias consultas simultáneas.
- Un `403` indica falta de permisos y no debe cerrar la sesión.
- Diferenciar errores de autenticación de errores de red o servidor.
- Revalidar sesión al recuperar visibilidad/foco cuando corresponda, con control
  de frecuencia y sin solicitudes repetidas innecesarias.
- Detener polling de datos privados cuando no haya sesión o la pestaña no lo
  necesite.
- Cancelar consultas privadas al salir y evitar que respuestas tardías vuelvan
  a poblar la caché de otro usuario o de una sesión cerrada.
- No retirar la consulta activa de `/me` de forma que su observer quede cargando
  indefinidamente.
- Sincronizar el cierre entre pestañas mediante una señal, por ejemplo
  BroadcastChannel, sin transmitir credenciales.
- Evitar que los resultados tardíos de mutaciones de una sesión anterior
  alteren la caché de una identidad nueva. Cancelar una solicitud no implica que
  el servidor haya revertido una operación ya iniciada.

El backend actual no ofrece renovación de sesión. Consultar `/me` no extiende
su vencimiento. No implementar un supuesto refresh token ni prometer renovación
automática sin un contrato backend real.

### Login y callback OAuth

1. Conservar la ruta interna solicitada antes del login.
2. Validar que el destino de retorno sea interno; impedir redirecciones abiertas.
3. Resolver el intercambio de `loginCode` una sola vez, incluyendo React StrictMode.
4. Comprobar la sesión antes de entrar a la aplicación.
5. Limpiar el código de la URL mediante reemplazo de navegación.
6. Recuperar el destino original autorizado o usar Inicio como alternativa.
7. Ante un resultado incierto de red, comprobar `/me` antes de repetir un código
   de un solo uso. Si no puede recuperarse, ofrecer reiniciar el login.

Una ruta de retorno temporal puede almacenarse sin credenciales si el redirect
OAuth exige persistencia entre navegaciones. Limpiarla al finalizar el flujo.

## 7. Cierre de sesión

Ubicarlo en el menú de cuenta, mostrando avatar o iniciales y usuario de GitHub.

Flujo esperado:

1. El usuario selecciona “Cerrar sesión”.
2. Mostrar “Cerrando sesión…” y prevenir clics repetidos.
3. Bloquear nuevas acciones privadas mientras se resuelve la salida.
4. Solicitar el cierre al backend.
5. Cuando el servidor lo confirma, cancelar consultas, limpiar caché privada,
   comunicar la salida a otras pestañas y navegar a Login.
6. Si la sesión ya está vencida, tratar el resultado según el contrato real.

Si falla la conexión, mostrar “No pudimos cerrar la sesión. Reintentar”. No
anunciar una salida exitosa mientras la cookie del servidor pueda seguir
vigente; el frontend no puede eliminar por sí mismo una cookie HttpOnly.

No pedir confirmación adicional para salir, salvo que haya cambios de formulario
sin guardar. Ofrecer entonces una decisión clara sobre esos cambios.

## 8. Layout y navegación

- Layout protegido único con rutas anidadas y `Outlet`.
- Mantener montados cabecera y navegación al cambiar de pantalla.
- AppBar con identidad, menú de cuenta y acceso a notificaciones.
- Drawer permanente en escritorio y temporal en móvil.
- Breadcrumbs con nombres de los recursos, no sólo sus IDs.
- Destacar la sección actual y conservar navegación atrás coherente.
- Mantener las URLs existentes o proporcionar redirecciones internas si se
  justifica algún cambio.
- Mantener diagnóstico GitHub fuera de la navegación principal.

Ejemplo de contexto:

```text
Comisiones / Diseño de Sistemas / TP 1 / Equipo Los testers / Entrega
```

## 9. Rediseño por pantalla

| Pantalla | Resultado esperado |
|---|---|
| Login | Acceso GitHub, carga, errores recuperables y motivo de retorno cuando corresponda |
| Inicio | Próximos vencimientos, entregas que requieren acción y accesos a comisiones |
| Comisiones | Listado con materia, período, nombre y rol; búsqueda local si los datos están completos |
| Comisión | Pestañas Trabajos prácticos y Participantes |
| Crear/editar TP | Formulario compartido, organizado en información, fechas, equipos y GitHub |
| TP | Pestañas Resumen, Equipos y Rúbrica; acción de edición identificable |
| Equipo | Integrantes, estado, repositorio, entrega y acciones autorizadas |
| Entrega | Estado y próxima acción arriba; evaluación, actividad y métricas organizadas debajo |
| Notificaciones | Nuevas/leídas, fecha legible, acceso al recurso y feedback de lectura |
| Diagnóstico GitHub | Herramienta secundaria, con explicación y permisos consistentes |

### Comisión y participantes

- Tabla con usuario, rol, estado y acciones contextualizadas.
- Diálogo para agregar participante con validación y feedback.
- Cambiar rol o desactivar con mensajes que expliquen las consecuencias.
- Mostrar de manera comprensible el conflicto del último docente activo.
- Permitir reactivar si el endpoint vigente lo admite.
- No confundir un usuario no registrado con un fallo de conexión.

### Trabajos prácticos

- “Crear equipo” abre un diálogo; no mantener el formulario ocupando la vista.
- Compartir esquema y campos de creación/edición del TP.
- Mostrar por separado fecha de entrega y plazo de formación.
- Explicar la política de entregas tardías y el tipo individual/grupal.
- Validar dependencias entre fechas y modalidad.
- Para seleccionar integrantes, usar Autocomplete con participantes activos de
  la comisión, mostrando nombre/usuario y rol. Conservar IDs como valores
  internos y enviar el formato que acepta la API.
- No presentar filtros o paginación como si abarcaran datos que el cliente no
  recibió; documentar cualquier necesidad real de paginación backend.

### Equipos y repositorios

Mostrar de forma independiente:

- Estado del equipo.
- Estado del repositorio.
- Estado de invitaciones o sincronización de accesos.

“Equipo confirmado” no debe interpretarse como “Repositorio listo”. Mostrar
faltantes de configuración, fallos recuperables, enlace al repo y reintento
según los datos reales disponibles.

Durante solicitudes largas, usar progreso indeterminado y texto explicativo.
No inventar porcentajes ni estados de servidor que no existan. Ante timeout,
comprobar el estado antes de ofrecer repetir una creación.

### Entregas y evaluación

- Mostrar únicamente acciones permitidas por la API y el estado vigente.
- Usar textos como “Marcar lista para revisión”, “Tomar revisión”, “Solicitar
  cambios” y “Aprobar entrega”.
- Distinguir evaluación formal del estado de revisión.
- Mostrar criterios, máximos, puntajes, devolución y fecha de evaluación.
- Conservar formularios en edición durante refetch de fondo; no remontarlos ni
  sobrescribir cambios del usuario por recibir datos actualizados.
- Si hay datos remotos nuevos durante una edición, resolverlo explícitamente.
- Presentar actividad y métricas con etiquetas y formatos entendibles.

## 10. Botones, formularios y feedback

Aplicar estas reglas en toda la aplicación:

- Una acción principal por sección; acciones secundarias visualmente subordinadas.
- Etiquetas concretas: Guardar TP, Confirmar equipo, Agregar participante.
- Progreso localizado en el botón o fila afectada.
- Evitar envíos duplicados y deshabilitar únicamente los controles necesarios.
- No reintentar automáticamente mutaciones sensibles ante fallos de red.
- Mostrar error cerca de la acción y conservar lo ingresado.
- Mostrar éxitos con Snackbar breve; errores persistentes con Alert o helper text.
- Mapear errores de validación a campos cuando el contrato lo permita.
- Advertir al abandonar cambios sin guardar.
- Usar enlaces para navegar y botones para ejecutar acciones.

Las confirmaciones deben explicar la consecuencia. Ejemplo:

> Confirmar este equipo creará su entrega e intentará generar el repositorio
> desde el template configurado.

Implementar componentes compartidos sólo para patrones reales: encabezado,
confirmación, estado vacío, errores y estados de dominio. Usar componentes MUI
directamente para controles comunes; evitar wrappers que sólo renombren props.

## 11. Fechas, texto y accesibilidad

- Centralizar traducciones de roles, estados y mensajes de dominio.
- Formatear fechas en español y explicar la zona horaria aplicable.
- Tratar fechas sin hora como fechas de calendario; no introducir corrimientos
  de día al convertirlas accidentalmente a timestamps locales.
- Diferenciar fecha límite de equipos, fecha de entrega y última actividad.
- Verificar teclado, foco y devolución del foco al cerrar diálogos.
- Asociar labels y errores a los campos.
- Usar texto e íconos además de color para comunicar estados.
- Mantener contraste, tamaños de controles y navegación móvil adecuados.
- Usar Skeleton para carga inicial; conservar contenido durante refetch de fondo.
- Dar una próxima acción útil en estados vacíos.
- Incorporar una barrera de errores con recuperación para evitar pantallas en blanco.

## 12. Secuencia de implementación

| Etapa | Entregable | Condición para avanzar |
|---|---|---|
| 0. Relevamiento | Matriz de pantallas, endpoints y roles; baseline de tests/build | Contratos y recorridos existentes identificados |
| 1. Base | Tema MUI, formato, layout y rutas anidadas | Navegación estable en escritorio y móvil |
| 2. Sesión | Login, callback, expiración y logout | Casos de sesión, red y múltiples pestañas cubiertos |
| 3. Patrones | Botones, diálogos, estados y formularios | Feedback y comportamiento uniformes |
| 4. Pantalla de referencia | Detalle de TP completo con equipos y rúbrica | Patrones visuales y de interacción validados |
| 5. Migración | Comisiones, equipos, entregas, dashboard y notificaciones | Recorridos de docente y alumno conservados |
| 6. Cierre | Limpieza de CSS anterior, accesibilidad y regresión | Verificaciones completas sin errores bloqueantes |

Migrar de forma incremental. Retirar estilos anteriores únicamente cuando sus
consumidores hayan sido migrados; evitar que reglas viejas modifiquen controles
MUI. No mantener dos implementaciones activas de la misma pantalla al finalizar.

## 13. Pruebas y criterios de aceptación

### Sesión

- Recargar una ruta protegida con sesión válida sin parpadeos de Login.
- Entrar directamente a una entrega sin sesión y recuperar el destino después
  del login, si el usuario tiene permisos.
- Diferenciar sesión vencida, acceso denegado y backend desconectado.
- No quedar cargando indefinidamente si `/me` devuelve 401 durante la restauración.
- Manejar callback OAuth y StrictMode sin canjear dos veces el código.
- Cerrar sesión correctamente y mostrar un fallo de red sin afirmar éxito.
- Sincronizar el cierre entre dos pestañas.
- Evitar datos privados restaurados por respuestas tardías o al cambiar de cuenta.

### Interacción y dominio

- El alumno no ve controles docentes y no accede visualmente a datos ajenos.
- Los botones no generan doble envío y muestran progreso localizado.
- Los formularios conservan valores después de errores de red o validación.
- El refetch de fondo no borra evaluaciones o formularios en edición.
- Se puede crear/editar TP, gestionar participantes y formar/confirmar equipos.
- El estado del repositorio y sus errores se entienden sin confundirlos con el equipo.
- Se puede entregar, revisar y cargar una evaluación con puntajes válidos.
- Las notificaciones se consultan y marcan como leídas con feedback.
- Los recorridos principales funcionan con teclado y en móvil.

### Verificación técnica

- Mantener y adaptar las pruebas existentes según el comportamiento esperado.
- Agregar pruebas de integración de componentes con React Testing Library y
  dobles HTTP con MSW cuando resulte útil.
- Cubrir los escenarios críticos de sesión, permisos, formularios y acciones;
  evitar tests que sólo repitan detalles de implementación.
- Ejecutar tests, build, lint y typecheck según los scripts incorporados.
- Verificar visualmente las pantallas migradas en escritorio y móvil.
- No dejar errores de consola, promesas rechazadas sin tratar ni pantallas en blanco.
- Separar la evidencia automatizada con GitHub simulado de la validación externa real.

Comandos actuales de referencia:

```bash
cd /Users/facu/2026-1c-FRONTend-mn-grupo-12/gitaula-frontend
npm test -- --run
npm run build
```

Agregar y ejecutar `npm run lint` y `npm run typecheck` cuando correspondan a la
configuración efectivamente implementada.

## 14. Entrega del agente

Al terminar, informar:

1. Qué se migró y qué comportamiento cambió para el usuario.
2. Dónde quedaron tema, sesión, contratos, hooks y componentes principales.
3. Qué pruebas y verificaciones visuales se ejecutaron y sus resultados.
4. Qué depende de GitHub real, configuración externa o cambios de backend.
5. Cualquier parte pendiente con causa concreta; no ocultarla detrás de un build exitoso.

### Registro de ejecución

Actualizar este apartado durante la implementación con etapas completadas,
decisiones relevantes, verificación y pendientes concretos.

- Estado inicial: plan preparado; refactor Material UI aún no iniciado.


#### 2026-11-25 — Etapa 0: relevamiento previo a la migración

- Ambos repositorios contienen cambios previos, incluidos flujos académicos nuevos.
  Se conservan; respaldo del frontend previo a esta ejecución en `/private/tmp/gitaula-mui-baseline`.
- Instrucciones aplicables: AGENTS.md aportado en el chat (Postman CLI disponible);
  no se encontraron otros AGENTS.md en las rutas de los proyectos ni sus ancestros.
- Baseline: 6 archivos / 13 tests aprobados y build aprobado. Advertencias de
  anotaciones de Zod en Rollup preexistentes. No hay lint/typecheck configurados.
- Confirmados: logout con `finally` que borra identidad ante fallo; QueryClient
  global en componentes; guard/layout por ruta; callback susceptible a doble
  canje; polling sin frontera de sesión; formularios de evaluación y rúbrica con
  keys remotas que pierden edición; estilos globales que afectan todo control.
- Documentación oficial MUI revisada: instalación compatible con React 19,
  ThemeProvider, overrides y Data Grid. Se usarán tablas MUI; no se requiere Grid.

| Pantalla / ruta | HTTP vigente | Rol / acciones | Carga, error, vacío y riesgo que verificar |
|---|---|---|---|
| Login y callback | `/api/auth/me`, POST `/api/auth/exchange`, GET `/api/auth/github/login` | Público, cookie HttpOnly | 401 vs red; código único; retorno interno |
| Cuenta / logout | POST `/api/auth/logout` (204; revoca y expira cookie) | Autenticado | Fallo conserva identidad; bloquear acciones; sincronizar pestañas |
| Inicio `/` | GET `/api/dashboard`, `/commissions?userId=` | Participante; datos filtrados backend | Carga/error por sección, sin TPs/comisiones; polling |
| Comisiones `/comisiones` | GET `/commissions?userId=` | Autenticado, rol por fila | Carga/error/vacío; búsqueda sobre colección completa |
| Nueva comisión | POST `/commissions` | Autenticado, creatorUserId de sesión | Validación, duplicado, conservar valores |
| Comisión `/comisiones/:id` | GET `/commissions/:id`, `/commissions/:id/projects`, `/commissions/:id/participants` | Participante; docente crea TP y gestiona inscripciones | Secciones independientes; 403; sin TPs/participantes |
| Participantes | POST `/commissions/:id/enrollments`, PATCH `/commissions/:id/participants/:userId` | Docente; agregar por githubLogin, cambiar rol/estado ACTIVE/WITHDRAWN | Usuario no registrado; último docente; reactivar; errores locales |
| Nuevo/editar TP | POST `/commissions/:id/projects`, PATCH `/projects/:id` | Docente de comisión; nombre sólo en creación | Fechas UTC, modalidad, configuración GitHub; preservar edición |
| TP `/tps/:id` | GET `/projects/:id`, GET/PUT `/projects/:id/rubric` | Participante; docente edita TP/rúbrica | Pestañas; permiso por currentRole; sin equipos/rúbrica |
| Equipos del TP | POST `/projects/:id/teams`, PUT `/teams/:id/members/me`, POST `/teams/:id/confirmation`, `/teams/:id/repository` | Alumno autoorganizado o docente; members por IDs admitidos | Separar equipo/repo/invitaciones; creación incierta; doble envío |
| Equipo `/equipos/:id` | GET `/teams/:id`, DELETE `/teams/:id/members/me`, PATCH `/teams/:id/members/:userId` | canLeave/canConfirm/canReassign del servidor; acceso propio alumno | Reasignación confirmada; repo/error separado; refetch |
| Entrega `/entregas/:id` | GET/PATCH `/deliveries/:id`, PUT `/deliveries/:id/evaluation` | allowedActions; evaluación docente con rúbrica | Puntajes válidos; estado vs evaluación; preservar cambios ante refetch |
| Notificaciones | GET `/api/notifications`, PATCH `/api/notifications/:id/read` | Propias | Últimas 100; nuevas/leídas; feedback por fila y polling |
| Diagnóstico `/debug/github` | GET `/api/repos/:teamId`, POST `/api/repos`, GET `/api/webhooks/github` | Permiso validado backend; creación sólo docente de equipo | Herramienta secundaria; validar ID; nunca probar mutación real GitHub |
| Acceso denegado / 404 | HTTP 403 o ruta desconocida | Sin cerrar sesión ante 403 | Recuperación y navegación por teclado |

Decisiones: mantener SPA, rutas y contratos actuales. No se modifica el backend
para la migración visual. Las variantes DOCENTE/ALUMNO y estados persistidos del
dashboard se normalizarán en API; no se agregan datos ni endpoints ficticios.


#### 2026-11-25 — Etapas 1 a 6: implementación y verificación

**Etapa 1 — Base visual y navegación implementadas.** Se instalaron Material UI
9.6.0, sus íconos y Emotion con npm; se actualizó el lockfile. Tema central en
`src/theme/AppThemeProvider.jsx`, CssBaseline y overrides. Claro/oscuro sigue el
sistema y la elección manual sólo persiste `gitaula-theme`. AppBar, cuenta,
Drawer permanente/temporal y breadcrumbs se mantienen en un layout protegido
único. Las rutas españolas existentes se conservan. Diagnóstico está en cuenta,
fuera de la navegación principal. Carga de páginas por demanda y chunks de
proveedores separados: el mayor chunk final es de aproximadamente 392 kB,
sin la advertencia anterior de bundle mayor de 500 kB.

**Etapa 2 — Sesión implementada y probada.** AuthProvider, contexto y fronteras
de sesión tienen tipos TypeScript. `/me` valida identidad antes de permitir
acceso y distingue 401, 403 y red. El observer de sesión nunca se elimina durante
restauración. Foco/visibilidad revalida con staleTime de 60 segundos; no renueva
el vencimiento. Una falla de fondo de `/me` conserva formulario e identidad y
muestra reintento. La restauración se suspende en callback, donde el canje único
(incluido StrictMode) verifica `/me` antes de entrar, limpia la URL y recupera
el retorno interno validado. Un intercambio incierto consulta `/me` sin repetir
el código. Logout bloquea acciones y muestra progreso; conserva interfaz e
identidad si el servidor no confirma. Un 401 de logout se trata como sesión ya
inválida. La confirmación limpia consultas y mutaciones privadas y comunica
sólo la señal `logout` por BroadcastChannel. Se abortan solicitudes anteriores
y se comprueba la generación antes de aceptar respuestas/callbacks; un cambio
de identidad remonta únicamente el árbol privado para impedir borradores/datos
de otra cuenta. No se guardan credenciales ni identidad en almacenamiento web.

**Etapa 3 — Patrones compartidos implementados.** Estados MUI, Snackbar de éxito,
Alert persistente, diálogos con foco y retorno de foco, errores junto a la acción,
validación RHF/Zod y barrera de errores. Salir de rutas, cerrar formularios o
cerrar sesión con cambios pide una decisión sobre el borrador. El cierre simple
no pide confirmación. Las mutaciones se bloquean sincrónicamente contra doble
envío y no se reintentan automáticamente. HTTP utiliza señales de cancelación y
límites de espera de 20 s para consultas / 120 s para mutaciones. Ante red,
502 o 504, se relee el estado; si no se puede comprobar, el envío queda bloqueado
con “Comprobar estado”. No se inventan porcentajes ni se supone que cancelar
la solicitud revierta lo que el servidor ya procesó.

**Etapa 4 — TP de referencia implementado.** Pestañas Resumen/Equipos/Rúbrica,
formulario compartido de creación/edición, diálogo de equipo y Autocomplete de
participantes activos (nombre, usuario, rol, IDs internos). Se preservó que el
contrato permite integrantes docentes activos y ocupar un equipo individual
abierto sin integrantes. Se validan modalidad individual, integrantes y orden
de fechas; no se convierte un TP con equipos de varios miembros a individual
sin reasignarlos. Los estados de equipo, entrega, repositorio y accesos se
presentan por separado. Repositorio confirmado no se anuncia como listo. Las
rúbricas y evaluaciones conservan borrador durante refetch; al recibir una
versión distinta se exige revisar la nueva antes de guardar. Se eliminó el
remontaje basado en JSON/fecha remota. También se conserva la edición ante un
fallo de actualización de fondo; 403/404 sí retiran la vista del recurso.

**Etapa 5 — Pantallas restantes migradas.** Inicio/dashboard académico, búsqueda
local de comisiones, alta y detalle de comisión, pestañas y tabla de participantes,
alta en diálogo, cambio de rol/desactivación/reactivación con consecuencias y
conflicto del último docente; equipo e integrantes, reasignación confirmada,
entrega con allowedActions reales, evaluación formal separada del estado,
actividad y métricas; notificaciones nuevas/leídas con feedback por fila;
login/callback/acceso denegado/404; diagnóstico con permisos del equipo.
Notificaciones aclara el límite backend de 100. Tablas MUI tienen scroll propio,
indicación móvil y región enfocables; no se muestra paginación sobre datos que
no se recibieron. Fechas sin hora se mantienen en UTC; actividad se muestra en
horario argentino. No se incorporó Data Grid ni otra biblioteca visual.

**Etapa 6 — Limpieza y verificación local completadas.** Código organizado por
funcionalidad en `src/features`, layout/router en `src/app`, contratos/HTTP/keys,
mutaciones y UI en `src/shared`. Sólo el punto de entrada importa el QueryClient
global. Las páginas consumen hooks de dominio e invalidaciones centrales.
Se retiraron las cuatro hojas de estilos anteriores y sus consumidores.
Prettier, ESLint/reglas de hooks y TypeScript incremental tienen scripts.
No quedan dos implementaciones activas de una misma pantalla. Se preservaron
los flujos y pruebas previos, movidos junto con sus funcionalidades.

| Verificación final | Resultado / evidencia |
|---|---|
| `npm run lint` | Aprobado, sin errores |
| `npm run typecheck` | Aprobado, contratos/sesión/mutaciones tipados, sin `any` explícito |
| `npm run format:check` | Aprobado |
| `npm test` | 8 archivos, 48 pruebas aprobadas (baseline: 13) |
| `npm run build` | Aprobado; sin advertencia de tamaño de chunk. Persisten sólo dos advertencias de anotaciones de Zod preexistentes |
| `npm run test:e2e` | 20 pruebas Chrome aprobadas: 18 recorridos de interacción y 2 recorridos visuales multivista |
| Revisión visual | 37 capturas de escritorio 1440×1000 claro y móvil 390×844 oscuro; revisión de layout, formularios, tablas, diálogo, tipografía y contraste |
| Teclado/foco | Entrada y salida de diálogos, descarte anidado, pestañas y Drawer móvil verificados en Chrome |
| `npm run test:live` | 1 prueba con API real: proxy Vite, `/me` 401, comisión privada 401, logout anónimo 204 y recuperación a Login |
| `git diff --check` | Aprobado |

La evidencia está en `verification/`, con capturas en `verification/screenshots/`.
Los recorridos prueban altas y edición, payloads, error conservado, último docente,
reactivación, autoorganización, confirmación y reintento de repo, reasignación,
entrega/revisión/aprobación, evaluación con puntajes, cambios remotos, lectura
de notificaciones, retorno OAuth, logout fallido/múltiples pestañas, expiración,
falla de sesión de fondo y operación procesada con respuesta de red perdida.
Los errores JS y advertencias React/MUI del navegador hacen fallar los tests.
Se corrigieron durante la verificación props retiradas en MUI 9 y el orden de
cierre de diálogos anidados para recuperar el foco. Las pruebas live y simuladas
tienen salidas separadas para no interferir con trazas de otra ejecución.

**Límites y comprobaciones externas pendientes (no se declaran validados):**

- Los recorridos autenticados usan dobles HTTP exclusivamente en tests. El
  backend Docker real está disponible y se verificó sin credenciales. Completar
  OAuth con una cuenta real y recorrer datos académicos autenticados requiere
  esa sesión real; no se fabricó un token ni se alteró la base para obtenerla.
- No se crearon repositorios reales, enviaron invitaciones ni cambiaron permisos
  externos como prueba. Generación desde template, aceptación de invitaciones,
  sincronización de accesos y webhook firmado reales necesitan la App instalada,
  una organización/template accesibles y callback público de GitHub.
- El contrato no tiene ETag/versiones para escritura condicional. La detección
  frontend cubre cambios remotos recibidos, pero impedir atómicamente una edición
  concurrente aún no observada requiere soporte backend. No se cambió este
  contrato durante el refactor.
- El PATCH actual no renombra TPs ni elimina fechas usando `null`; la interfaz
  conserva el título y explica que la fecha existente se reemplaza. No se
  inventaron endpoints para sortear estas limitaciones.
- No se modificó código del backend en esta ejecución, ni se hizo commit, push,
  publicación o despliegue. Los cambios previos de ambos repositorios se
  conservaron; el respaldo inicial del frontend sigue en `/private/tmp`.

Estado final: implementación frontend y verificación local finalizadas; queda
pendiente únicamente la validación autenticada con GitHub real descrita arriba.


#### 2026-11-25 — Revisión solicitada: búsqueda/paginación y textos

- Se reemplazó el límite visible de 100 notificaciones y el filtro local de
  comisiones por búsqueda/paginación en SQL. Los endpoints existentes reciben
  `page`/`size`/`q` y notificaciones también `status=ALL|UNREAD|READ`; ambos
  devuelven contenido, página, tamaño, total de filas y total de páginas.
- Filtros, página y tamaño quedan en la URL. Buscar/cambiar tamaño o estado
  reinicia página; si una mutación vacía la última página, se vuelve a una válida.
  Se cancelan consultas abandonadas mediante la señal ya existente. La caché
  incluye búsqueda, filtros y página y se invalida completa tras las mutaciones.
- Backend conserva autorización por identidad/participación activa, valida
  límites y usa parámetros SQL con escape de comodines. El orden usa ID como
  desempate. V7 agrega dos índices de notificaciones. El dashboard cuenta todas
  las nuevas y el inicio muestra una primera página de seis comisiones.
- Se retiró de Login el texto explicativo de cookie HttpOnly. El mecanismo de
  autenticación permanece vigente.
- Aprovisionamiento manual: se explicó que es una herramienta de diagnóstico
  para crear un repo desde parámetros manuales. Se recomendó retirar ese
  formulario y mantener consulta técnica y reintento normal desde el equipo.
  No se retiró una funcionalidad sobre la que el usuario pidió una explicación.
- Perfiles: se recomendó un selector de vista Docente/Alumno en cabecera, que
  organice inicio y listados según los roles reales por comisión. No se creó un
  rol docente global ni se otorgaron permisos al cambiar una preferencia visual.
  El pedido de opinión no se trató como autorización para cambiar el modelo.
- Verificación: 48 pruebas frontend aprobadas; 24 pruebas de navegador
  aprobadas, incluidas cuatro nuevas de paginación/búsqueda y las vistas móviles;
  4 pruebas backend con Spring, MySQL real, GitHub simulado y rollback aprobadas.
  Las pruebas cubren más de 100 avisos, conteos privados, filtros antes de paginar,
  comodines literales, estados de lectura, participaciones retiradas, roles,
  parámetros inválidos y páginas fuera de rango. Se aprobó lint, typecheck,
  formato y build. Se actualizaron las capturas de las pantallas afectadas.
- Se reconstruyó el backend de Docker local para servir el nuevo contrato. No
  hubo commits, push, despliegue externo ni acciones reales de GitHub.

- Cierre de la revisión: backend Docker arrancó y validó las siete migraciones;
  `npm run test:live` aprobó 1 prueba contra ese contenedor actualizado.
