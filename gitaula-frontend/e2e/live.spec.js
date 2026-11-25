import { test, expect } from '@playwright/test';
test('proxy real de Vite: /me 401, logout anónimo 204 y ruta privada recuperable', async ({
  page,
  request,
}) => {
  // No cookies or credentials, no fixture, no external GitHub operation.
  const me = await request.get('/api/auth/me');
  expect(me.status()).toBe(401);
  const privateResource = await request.get('/commissions?userId=7');
  expect(privateResource.status()).toBe(401);
  const logout = await request.post('/api/auth/logout');
  expect(logout.status()).toBe(204);
  await page.goto('/entregas/5');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Ingresar con GitHub' })).toBeVisible();
  await expect(
    page.getByText('Iniciá sesión para continuar en la página que solicitaste.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Evaluación formal' })).toHaveCount(0);
});
