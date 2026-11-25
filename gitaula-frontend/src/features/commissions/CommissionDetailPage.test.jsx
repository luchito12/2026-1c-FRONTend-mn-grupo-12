import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CommissionDetailPage } from './CommissionDetailPage.jsx';

vi.mock('../auth/useCurrentUser.js', () => ({ useCurrentUser: () => ({ userId: 1 }) }));

function renderDetail(role) {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(['commission', '1'], {
    commissionId: 1,
    commissionName: 'Comisión 1',
    subjectName: 'DSI',
    role,
    year: 2026,
    term: 'FIRST_TERM',
  });
  client.setQueryData(['projects', '1'], []);
  client.setQueryData(['participants', '1'], []);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/comisiones/1']}>
        <Routes>
          <Route path="/comisiones/:commissionId" element={<CommissionDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
describe('CommissionDetailPage', () => {
  it('does not show teaching actions to a student', () => {
    renderDetail('STUDENT');
    expect(screen.queryByRole('link', { name: /crear tp/i })).not.toBeInTheDocument();
  });
  it('shows teaching actions to a teacher', () => {
    renderDetail('TEACHER');
    expect(screen.getByRole('link', { name: /crear tp/i })).toBeInTheDocument();
  });
});
