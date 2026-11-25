import { afterEach, describe, expect, it, vi } from 'vitest';
import { businessHttp, http } from './http.js';

afterEach(() => vi.restoreAllMocks());
describe('http', () => {
  it('always includes session cookies and JSON headers', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ githubLogin: 'octo' }), { status: 200 }));
    await expect(http('/auth/me')).resolves.toEqual({ githubLogin: 'octo' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({ credentials: 'include' }),
    );
  });
  it('normalizes a conflict response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Ya participa.' }), { status: 409 }),
    );
    await expect(
      businessHttp('/commissions/1/enrollments', {
        method: 'POST',
        body: { userId: 2, role: 'STUDENT' },
      }),
    ).rejects.toMatchObject({ status: 409, message: 'Ya participa.' });
  });
  it('uses the backend root for business routes', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('[]', { status: 200 }));
    await businessHttp('/commissions?userId=2');
    expect(fetchMock).toHaveBeenCalledWith(
      '/commissions?userId=2',
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});

it('respeta cancelación y no la informa como un fallo de red', async () => {
  const controller = new AbortController();
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    (_url, { signal }) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener('abort', () => reject(signal.reason)),
      ),
  );
  const request = http('/dashboard', { signal: controller.signal });
  controller.abort();
  await expect(request).rejects.toMatchObject({ name: 'AbortError' });
});
it('un 403 conserva la sesión sin emitir expiración', async () => {
  const listener = vi.fn();
  window.addEventListener('gitaula:unauthorized', listener);
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ message: 'Acceso denegado' }), { status: 403 }),
  );
  await expect(http('/dashboard')).rejects.toMatchObject({ status: 403 });
  expect(listener).not.toHaveBeenCalled();
  window.removeEventListener('gitaula:unauthorized', listener);
});
it('una respuesta tardía de una generación anterior no devuelve datos', async () => {
  const { advanceSession } = await import('./sessionBoundary');
  let finish;
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const request = http('/dashboard');
  advanceSession();
  finish(new Response(JSON.stringify({ secret: true }), { status: 200 }));
  await expect(request).rejects.toMatchObject({ name: 'AbortError' });
});
it('timeout de lectura produce un error recuperable', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    (_url, { signal }) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener('abort', () => reject(signal.reason)),
      ),
  );
  await expect(http('/dashboard', { timeoutMs: 5 })).rejects.toMatchObject({ status: 0 });
});
