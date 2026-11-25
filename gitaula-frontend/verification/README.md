# Evidencia de verificación

Las imágenes de `screenshots/` se generan con `npm run test:e2e`. Usan datos de
prueba definidos exclusivamente en `e2e/fixtures.js`; no son datos de producción.

- Escritorio: 1440 × 1000, tema claro.
- Móvil: 390 × 844, tema oscuro según preferencia del sistema.
- Pantallas: inicio, comisiones, alta y detalle de comisión, participantes, alta,
  resumen y edición de TP, equipos, alta de equipo, rúbrica, equipo, entrega,
  notificaciones, diagnóstico, login, callback fallido y 404.
- Interacción: teclado, foco inicial y retorno desde diálogos, advertencia de
  cambios sin guardar, Drawer temporal móvil y contención del scroll de tablas.
- Errores JS y advertencias React/MUI hacen fallar las pruebas de navegador.

Las capturas no prueban por sí mismas los recorridos: `e2e/flows.spec.js` envía
formularios, comprueba payloads y verifica el resultado visible después de las
mutaciones. `e2e/live.spec.js` usa el backend real sin autenticación y sin efectos
en GitHub. Los resultados exactos de la ejecución final se registran en el plan.
