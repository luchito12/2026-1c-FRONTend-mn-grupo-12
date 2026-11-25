import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectDetailPage } from './ProjectDetailPage.jsx';
import { teamsApi } from '../teams/api.js';
import { projectsApi } from './api.js';

vi.mock('../auth/useCurrentUser.js', () => ({ useCurrentUser: () => ({ userId: 7 }) }));
vi.mock('../teams/api.js', () => ({ teamsApi: { provisionRepository: vi.fn() } }));
vi.mock('./api.js', () => ({ projectsApi: { get: vi.fn() } }));
vi.mock('../../shared/api/academic.js', () => ({
  academicApi: { rubric: () => Promise.resolve(null) },
}));

const team = { teamId: 9, teamName: 'Prueba', memberUserIds: [7], teamStatus: 'CONFIRMED' };
function renderProject(currentRole = 'TEACHER', currentTeam = team) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  const data = {
    projectId: 122,
    projectName: 'TP',
    currentRole,
    teamFormationMode: 'MANUAL_TEACHER',
    targetOrg: 'destination',
    teams: [currentTeam],
  };
  client.setQueryData(['project', '122'], data);
  projectsApi.get.mockResolvedValue(data);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/tps/122']}>
        <Routes>
          <Route path="/tps/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());
describe('Repositorios de equipos', () => {
  it('permite crear el repo de un equipo ya confirmado y refresca el detalle', async () => {
    teamsApi.provisionRepository.mockResolvedValue({});
    renderProject();
    await userEvent.click(screen.getByRole('tab', { name: 'Equipos' }));
    expect(screen.getByText('Repositorio todavía sin crear')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Crear repositorio' }));
    await waitFor(() => expect(teamsApi.provisionRepository).toHaveBeenCalledWith(9));
    await waitFor(() =>
      expect(projectsApi.get).toHaveBeenCalledWith(
        '122',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      ),
    );
  });
  it('muestra el error de GitHub y permite reintentar', async () => {
    teamsApi.provisionRepository.mockRejectedValue(new Error('Falta configurar el template'));
    renderProject('TEACHER', {
      ...team,
      repoProvisioningStatus: 'ERROR',
      repoError: 'GitHub rechazó el template',
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Equipos' }));
    expect(screen.getByText('GitHub rechazó el template')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar repositorio' }));
    expect(await screen.findByText('Falta configurar el template')).toBeInTheDocument();
  });
  it('muestra el enlace del repo listo sin ofrecer recrearlo ni acciones docentes al alumno', async () => {
    renderProject('STUDENT', {
      ...team,
      repoProvisioningStatus: 'COMPLETO',
      repoUrl: 'https://github.com/destination/repo',
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Equipos' }));
    expect(screen.getByRole('link', { name: 'Abrir repositorio' })).toHaveAttribute(
      'href',
      'https://github.com/destination/repo',
    );
    expect(screen.queryByRole('button', { name: /repositorio/i })).not.toBeInTheDocument();
  });
});
