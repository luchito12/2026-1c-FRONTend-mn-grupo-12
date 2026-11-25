import { test, expect } from '@playwright/test';
import { installApi, forming } from './fixtures.js';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource|net::ERR/.test(message.text()))
      throw new Error(message.text());
  });
});

test('docente: alta de participante, error conservado, último docente y reactivación', async ({
  context,
  page,
}) => {
  const state = await installApi(context);
  await page.goto('/comisiones/1');
  await page.getByRole('tab', { name: 'Participantes' }).click();
  const opener = page.getByRole('button', { name: 'Agregar participante', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Agregar participante' });
  await dialog.getByLabel('Usuario de GitHub').fill('nuevo-test');
  state.failEnrollment = true;
  await dialog.getByRole('button', { name: 'Agregar participante' }).click();
  await expect(dialog.getByText('El usuario todavía no está registrado en GitAula.')).toBeVisible();
  await expect(dialog.getByLabel('Usuario de GitHub')).toHaveValue('nuevo-test');
  state.failEnrollment = false;
  await dialog.getByRole('button', { name: 'Agregar participante' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('@nuevo-test', { exact: true })).toBeVisible();
  const teacher = page.getByRole('row').filter({ hasText: '@docente-test' });
  await teacher.getByRole('button', { name: 'Cambiar a alumno' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('último docente');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  const student = page.getByRole('row').filter({ hasText: '@alumno-test' });
  await student.getByRole('button', { name: 'Desactivar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(student.getByText('Retirado')).toBeVisible();
  await student.getByRole('button', { name: 'Reactivar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(student.getByText('Activo', { exact: true })).toBeVisible();
});

test('docente: crear y editar TP, elegir integrante, confirmar equipo y reintentar repo', async ({
  context,
  page,
}) => {
  const state = await installApi(context);
  await page.goto('/comisiones/1/tps/nuevo');
  await page.getByLabel('Título', { exact: true }).fill('TP nuevo');
  await page.getByLabel('Descripción').fill('Descripción del TP nuevo');
  await page.getByLabel('Fecha de entrega (UTC)', { exact: true }).fill('2026-12-20');
  await page.getByLabel('Fecha límite de equipos (UTC)', { exact: true }).fill('2026-12-21');
  await page.getByLabel('Owner del template').fill('test-org');
  await page.getByLabel('Repositorio template').fill('template');
  await page.getByLabel('Organización destino').fill('test-org');
  await page.getByRole('button', { name: 'Guardar TP' }).click();
  await expect(page.getByText('Debe ser anterior o igual a la fecha de entrega.')).toBeVisible();
  await page.getByLabel('Fecha límite de equipos (UTC)', { exact: true }).fill('2026-12-10');
  await page.getByRole('button', { name: 'Guardar TP' }).click();
  await expect(page).toHaveURL(/\/tps\/3$/);
  expect(
    state.calls.filter((c) => c.path === '/commissions/1/projects' && c.method === 'POST'),
  ).toHaveLength(1);
  await page.getByRole('button', { name: 'Editar TP' }).click();
  await page.getByRole('dialog').getByLabel('Descripción').fill('Descripción editada');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar TP' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Descripción editada', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Equipos', exact: true }).click();
  await page.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre del equipo').fill('Equipo nuevo');
  await dialog.getByRole('combobox', { name: 'Integrantes' }).fill('otro');
  await page.getByRole('option', { name: /otra estudiante/i }).click();
  state.delayMutation = 350;
  await dialog.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Creando…' })).toBeDisabled();
  await expect(dialog).toBeHidden();
  expect(state.calls.find((c) => c.path === '/projects/3/teams').body).toEqual({
    teamName: 'Equipo nuevo',
    memberUserIds: [9],
  });
  await page
    .getByRole('row')
    .filter({ hasText: 'Equipo de prueba' })
    .getByRole('button', { name: 'Confirmar equipo' })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Falta configurar acceso de GitHub')).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar repositorio' }).click();
  await expect(page.getByRole('link', { name: 'Abrir repositorio' })).toBeVisible();
});

test('evaluación: error y refetch conservan borrador; resolver cambio remoto antes de guardar', async ({
  context,
  page,
}) => {
  const state = await installApi(context, { failEvaluation: true });
  await page.clock.install();
  await page.goto('/entregas/5');
  await page.getByLabel('Diseño (máximo 10)').fill('8');
  await page.getByLabel('Devolución general').fill('Buen diseño');
  await page.getByRole('button', { name: 'Guardar evaluación' }).click();
  await expect(page.getByText('No se pudo guardar la evaluación.')).toBeVisible();
  await expect(page.getByLabel('Devolución general')).toHaveValue('Buen diseño');
  state.delivery.rubric = { name: 'Nueva rúbrica', criteria: [{ name: 'Diseño', maxScore: 20 }] };
  state.rubric = state.delivery.rubric;
  await page.clock.fastForward(31_000);
  await expect(page.getByText(/La evaluación o la rúbrica cambiaron/)).toBeVisible();
  await expect(page.getByLabel('Devolución general')).toHaveValue('Buen diseño');
  await expect(page.getByRole('button', { name: 'Guardar evaluación' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cargar versión actual' }).click();
  await page.getByLabel('Diseño (máximo 20)').fill('16');
  await page.getByLabel('Devolución general').fill('Revisión actual');
  state.failEvaluation = false;
  await page.getByRole('button', { name: 'Guardar evaluación' }).click();
  await expect(page.getByText('Puntaje: 16 / 20')).toBeVisible();
});

test('alumno: acciones propias, entrega y acceso denegado sin cerrar sesión', async ({
  context,
  page,
}) => {
  const state = await installApi(context, { role: 'STUDENT' });
  await page.goto('/tps/3');
  await expect(page.getByRole('button', { name: 'Editar TP' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Equipos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirmar equipo' })).toHaveCount(0);
  await page.goto('/entregas/5');
  await expect(page.getByRole('button', { name: 'Guardar evaluación' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Marcar lista para revisión' }).click();
  await expect(page.getByText('La entrega está esperando una revisión docente.')).toBeVisible();
  state.forbiddenProject = true;
  await page.goto('/tps/3');
  await expect(page.getByText('Acceso denegado')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir menú de cuenta' })).toBeVisible();
  expect(state.authenticated).toBe(true);
});

test('OAuth: recupera entrega directa, un solo canje en StrictMode y URL limpia', async ({
  context,
  page,
}) => {
  const state = await installApi(context, { authenticated: false });
  await page.goto('/entregas/5?origen=aviso');
  await expect(page.getByRole('button', { name: 'Ingresar con GitHub' })).toBeVisible();
  await page.getByRole('button', { name: 'Ingresar con GitHub' }).click();
  await expect(page).toHaveURL(/\/entregas\/5\?origen=aviso$/);
  await expect(page.getByRole('heading', { name: 'TP Arquitectura' })).toBeVisible();
  expect(state.exchangeCount).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem('gitaula-return-path'))).toBeNull();
});

test('logout: fallo preserva identidad; reintento y sincronización entre pestañas', async ({
  context,
  page,
}) => {
  const state = await installApi(context, { logoutFail: true });
  await page.goto('/comisiones');
  const other = await context.newPage();
  await other.goto('/tps/3');
  await expect(other.getByRole('heading', { name: 'TP Arquitectura' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menú de cuenta' }).click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await expect(page.getByText('No pudimos cerrar la sesión. Reintentar')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mis comisiones' })).toBeVisible();
  expect(state.authenticated).toBe(true);
  state.logoutFail = false;
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(other).toHaveURL(/\/login$/);
  await other.close();
});

test('conexión: error de /me permite reintento sin afirmar expiración', async ({
  context,
  page,
}) => {
  const state = await installApi(context, { meFail: true });
  await page.goto('/comisiones');
  await expect(page.getByText('No pudimos comprobar tu sesión')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ingresar con GitHub' })).toHaveCount(0);
  state.meFail = false;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('heading', { name: 'Mis comisiones' })).toBeVisible();
});

test('formularios: aviso al navegar y al cerrar diálogo; foco de retorno', async ({
  context,
  page,
}) => {
  await installApi(context);
  await page.goto('/tps/3');
  const opener = page.getByRole('button', { name: 'Editar TP' });
  await opener.click();
  await page.getByRole('dialog').getByLabel('Descripción').fill('Borrador sin guardar');
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page
    .getByRole('dialog', { name: '¿Descartar los cambios?' })
    .getByRole('button', { name: 'Cancelar' })
    .click();
  await expect(page.getByRole('dialog', { name: '¿Descartar los cambios?' })).toBeHidden();
  await expect(page.getByLabel('Descripción')).toHaveValue('Borrador sin guardar');
  await page.keyboard.press('Escape');
  await page
    .getByRole('dialog', { name: '¿Descartar los cambios?' })
    .getByRole('button', { name: 'Descartar cambios' })
    .click();
  await expect(opener).toBeFocused();
  await page.goto('/comisiones/nueva');
  await page.getByLabel('Nombre de la materia').fill('Borrador');
  await page.getByRole('link', { name: 'Mis comisiones', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Tenés cambios sin guardar' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByLabel('Nombre de la materia')).toHaveValue('Borrador');
  await page.getByRole('link', { name: 'Mis comisiones', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar y continuar' }).click();
  await expect(page).toHaveURL(/\/comisiones$/);
});

test('notificaciones y reasignación tienen efecto visible', async ({ context, page }) => {
  const state = await installApi(context);
  state.project.teams.push({
    ...forming,
    teamId: 4,
    teamName: 'Equipo destino',
    memberUserIds: [9],
  });
  await page.goto('/notificaciones');
  await page.getByRole('button', { name: 'Marcar leída' }).click();
  await expect(page.getByText('Leída', { exact: true })).toBeVisible();
  await page.goto('/equipos/2');
  await page.getByRole('combobox', { name: 'Mover a alumno-test' }).click();
  await page.getByRole('option', { name: 'Equipo destino', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('@alumno-test', { exact: true })).toHaveCount(0);
  expect(state.project.teams[1].memberUserIds).toEqual([9, 8]);
});

test('alumno: crear equipo propio, salir y unirse a uno abierto', async ({ context, page }) => {
  const state = await installApi(context, { role: 'STUDENT' });
  state.project.teams[0].memberUserIds = [9];
  await page.goto('/tps/3');
  await page.getByRole('tab', { name: 'Equipos', exact: true }).click();
  await page.getByRole('button', { name: 'Crear mi equipo' }).click();
  await page.getByLabel('Nombre del equipo').fill('Mi equipo');
  await page.getByRole('dialog').getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('link', { name: 'Ver equipo e integrantes' }).click();
  await page.getByRole('button', { name: 'Salir del equipo' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page).toHaveURL(/\/tps\/3$/);
  await page.getByRole('tab', { name: 'Equipos', exact: true }).click();
  await page
    .getByRole('row')
    .filter({ hasText: 'Equipo de prueba' })
    .getByRole('button', { name: 'Unirme' })
    .click();
  await expect(page.getByRole('link', { name: 'Ver equipo e integrantes' })).toBeVisible();
});

test('sesión vencida por polling: login sin carga infinita y sin datos privados tardíos', async ({
  context,
  page,
}) => {
  const state = await installApi(context);
  await page.clock.install();
  await page.goto('/entregas/5');
  await expect(page.getByRole('heading', { name: 'TP Arquitectura' })).toBeVisible();
  state.authenticated = false;
  await page.clock.fastForward(31_000);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Ingresar con GitHub' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar evaluación' })).toHaveCount(0);
});

test('rúbrica: validar duplicados y publicar criterios para evaluación', async ({
  context,
  page,
}) => {
  const state = await installApi(context);
  await page.goto('/tps/3');
  await page.getByRole('tab', { name: 'Rúbrica', exact: true }).click();
  await page.getByRole('button', { name: 'Configurar rúbrica' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Agregar criterio' }).click();
  await dialog.getByLabel('Criterio 2').fill('Diseño');
  await dialog.getByLabel('Puntaje máximo 2').fill('5');
  await dialog.getByRole('button', { name: 'Guardar rúbrica' }).click();
  await expect(
    dialog.getByText('Usá nombres únicos y puntajes máximos mayores que cero.'),
  ).toBeVisible();
  await dialog.getByLabel('Criterio 2').fill('Pruebas');
  await dialog.getByRole('button', { name: 'Guardar rúbrica' }).click();
  await expect(dialog).toBeHidden();
  expect(state.rubric.criteria).toEqual([
    { name: 'Diseño', maxScore: 10 },
    { name: 'Pruebas', maxScore: 5 },
  ]);
  await expect(page.getByText('Pruebas · Máximo: 5')).toBeVisible();
});

test('comisión: alta con período anual e identidad de sesión', async ({ context, page }) => {
  const state = await installApi(context);
  await page.goto('/comisiones/nueva');
  await page.getByLabel('Nombre de la materia').fill('Algoritmos');
  await page.getByLabel('Código de materia').fill('ALG');
  await page.getByLabel('Comisión', { exact: true }).fill('Comisión nueva');
  await page.getByLabel('Año', { exact: true }).fill('2027');
  await page.getByRole('combobox', { name: 'Período' }).click();
  await page.getByRole('option', { name: 'Anual', exact: true }).click();
  await page.getByRole('button', { name: 'Crear comisión', exact: true }).click();
  await expect(page).toHaveURL(/\/comisiones$/);
  await expect(page.getByText('Algoritmos', { exact: true })).toBeVisible();
  expect(
    state.calls.find((c) => c.path === '/commissions' && c.method === 'POST').body,
  ).toMatchObject({ creatorUserId: 7, subjectName: 'Algoritmos', year: 2027, term: 'ANNUAL' });
});

test('docente: tomar revisión y aprobar sin confundir con evaluación formal', async ({
  context,
  page,
}) => {
  const state = await installApi(context);
  state.delivery.status = 'SUBMITTED';
  state.delivery.allowedActions = ['REVIEWING'];
  await page.goto('/entregas/5');
  await page.getByRole('button', { name: 'Tomar revisión', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aprobar entrega' })).toBeVisible();
  await page.getByRole('button', { name: 'Aprobar entrega' }).click();
  await expect(
    page.getByText('La revisión está aprobada. La evaluación formal se muestra por separado.'),
  ).toBeVisible();
  await expect(page.getByText('Todavía no hay evaluación formal.')).toBeVisible();
});

test('error de /me de fondo conserva evaluación en edición y permite reintento', async ({
  context,
  page,
}) => {
  const state = await installApi(context);
  await page.clock.install();
  await page.goto('/entregas/5');
  await page.getByLabel('Devolución general').fill('Mi borrador');
  state.meFail = true;
  await page.clock.fastForward(61_000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    window.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    window.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText(/No pudimos comprobar la sesión. Conservamos/)).toBeVisible();
  await expect(page.getByLabel('Devolución general')).toHaveValue('Mi borrador');
  state.meFail = false;
  await page.getByRole('button', { name: 'Comprobar sesión' }).click();
  await expect(page.getByText(/No pudimos comprobar la sesión. Conservamos/)).toHaveCount(0);
  await expect(page.getByLabel('Devolución general')).toHaveValue('Mi borrador');
});

test('creación incierta: reconciliar estado antes de permitir otro intento', async ({
  context,
  page,
}) => {
  const state = await installApi(context, { createTeamUncertain: true });
  await page.goto('/tps/3');
  await page.getByRole('tab', { name: 'Equipos', exact: true }).click();
  await page.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Crear equipo' });
  await dialog.getByLabel('Nombre del equipo').fill('Equipo procesado');
  await dialog.getByRole('combobox', { name: 'Integrantes' }).fill('otro');
  await page.getByRole('option', { name: /otra estudiante/i }).click();
  await dialog.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Comprobar estado' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Crear equipo', exact: true })).toBeDisabled();
  await expect(dialog.getByLabel('Nombre del equipo')).toHaveValue('Equipo procesado');
  state.failProjectGet = false;
  await dialog.getByRole('button', { name: 'Comprobar estado' }).click();
  await expect(dialog.getByRole('button', { name: 'Comprobar estado' })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar cambios', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Equipo procesado' })).toBeVisible();
  expect(
    state.calls.filter((c) => c.path === '/projects/3/teams' && c.method === 'POST'),
  ).toHaveLength(1);
});

test('selector de integrantes conserva docentes activos admitidos por el contrato', async ({
  context,
  page,
}) => {
  const state = await installApi(context);
  await page.goto('/tps/3');
  await page.getByRole('tab', { name: 'Equipos', exact: true }).click();
  await page.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Crear equipo' });
  await dialog.getByLabel('Nombre del equipo').fill('Equipo docente');
  await dialog.getByRole('combobox', { name: 'Integrantes' }).fill('docente');
  await page.getByRole('option', { name: /docente-test.*Docente/ }).click();
  await dialog.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(state.calls.find((c) => c.path === '/projects/3/teams').body.memberUserIds).toEqual([7]);
});

test('TP individual permite ocupar un equipo abierto que quedó vacío', async ({
  context,
  page,
}) => {
  const state = await installApi(context, { role: 'STUDENT' });
  state.project.type = 'INDIVIDUAL';
  state.project.teams[0].memberUserIds = [];
  await page.goto('/tps/3');
  await page.getByRole('tab', { name: 'Equipos', exact: true }).click();
  await page.getByRole('button', { name: 'Unirme', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Ver equipo e integrantes' })).toBeVisible();
  expect(state.project.teams[0].memberUserIds).toEqual([8]);
});
