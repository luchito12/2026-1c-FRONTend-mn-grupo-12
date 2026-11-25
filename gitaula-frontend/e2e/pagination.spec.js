import { test, expect } from '@playwright/test';
import { installApi, commission } from './fixtures.js';

test('comisiones: página remota, búsqueda global, tamaño y navegación atrás', async ({
  context,
  page,
}) => {
  const state = await installApi(context);
  state.commissions = Array.from({ length: 25 }, (_, i) => ({
    ...commission,
    commissionId: i + 1,
    commissionName: `Comisión ${String(i + 1).padStart(2, '0')}`,
  }));
  await page.goto('/comisiones');
  await expect(page.getByText('1–10 de 25')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver comisión', exact: true })).toHaveCount(10);
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('11–20 de 25')).toBeVisible();
  await expect(page).toHaveURL(/page=1/);
  expect(state.calls.filter((c) => c.path === '/commissions').at(-1).query.page).toBe('1');
  await page.getByLabel('Buscar por materia, comisión o año').fill('Comisión 25');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByText('1–1 de 1')).toBeVisible();
  await expect(page.getByText(/Comisión 25 ·/)).toBeVisible();
  expect(state.calls.filter((c) => c.path === '/commissions').at(-1).query).toMatchObject({
    q: 'Comisión 25',
    page: '0',
  });
  await page.goBack();
  await expect(page.getByText('11–20 de 25')).toBeVisible();
  await expect(page.getByLabel('Buscar por materia, comisión o año')).toHaveValue('');
  await page.getByRole('combobox', { name: 'Por página' }).click();
  await page.getByRole('option', { name: '20', exact: true }).click();
  await expect(page.getByText('1–20 de 25')).toBeVisible();
});

test('notificaciones: busca anteriores a 100 y filtra sobre todos los resultados', async ({
  context,
  page,
}) => {
  const state = await installApi(context);
  state.notifications = Array.from({ length: 125 }, (_, i) => ({
    id: i + 1,
    message: `Aviso ${String(i).padStart(3, '0')}`,
    link: '/comisiones',
    isRead: i % 2 === 0,
    createdAt: '2026-11-25T12:00:00',
  }));
  await page.goto('/notificaciones');
  await expect(page.getByText('1–10 de 125')).toBeVisible();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('11–20 de 125')).toBeVisible();
  await page.getByLabel('Buscar notificaciones').fill('Aviso 000');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Aviso 000', exact: true })).toBeVisible();
  await expect(page.getByText('1–1 de 1')).toBeVisible();
  await page.getByRole('tab', { name: 'Nuevas', exact: true }).click();
  await expect(page.getByText('0–0 de 0')).toBeVisible();
  await page.getByRole('tab', { name: 'Leídas', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Aviso 000', exact: true })).toBeVisible();
  expect(state.calls.filter((c) => c.path === '/api/notifications').at(-1).query).toMatchObject({
    q: 'Aviso 000',
    status: 'READ',
    page: '0',
  });
});

test('leer la última notificación de una página vuelve a una página válida', async ({
  context,
  page,
}) => {
  const state = await installApi(context);
  state.notifications = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    message: `Aviso ${i}`,
    link: '/comisiones',
    isRead: false,
    createdAt: '2026-11-25T12:00:00',
  }));
  await page.goto('/notificaciones?status=UNREAD&page=1');
  await expect(page.getByText('11–11 de 11')).toBeVisible();
  await page.getByRole('button', { name: 'Marcar leída' }).click();
  await expect(page.getByText('1–10 de 10')).toBeVisible();
  await expect(page).not.toHaveURL(/page=1/);
  await expect(page.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
});

test('paginación y búsqueda en móvil sin desbordar la página', async ({ context, page }) => {
  await installApi(context);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/comisiones', '/notificaciones']) {
    await page.goto(path);
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeVisible();
    await expect(page.getByText('1–1 de 1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
