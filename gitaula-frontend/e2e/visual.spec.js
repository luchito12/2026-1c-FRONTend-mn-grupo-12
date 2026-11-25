import { test, expect } from '@playwright/test';
import { installApi } from './fixtures.js';
const screens = [
  ['inicio', '/', 'Hola, docente-test'],
  ['comisiones', '/comisiones', 'Mis comisiones'],
  ['crear-comision', '/comisiones/nueva', 'Creá un espacio para tu cursada'],
  ['comision', '/comisiones/1', 'Comisión 12'],
  ['crear-tp', '/comisiones/1/tps/nuevo', 'Crear trabajo práctico'],
  ['tp', '/tps/3', 'TP Arquitectura'],
  ['equipo', '/equipos/2', 'Equipo de prueba'],
  ['entrega', '/entregas/5', 'TP Arquitectura'],
  ['notificaciones', '/notificaciones', 'Notificaciones'],
  ['diagnostico', '/debug/github', 'Diagnóstico de GitHub'],
  ['no-encontrada', '/ruta-inexistente', 'No encontramos esta página'],
];
for (const [size, width, height, colorScheme] of [
  ['desktop', 1440, 1000, 'light'],
  ['mobile', 390, 844, 'dark'],
]) {
  test(`verificación visual ${size} de pantallas y diálogos`, async ({ context, page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && !/Failed to load resource|net::ERR/.test(message.text()))
        errors.push(message.text());
    });
    const state = await installApi(context);
    for (const [name, path, heading] of screens) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page.getByRole('status').filter({ hasText: /Cargando/ })).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.screenshot({
        path: `verification/screenshots/${size}-${name}.png`,
        fullPage: true,
        animations: 'disabled',
      });
      if (name === 'comision') {
        await page.getByRole('tab', { name: 'Participantes' }).click();
        await expect(page.getByRole('table', { name: 'Participantes' })).toBeVisible();
        await page.screenshot({
          path: `verification/screenshots/${size}-participantes.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await page.getByRole('button', { name: 'Agregar participante' }).click();
        await expect(page.getByLabel('Usuario de GitHub')).toBeFocused();
        await page.keyboard.press('Escape');
      }
      if (name === 'tp') {
        await page.getByRole('tab', { name: 'Equipos', exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(
          page.getByRole('table', { name: 'Equipos del trabajo práctico' }),
        ).toBeVisible();
        await page.screenshot({
          path: `verification/screenshots/${size}-equipos.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await page.getByRole('button', { name: 'Crear equipo', exact: true }).click();
        await expect(page.getByRole('dialog', { name: 'Crear equipo' })).toBeVisible();
        await page.screenshot({
          path: `verification/screenshots/${size}-crear-equipo.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await page.keyboard.press('Escape');
        await page.getByRole('tab', { name: 'Rúbrica', exact: true }).click();
        await page.getByRole('button', { name: 'Configurar rúbrica' }).click();
        await expect(page.getByLabel('Nombre de la rúbrica')).toBeVisible();
        await page.screenshot({
          path: `verification/screenshots/${size}-rubrica.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Editar TP' }).click();
        await expect(page.getByLabel('Descripción')).toBeVisible();
        await page.screenshot({
          path: `verification/screenshots/${size}-editar-tp.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await page.keyboard.press('Escape');
      }
    }
    await page.goto('/comisiones');
    if (size === 'mobile') {
      await page.getByRole('button', { name: 'Abrir navegación' }).click();
      await page.getByRole('link', { name: 'Inicio', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Hola, docente-test' })).toBeVisible();
      await page.getByRole('button', { name: 'Abrir navegación' }).click();
      await page.screenshot({
        path: `verification/screenshots/${size}-navegacion.png`,
        fullPage: true,
        animations: 'disabled',
      });
      await page.keyboard.press('Escape');
    }
    state.authenticated = false;
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Ingresar con GitHub' })).toBeVisible();
    await page.screenshot({
      path: `verification/screenshots/${size}-login.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.goto('/auth/callback');
    await expect(page.getByText('No se pudo completar el inicio de sesión')).toBeVisible();
    await page.screenshot({
      path: `verification/screenshots/${size}-callback-error.png`,
      fullPage: true,
      animations: 'disabled',
    });
    expect(errors).toEqual([]);
  });
}
