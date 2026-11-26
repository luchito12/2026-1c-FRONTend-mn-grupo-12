import { test, expect } from '@playwright/test';
import { installApi, commission } from './fixtures.js';

async function mixed(context) {
  const state = await installApi(context);
  state.commissions = Array.from({ length: 11 }, (_, i) => ({
    ...commission,
    commissionId: i + 1,
    commissionName: `Docente ${String(i + 1).padStart(2, '0')}`,
    role: 'TEACHER',
  }));
  state.commissions.push({
    ...commission,
    commissionId: 40,
    subjectName: 'Materia como alumno',
    commissionName: 'Alumno 01',
    role: 'STUDENT',
  });
  state.dashboardProjects = [
    {
      projectId: 3,
      projectName: 'TP docente',
      commissionName: 'Docente 01',
      role: 'TEACHER',
      dueDate: '2026-12-20',
    },
    {
      projectId: 4,
      projectName: 'TP alumno',
      commissionName: 'Alumno 01',
      role: 'STUDENT',
      dueDate: '2026-12-20',
    },
  ];
  state.dashboardDeliveries = [
    {
      id: 5,
      projectTitle: 'Entrega docente',
      teamName: 'Equipo docente',
      role: 'TEACHER',
      status: 'REVIEWING',
      dueDate: '2026-12-20',
    },
    {
      id: 6,
      projectTitle: 'Entrega propia',
      teamName: 'Mi equipo',
      role: 'STUDENT',
      status: 'IN_PROGRESS',
      dueDate: '2026-12-20',
    },
  ];
  return state;
}
async function select(page, text) {
  await page.getByRole('combobox', { name: 'Vista', exact: true }).click();
  await page.getByRole('option', { name: text, exact: true }).click();
}

test('selector filtra Inicio, comisiones y totales en servidor; conserva elección al navegar', async ({
  context,
  page,
}) => {
  const state = await mixed(context);
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Vista', exact: true })).toContainText('Docente');
  await expect(page.getByRole('link', { name: 'TP docente', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'TP alumno', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Entrega docente', exact: true })).toBeVisible();
  await select(page, 'Alumno');
  await expect(page.getByRole('link', { name: 'TP alumno', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Entrega propia', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Crear comisión', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Mis comisiones', exact: true }).click();
  await expect(page.getByText('1–1 de 1')).toBeVisible();
  await expect(page.getByText('Materia como alumno', { exact: true })).toBeVisible();
  expect(state.calls.filter((c) => c.path === '/commissions').at(-1).query.role).toBe('STUDENT');
  await select(page, 'Docente');
  await expect(page.getByText('1–10 de 11')).toBeVisible();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('11–11 de 11')).toBeVisible();
  await select(page, 'Alumno');
  await expect(page.getByText('1–1 de 1')).toBeVisible();
  await expect(page).not.toHaveURL(/page=1/);
  expect(state.calls.filter((c) => c.path === '/api/dashboard').at(-1).query.role).toBe('STUDENT');
});

test('alumno inicia en su vista y puede elegir una vista docente vacía sin obtener permisos', async ({
  context,
  page,
}) => {
  await installApi(context, { role: 'STUDENT' });
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Vista', exact: true })).toContainText('Alumno');
  await expect(page.getByRole('link', { name: 'Crear comisión', exact: true })).toHaveCount(0);
  await select(page, 'Docente');
  await expect(
    page.getByRole('heading', { name: 'Todavía no tenés comisiones como docente' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Mis comisiones', exact: true }).click();
  await expect(page.getByText('0–0 de 0')).toBeVisible();
  await page.getByRole('link', { name: 'GitAula', exact: true }).click();
  await page.goto('/comisiones/1/tps/nuevo');
  await expect(
    page.getByText('Sólo docentes de esta comisión pueden crear trabajos prácticos.'),
  ).toBeVisible();
});

test('cambiar de vista respeta borradores y solicita un solo descarte', async ({
  context,
  page,
}) => {
  await mixed(context);
  await page.goto('/entregas/5');
  await page.getByLabel('Devolución general').fill('Borrador docente');
  await select(page, 'Alumno');
  await page
    .getByRole('dialog', { name: 'Tenés cambios sin guardar' })
    .getByRole('button', { name: 'Cancelar', exact: true })
    .click();
  await expect(page.getByLabel('Devolución general')).toHaveValue('Borrador docente');
  await expect(page.getByRole('combobox', { name: 'Vista', exact: true })).toContainText('Docente');
  await expect(page.getByRole('dialog', { name: 'Tenés cambios sin guardar' })).toBeHidden();
  await select(page, 'Alumno');
  await page.getByRole('button', { name: 'Descartar y continuar' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5173/');
  await expect(page.getByRole('combobox', { name: 'Vista', exact: true })).toContainText('Alumno');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('vista seleccionada no altera el rol de una comisión abierta por enlace directo', async ({
  context,
  page,
}) => {
  await mixed(context);
  await page.goto('/');
  await select(page, 'Alumno');
  await page.getByRole('link', { name: 'GitAula', exact: true }).click();
  // SPA navigation keeps the view while the resource API decides actual permissions.
  await page.evaluate(() => {
    history.pushState({}, '', '/comisiones/1');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByText(/En esta comisión participás como docente/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Crear TP', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Vista', exact: true })).toContainText('Alumno');
});

test('selector accesible por teclado y cabecera sin desbordes en móvil', async ({
  context,
  page,
}) => {
  await mixed(context);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Vista', exact: true }).focus();
    await page.keyboard.press('ArrowDown');
    await page.getByRole('option', { name: 'Alumno', exact: true }).click();
    await expect(page.getByRole('link', { name: 'TP alumno', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({
    path: 'verification/screenshots/mobile-vista-alumno.png',
    fullPage: true,
    animations: 'disabled',
  });
});
