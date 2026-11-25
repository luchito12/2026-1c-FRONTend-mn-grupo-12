import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CommissionCreatePage } from './CommissionCreatePage.jsx';

vi.mock('../auth/useCurrentUser.js', () => ({ useCurrentUser: () => ({ userId: 1 }) }));

describe('CommissionCreatePage', () => {
  it('validates mandatory fields and never renders creatorUserId', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <CommissionCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.queryByLabelText(/creator/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /crear comisión/i }));
    expect(await screen.findByText('Ingresá el nombre de la materia.')).toBeInTheDocument();
    expect(screen.getByText('Ingresá el código.')).toBeInTheDocument();
  });
});
