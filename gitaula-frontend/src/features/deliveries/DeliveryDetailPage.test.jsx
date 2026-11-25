import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { DeliveryDetailPage } from './DeliveryDetailPage.jsx';
import { deliveriesApi } from './api.js';
vi.mock('./api.js', () => ({
  deliveriesApi: { get: vi.fn(), update: vi.fn(), evaluate: vi.fn() },
}));
const data = {
  id: 5,
  teamId: 2,
  projectId: 3,
  projectTitle: 'TP',
  status: 'IN_PROGRESS',
  currentRole: 'STUDENT',
  allowedActions: ['SUBMITTED'],
  activity: [],
  rubric: { name: 'Quality', criteria: [{ name: 'Design', maxScore: 10 }] },
  metrics: {},
};
function show(value = data) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(['delivery', '5'], value);
  deliveriesApi.get.mockResolvedValue(value);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/entregas/5']}>
        <Routes>
          <Route path="/entregas/:deliveryId" element={<DeliveryDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => vi.clearAllMocks());
it('permite entregar al alumno sin mostrar acciones de evaluación', async () => {
  deliveriesApi.update.mockResolvedValue({});
  show();
  expect(screen.queryByRole('button', { name: 'Guardar evaluación' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Marcar lista para revisión' }));
  await waitFor(() => expect(deliveriesApi.update).toHaveBeenCalledWith('5', 'SUBMITTED'));
});
it('permite evaluar con la rúbrica y envía puntajes numéricos', async () => {
  deliveriesApi.evaluate.mockResolvedValue({});
  show({ ...data, currentRole: 'TEACHER', status: 'REVIEWING', allowedActions: ['APPROVED'] });
  await userEvent.type(screen.getByLabelText(/Design \(máximo 10\)/), '8');
  await userEvent.type(screen.getByLabelText(/Devolución general/), 'Buen diseño');
  await userEvent.click(screen.getByRole('button', { name: 'Guardar evaluación' }));
  await waitFor(() =>
    expect(deliveriesApi.evaluate).toHaveBeenCalledWith('5', {
      feedback: 'Buen diseño',
      scores: [{ criterion: 'Design', score: 8 }],
    }),
  );
});
it('muestra el conflicto devuelto por el backend', async () => {
  deliveriesApi.update.mockRejectedValue(new Error('El plazo venció'));
  show();
  await userEvent.click(screen.getByRole('button', { name: 'Marcar lista para revisión' }));
  expect(await screen.findByText('El plazo venció')).toBeInTheDocument();
});
