import { afterEach, expect, it, vi } from 'vitest';
import { authApi } from './api';
import { completeOAuth, saveReturnPath, takeReturnPath } from './oauth';
vi.mock('./api', () => ({ authApi: { me: vi.fn(), exchange: vi.fn() } }));
afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});
it('reutiliza el canje pendiente y comprueba /me después de una respuesta incierta', async () => {
  vi.mocked(authApi.exchange).mockRejectedValue({ status: 0 });
  vi.mocked(authApi.me).mockResolvedValue({ userId: 7, githubLogin: 'octo' });
  const first = completeOAuth('strict-mode-code');
  expect(completeOAuth('strict-mode-code')).toBe(first);
  expect(await first).toMatchObject({ userId: 7 });
  expect(authApi.exchange).toHaveBeenCalledTimes(1);
});
it('si la sesión no se recupera, no reutiliza el código automáticamente', async () => {
  vi.mocked(authApi.exchange).mockRejectedValue({ status: 0 });
  vi.mocked(authApi.me).mockRejectedValue({ status: 401 });
  await expect(completeOAuth('uncertain-code')).rejects.toMatchObject({ status: 401 });
  expect(authApi.exchange).toHaveBeenCalledTimes(1);
});
it('limpia el retorno temporal y descarta destinos externos', () => {
  saveReturnPath('/entregas/5?aviso=1');
  expect(takeReturnPath()).toBe('/entregas/5?aviso=1');
  expect(takeReturnPath()).toBe('/');
  saveReturnPath('//externo.test');
  expect(takeReturnPath()).toBe('/');
});
