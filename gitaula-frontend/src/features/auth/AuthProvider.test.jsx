import { MemoryRouter } from 'react-router-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthProvider';
import { authApi } from './api.js';
import { useDomainMutation } from '../../shared/api/useDomainMutation';
import { advanceSession } from '../../shared/api/sessionBoundary';
vi.mock('./api.js', () => ({ authApi: { me: vi.fn(), logout: vi.fn() } }));
let client;
const user = { userId: 7, githubLogin: 'octo' };
beforeEach(() => {
  vi.clearAllMocks();
  advanceSession();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});
afterEach(() => client.clear());
function Probe() {
  const { user, status, logoutError, logout, refresh, establish } = useAuth();
  return (
    <>
      <p>{status}</p>
      <p>{user?.githubLogin ?? 'Sin sesión'}</p>
      {logoutError && <p role="alert">{logoutError.message}</p>}
      <button onClick={logout}>Salir</button>
      <button onClick={refresh}>Comprobar</button>
      <button onClick={() => establish({ userId: 8, githubLogin: 'otra-cuenta' })}>
        Cambiar cuenta
      </button>
    </>
  );
}
const show = (children = <Probe />) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
it('401 de /me termina restauración y elimina datos privados sin quitar observer', async () => {
  authApi.me.mockRejectedValue({ status: 401 });
  client.setQueryData(['delivery', '5'], { secret: true });
  show();
  expect(await screen.findByText('anonymous')).toBeInTheDocument();
  expect(client.getQueryData(['delivery', '5'])).toBeUndefined();
  expect(client.getQueryState(['session']).status).toBe('success');
});
it('expiración global durante /me no deja una carga infinita ni restaura respuesta tardía', async () => {
  let finish;
  authApi.me.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  client.setQueryData(['delivery', 'private'], { secret: true });
  show();
  await waitFor(() => expect(authApi.me).toHaveBeenCalled());
  act(() => window.dispatchEvent(new Event('gitaula:unauthorized')));
  expect(await screen.findByText('anonymous')).toBeInTheDocument();
  await act(async () => finish(user));
  expect(screen.getByText('anonymous')).toBeInTheDocument();
  expect(client.getQueryData(['delivery', 'private'])).toBeUndefined();
});
it('un fallo de red al restaurar ofrece estado recuperable sin afirmar expiración', async () => {
  authApi.me.mockRejectedValue(new Error('Sin conexión'));
  show();
  expect(await screen.findByText('connection_error')).toBeInTheDocument();
  authApi.me.mockResolvedValue(user);
  await userEvent.click(screen.getByRole('button', { name: 'Comprobar' }));
  expect(await screen.findByText('authenticated')).toBeInTheDocument();
});
it('logout fallido conserva identidad y datos; permite un reintento confirmado', async () => {
  authApi.me.mockResolvedValue(user);
  authApi.logout.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce(null);
  show();
  await screen.findByText('authenticated');
  client.setQueryData(['private'], { secret: true });
  await userEvent.click(screen.getByRole('button', { name: 'Salir' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cerrar la sesión');
  expect(screen.getByText('octo')).toBeInTheDocument();
  expect(client.getQueryData(['private'])).toEqual({ secret: true });
  await userEvent.click(screen.getByRole('button', { name: 'Salir' }));
  expect(await screen.findByText('anonymous')).toBeInTheDocument();
  expect(client.getQueryData(['private'])).toBeUndefined();
});
it('no duplica logout mientras está pendiente', async () => {
  let finish;
  authApi.me.mockResolvedValue(user);
  authApi.logout.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  show();
  await screen.findByText('authenticated');
  await userEvent.dblClick(screen.getByRole('button', { name: 'Salir' }));
  expect(authApi.logout).toHaveBeenCalledTimes(1);
  expect(screen.getByText('closing')).toBeInTheDocument();
  await act(async () => finish(null));
  expect(await screen.findByText('anonymous')).toBeInTheDocument();
});
it('una mutación tardía no invalida ni ejecuta callback sobre otra identidad', async () => {
  let finish;
  const saved = vi.fn();
  function MutationProbe() {
    const mutation = useDomainMutation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
      [['private']],
      'Guardado',
      saved,
    );
    return (
      <>
        <Probe />
        <button onClick={() => mutation.mutate()}>Guardar</button>
      </>
    );
  }
  authApi.me.mockResolvedValue(user);
  show(<MutationProbe />);
  await screen.findByText('authenticated');
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await userEvent.click(screen.getByRole('button', { name: 'Cambiar cuenta' }));
  await screen.findByText('otra-cuenta');
  client.setQueryData(['private'], { owner: 8 });
  const invalidation = vi.spyOn(client, 'invalidateQueries');
  await act(async () => finish({ success: true }));
  expect(saved).not.toHaveBeenCalled();
  expect(invalidation).not.toHaveBeenCalled();
  expect(client.getQueryData(['private'])).toEqual({ owner: 8 });
});
