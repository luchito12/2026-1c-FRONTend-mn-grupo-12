# Desajustes de contrato detectados

El frontend consume exclusivamente el contrato objetivo bajo `/api` y no envía la identidad del actor: la cookie de sesión debe determinarla en el backend. Al revisar el backend actual, se detectaron estos puntos a corregir antes de habilitar los flujos completos:

| Área | Backend actual | Contrato que requiere el cliente |
| --- | --- | --- |
| Comisiones | `POST /commissions`, `GET /commissions?userId=…` | `/api/comisiones` contextual a la sesión; sin `userId` ni `creatorUserId` |
| Detalle y participantes | no hay `GET /comisiones/{id}` ni rutas de participaciones | rutas bajo `/api/comisiones/{id}/participaciones` |
| TPs | `/commissions/{id}/projects` sin prefijo | `/api/comisiones/{id}/tps`, `GET /api/tps/{id}` con fechas, template y política |
| Equipos | `/projects/{id}/teams`, con `userId` en URL | `/api/tps/{id}/equipos` y acciones contextuales `/miembros/me` |
| Entregas | sólo `PATCH /deliveries/{id}` | `GET /api/entregas/{id}` con estado, repositorio y actividad |

La autenticación y los endpoints de integración Git existentes sí usan `/api`. Una vez migradas las rutas de negocio, el cliente queda listo sin rutas paralelas ni datos de negocio simulados.
