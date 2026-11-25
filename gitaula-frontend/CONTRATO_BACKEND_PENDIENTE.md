# Contrato vigente del backend

La autenticación e integración GitHub usan el prefijo `/api`; las rutas de negocio no lo usan. El cliente separa ambos orígenes y envía siempre la cookie de sesión.

| Área | Rutas disponibles | Observaciones para el frontend |
| --- | --- | --- |
| Autenticación | `/api/auth/*` | La sesión actual devuelve `userId`, necesario en las rutas de negocio. |
| Comisiones | `GET /commissions?userId={id}`, `GET /commissions/{id}`, `POST /commissions` | El alta requiere `creatorUserId`; los términos son `FIRST_TERM`, `SECOND_TERM` o `ANNUAL`. |
| Participantes | `GET /commissions/{id}/participants`, `PATCH /commissions/{id}/participants/{userId}`, `POST /commissions/{id}/enrollments` | Un miembro activo puede listarlos; sólo un docente puede inscribir, cambiar rol o desactivar. El body de actualización incluye `role` y `status`. |
| Proyectos | `GET` y `POST /commissions/{id}/projects`, `GET /projects/{id}` | El alta usa `projectName`, `description`, `teamFormationMode` y, si corresponde, `teamFormationDeadline`. |

La sesión está representada por una cookie HttpOnly. El backend verifica que el `userId` consultado coincida con esa sesión y que el usuario tenga una inscripción activa antes de devolver datos de una comisión o sus TPs.

## Ciclo académico

- `PATCH /projects/{id}`: edición de TP, incluyendo `dueDate`, `type` (`GROUP`/`INDIVIDUAL`) y `allowLate`.
- `GET /teams/{id}`: miembros con GitHub login, `canLeave`, `canConfirm`, `canReassign` y otros equipos del TP.
- `POST /projects/{id}/teams`: acepta `memberUserIds` o `memberGithubLogins`; los integrantes deben participar activamente.
- `PUT/DELETE /teams/{id}/members/me`: pertenencia propia antes de confirmarse y dentro del plazo.
- `PATCH /teams/{id}/members/{userId}` con `{teamId}`: reasignación docente.
- `POST /teams/{id}/repository`: aprovisionamiento/reintento y sincronización del roster.
- `GET /deliveries/{id}`: detalle, actividad, métricas, rúbrica, evaluación y `allowedActions`.
- `PATCH /deliveries/{id}` con `{status}`: acciones autorizadas según actor y estado.
- `GET/PUT /projects/{id}/rubric`, `PUT /deliveries/{id}/evaluation`: rúbricas y evaluación formal.
- `GET /api/dashboard`, `GET /api/notifications`, `PATCH /api/notifications/{id}/read`.

Las notificaciones se entregan dentro de la aplicación. Fechas de entrega y
formación se muestran en UTC; son campos diferentes. Los webhooks de GitHub
actualizan actividad/estados y sólo son consultables para repos autorizados.

## Decisiones de la migración MUI (2026-11-25)

- La normalización de `/me.userId` y del `AuthUser.id` documentado está en
  `src/shared/api/contracts.ts`. No se aceptan IDs vacíos, fraccionarios, negativos
  ni fuera del rango seguro de JavaScript. `githubLogin` es obligatorio.
- El dashboard devuelve roles/estados persistidos (`DOCENTE`, `ALUMNO`,
  `EN_REVISION`, etc.); se normalizan antes de llegar a la presentación.
- `PATCH /projects/{id}` no renombra ni elimina fechas con `null` (significa
  conservar valor): el formulario comparte campos con creación, conserva el
  título y explica que una fecha existente sólo se puede reemplazar.
- Las fechas de calendario se formatean en UTC sin corrimiento de día. Actividad,
  evaluaciones y notificaciones se muestran en zona `America/Argentina/Buenos_Aires`.
- `COMPLETO` confirma que el servidor procesó repositorio e invitaciones; no
  demuestra que cada invitación haya sido aceptada por el usuario de GitHub.
- Notificaciones y comisiones exponen búsqueda y paginación en servidor, con
  totales reales y orden estable. No se agregó Data Grid.
- El backend no devuelve versiones ni ETags para escritura condicional de TP,
  rúbrica o evaluación. La interfaz detecta cambios recibidos durante la edición,
  conserva el borrador y exige revisar la versión nueva; una escritura concurrente
  que todavía no se recibió requiere control de concurrencia backend para ser
  impedida de forma atómica.
- No se modificó el backend durante esta migración. OAuth autenticado,
  aprovisionamiento real, aceptación de invitaciones y webhooks reales requieren
  verificación externa con cuenta y configuración de GitHub.


## Actualización: búsqueda paginada (2026-11-25)

- `GET /commissions?userId={id}&page=0&size=10&q=...`: busca por materia,
  comisión o año, sólo en participaciones activas del usuario autenticado.
- `GET /api/notifications?page=0&size=10&q=...&status=ALL`: busca en todo el
  historial propio. `status` admite `ALL`, `UNREAD` y `READ`.
- Ambos retornan `{content,page,size,totalElements,totalPages}`. `page` empieza
  en cero, `size` admite 1 a 100 y `q` tiene un máximo de 200 caracteres. `%`,
  `_` y `!` se buscan literalmente. Una página fuera del rango retorna contenido
  vacío con los totales vigentes; el frontend vuelve a la última página válida.
- Los filtros se aplican en SQL antes de `LIMIT/OFFSET`; el conteo utiliza las
  mismas condiciones. El orden incluye ID para desempatar y evita repeticiones
  de filas con la misma fecha/nombre. La comisión se ordena por año descendente,
  materia, nombre e ID; las notificaciones por fecha e ID descendentes.
- `/api/dashboard` ahora retorna `unreadNotificationCount` con el conteo de
  todas las notificaciones nuevas; ya no descarga un resumen limitado a 100.
- La migración V7 agrega índices por usuario/fecha y usuario/lectura/fecha.
  FE y BE deben actualizarse juntos por el cambio del formato de las listas.
