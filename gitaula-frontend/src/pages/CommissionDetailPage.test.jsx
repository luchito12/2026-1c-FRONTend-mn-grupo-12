import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CommissionDetailPage } from './CommissionDetailPage.jsx';

function renderDetail(role) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(['commission', '1'], { commissionName: 'Comisión 1', subjectName: 'DSI', role, year: 2026, term: 'FIRST' });
  client.setQueryData(['projects', '1'], []); client.setQueryData(['participants', '1'], []);
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/comisiones/1']}><Routes><Route path="/comisiones/:commissionId" element={<CommissionDetailPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}
describe('CommissionDetailPage', () => {
  it('does not show teaching actions to a student', () => { renderDetail('ALUMNO'); expect(screen.queryByRole('link', { name: /crear tp/i })).not.toBeInTheDocument(); });
  it('shows teaching actions to a teacher', () => { renderDetail('DOCENTE'); expect(screen.getByRole('link', { name: /crear tp/i })).toBeInTheDocument(); });
});
