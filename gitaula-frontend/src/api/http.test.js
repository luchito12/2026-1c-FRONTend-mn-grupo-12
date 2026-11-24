import { afterEach, describe, expect, it, vi } from 'vitest';
import { http } from './http.js';

describe('http', () => {
  afterEach(() => vi.restoreAllMocks());
  it('always includes session cookies and JSON headers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ githubLogin: 'octo' }), { status: 200 }));
    await expect(http('/auth/me')).resolves.toEqual({ githubLogin: 'octo' });
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({ credentials: 'include' }));
  });
  it('normalizes a conflict response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: 'Ya participa.' }), { status: 409 }));
    await expect(http('/comisiones/1/participaciones', { method: 'POST', body: { userId: 2 } })).rejects.toMatchObject({ status: 409, message: 'Ya participa.' });
  });
});
