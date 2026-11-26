# GitAula: estado y pendientes funcionales

**Fecha de revisión:** 25/11/2026.  
**Objetivo:** compartir con el equipo qué está implementado y qué trabajo funcional queda por resolver.

Este informe se basa en el código actual del frontend y del backend, sus contratos y los resultados de pruebas registrados. Las prioridades son una propuesta para repartir trabajo; las mejoras opcionales no se consideran requisitos aprobados.

## 1. Qué ya está implementado

| Área | Funcionalidad disponible |
| --- | --- |
| Acceso y sesión | Login con GitHub, callback, recuperación de la ruta solicitada, expiración, logout con reintento y cierre entre pestañas. |
| Comisiones | Crear, listar, buscar por materia/comisión/año y paginar desde el backend. Cada participación tiene su propio rol. |
| Participantes | Agregar usuarios registrados por su usuario de GitHub, cambiar rol, desactivar y reactivar. Protección del último docente activo. |
| Trabajos prácticos | Crear y editar descripción/configuración, fechas, modalidad individual/grupal, formación de equipos, template, organización y política de entregas tardías. |
| Equipos | Creación docente o autoorganizada, unión/salida según condiciones, confirmación y reasignación de integrantes. |
| Repositorios | Intento de creación al confirmar equipos, visualización del estado y errores, reintento y sincronización de integrantes en los flujos de equipos. |
| Entregas | Marcar lista para revisión, tomar revisión, solicitar cambios y aprobar, según el rol y las acciones autorizadas por el backend. |
| Evaluación | Configurar rúbricas, cargar puntajes y devolución, y consultar la evaluación con la rúbrica utilizada. La evaluación formal se muestra separada del estado de revisión. |
| Actividad y seguimiento | Dashboard, actividad de entregas y métricas básicas de revisión. Procesamiento de webhooks de GitHub implementado. |
| Notificaciones | Búsqueda en el historial propio, filtros Todas/Nuevas/Leídas, paginación real y marcado individual como leída. Conteo total de nuevas en Inicio. |
| Interfaz | Material UI, claro/oscuro, selector Docente/Alumno, navegación móvil, diálogos, errores recuperables y conservación de borradores durante actualizaciones de fondo. |

**La búsqueda y la paginación de notificaciones y comisiones ya están hechas en FE y BE.** No queda pendiente reemplazar el antiguo corte de 100 notificaciones.

### Selector de vista Docente / Alumno — implementado

El selector está en la cabecera, también en móvil. Cambia Inicio, comisiones,
trabajos y entregas según el rol elegido. Los filtros y totales se calculan en
el backend antes de paginar. La elección se mantiene al navegar y se inicializa
por identidad al cargar la aplicación: docente si tiene participaciones docentes,
alumno en los demás casos. Ambas vistas tienen un estado vacío cuando corresponde.

Los roles disponibles se consultan sobre todas las participaciones activas,
independientemente de la página y la búsqueda. Cambiar de vista respeta borradores
sin guardar. Los permisos de una URL directa siguen siendo los de esa comisión;
si difieren de la vista seleccionada, se muestra el contexto. Las notificaciones
siguen siendo generales de la cuenta. No se agregó un rol global.

Verificado en Chrome con usuarios de un solo rol y con ambos roles, selección por
teclado, móvil de 320/390 px, descarte de borrador y paginación. Backend probado
con MySQL real y GitHub simulado.

## 2. Trabajo funcional por resolver

### F02 — Resolver la baja de participantes y sus accesos en GitHub

**Estado:** falta definir la política y conectar el flujo.  
**Prioridad propuesta:** P1, antes de usar bajas con repositorios reales.  
**Área:** backend/integración y feedback en frontend.

Hoy desactivar la participación cambia el acceso académico en GitAula. Ese flujo no llama a la sincronización de colaboradores de GitHub y tampoco retira al usuario de los equipos. La sincronización existente se ejecuta en operaciones de equipos/repositorios.

Por eso, desactivar un participante no demuestra que haya perdido acceso al repositorio. Además, un reintento que use los mismos integrantes seguirá incluyendo a esa persona.

**Criterios de aceptación:**

- [ ] Definir qué pasa con el integrante del equipo, sus accesos y la entrega histórica al desactivarlo.
- [ ] Si la baja debe quitar accesos de GitHub, ejecutar esa sincronización y mostrar fallos pendientes de reintento.
- [ ] Definir qué debe restaurarse al reactivar la participación.
- [ ] Verificar el acceso efectivo teniendo en cuenta también permisos que el usuario pueda tener por la organización.

### F03 — Validar en backend el cambio de un TP grupal a individual

**Estado:** la protección está en el formulario; falta la comprobación equivalente al editar desde la API.  
**Prioridad propuesta:** P1.  
**Área:** backend y prueba de integración.

El frontend impide cambiar a individual si existen equipos con varios integrantes. El backend valida la cantidad al crear equipos, unirse o reasignar, pero la actualización del TP no consulta los integrantes existentes. Una llamada directa o un cambio concurrente puede dejar un TP individual con un equipo de varias personas.

**Criterio de cierre:** el backend rechaza ese cambio mientras existan equipos incompatibles, mantiene el estado anterior y devuelve un error comprensible. Cubrir tanto la llamada directa como la interacción con modificaciones de integrantes.

### F04 — Evitar que dos docentes se sobrescriban cambios

**Estado:** protección parcial.  
**Prioridad propuesta:** P1 para evaluaciones; extender a rúbricas y TP.  
**Área:** backend y frontend.

La interfaz conserva el borrador y avisa cuando recibe una versión remota distinta. Falta un control de versión en el guardado: dos docentes pueden editar a la vez y el último envío puede reemplazar al anterior si todavía no se recibió la actualización.

**Criterios de aceptación:**

- [ ] Guardar contra una versión concreta del recurso.
- [ ] Rechazar una edición desactualizada sin sobrescribir lo ya guardado.
- [ ] Conservar el borrador y ofrecer revisar la versión vigente.
- [ ] Probar el caso con dos sesiones docentes sobre la misma evaluación.

### F05 — Completar las posibilidades de edición del TP

**Estado:** limitación del contrato actual.  
**Prioridad propuesta:** P2, según lo que necesite la cursada.  
**Área:** backend y frontend.

Actualmente el título no se puede renombrar desde la edición. Tampoco existe un mecanismo general para indicar que una fecha debe eliminarse: enviar `null` conserva el valor en los campos que siguen esa regla. El cambio a formación manual tiene su propio tratamiento del plazo de equipos.

**Criterios de aceptación:**

- [ ] Permitir corregir el título si el equipo acuerda habilitarlo.
- [ ] Definir qué fechas pueden quedar sin valor y cómo solicitar su eliminación.
- [ ] Definir el efecto de cambiar fechas, template u organización cuando ya hay equipos, repositorios o entregas.
- [ ] Conservar los repositorios existentes salvo una acción explícita con comportamiento definido.

### F06 — Resolver el aprovisionamiento manual de diagnóstico

**Estado:** formulario disponible; se recomendó retirarlo del uso habitual.  
**Prioridad propuesta:** P2.  
**Área:** frontend; revisión del endpoint técnico si se elimina esa capacidad.

La herramienta permite crear un repositorio ingresando parámetros a mano. El circuito normal ya intenta crearlo al confirmar el equipo y permite reintentar desde la pantalla correspondiente.

**Criterio de cierre:** acordar si se elimina el formulario o se conserva como herramienta de soporte. La opción recomendada es dejar consultas técnicas y mantener las acciones normales de creación/reintento en el equipo.

## 3. Funciones que hoy no existen y requieren acordar alcance

Estas posibilidades no deben confundirse con fallos del circuito implementado. Antes de desarrollarlas, confirmar si son necesarias para la entrega del proyecto.

| Posibilidad | Estado actual / decisión pendiente |
| --- | --- |
| Invitaciones a personas que nunca ingresaron | El alta de participantes requiere un usuario ya registrado. No hay una invitación pendiente ni solicitud de ingreso a una comisión. |
| Editar o archivar comisiones y cerrar una cursada | El circuito actual permite crear y gestionar participantes; no expone acciones de edición/archivo de comisión. Definir qué pasa con los accesos y el historial al cerrar. |
| Reabrir una entrega aprobada | La aprobación es un estado terminal. Definir si un docente necesita revertirla y bajo qué condiciones. |
| Historial de cambios de evaluación | Se conserva la rúbrica de la evaluación guardada, pero actualizar la evaluación reemplaza sus valores anteriores. Un historial de revisiones/calificaciones sería trabajo adicional. |
| Reportes o exportación de notas | Hay evaluación individual y métricas básicas; no se identificó una pantalla o endpoint de exportación de calificaciones. |
| Avisos por correo u otros canales | Las notificaciones son internas. No hay envío por correo, Slack u otro canal externo. |
| Acciones masivas sobre notificaciones | Existe marcado individual como leída; no hay un flujo de marcado masivo. |

## 4. Evidencia disponible y límites

Últimos resultados **registrados** de la implementación, sin reejecutarlos para elaborar este informe:

| Verificación | Resultado |
| --- | --- |
| Pruebas de componentes y contratos del frontend | 48 aprobadas. |
| Pruebas de navegador | 29 aprobadas, incluyendo selector de vista, paginación/búsqueda y recorridos en escritorio/móvil. |
| Pruebas nuevas de paginación del backend | 6 aprobadas con Spring, MySQL real y GitHub simulado, incluyendo filtros por rol y privacidad de entregas. No representan la ejecución de toda la suite del backend. |
| Comprobación contra el backend local levantado | 1 aprobada: sesión anónima, recurso privado, logout anónimo y navegación a Login. |
| Lint, TypeScript, formato y build del frontend | Aprobados. |

Evidencia y referencias para el equipo:

- [Resultados de navegador](verification/pagination-e2e-results.txt).
- [Resultados de paginación del backend](verification/pagination-backend-results.txt).
- [Comprobación del backend local](verification/pagination-live-results.txt).
- [Capturas y explicación de verificación](verification/README.md).
- [Contrato de API vigente](CONTRATO_BACKEND_PENDIENTE.md).
- [Registro del refactor y decisiones](PLAN_REFACTOR_FRONTEND_MUI.md).

## 5. Propuesta para repartir trabajo

| Orden | Trabajo | Resultado esperado |
| --- | --- | --- |
| 1 | F02 y F03: bajas/accesos y consistencia individual | Reglas acordadas, validación backend y pruebas de integración. |
| 2 | F04: edición simultánea | Evaluaciones protegidas contra sobrescrituras. |
| 3 | F05 y F06 | Edición de TP y diagnóstico con un alcance definido. |
| 4 | Funciones de la sección 3 | Implementar únicamente las que el equipo confirme como necesarias. |

Para tomar una tarea, anotar responsable, criterio de cierre, evidencia de prueba y dependencia con FE/BE. Al terminar, actualizar este documento para que los pendientes reflejen el estado real.

## 6. Dónde revisar los pendientes en el código

| Pendiente | Referencia |
| --- | --- |
| F02: bajas y accesos | Backend: `courses/service/EnrollmentService.java`, `deliveries/service/TeamService.java`, `github/service/GitHubService.java`. |
| F03: cambio a individual | Frontend: `src/features/projects/ProjectForm.jsx`. Backend: `deliveries/service/ProjectService.java`. |
| F04: guardado concurrente | Backend: `academic/AcademicService.java` y contratos de actualización. Frontend: formularios de evaluación, rúbrica y TP. |
| F05: edición del TP | Backend: `deliveries/dto/UpdateProjectRequest.java` y `ProjectService.java`. Frontend: `ProjectForm.jsx`. |
| F06: herramienta manual | Frontend: `src/features/github/GithubDebugPage.jsx`. Backend: `github/controller/GitHubRepoController.java`. |

Las rutas de backend de esta tabla son relativas a `src/main/java/com/gitaula/` del repositorio backend.
