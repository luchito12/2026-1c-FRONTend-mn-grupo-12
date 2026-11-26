import { useWorkView } from '../work-view/WorkViewProvider';
import { Link } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useCommissions } from '../commissions/hooks.js';
import { useCurrentUser } from '../auth/useCurrentUser.js';
import { CommissionCard } from '../commissions/CommissionCard.jsx';
import { EmptyState } from '../../shared/ui/EmptyState.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { PageHeader } from '../../shared/ui/PageHeader.jsx';
import { AcademicDashboard } from './AcademicDashboard.jsx';
export function DashboardPage() {
  const user = useCurrentUser();
  const view = useWorkView();
  const isTeacher = view.role === 'TEACHER';
  const commissions = useCommissions({ page: 0, size: 6, role: view.role });
  return (
    <Stack spacing={3}>
      <PageHeader eyebrow="INICIO" title={`Hola, ${user?.githubLogin}`}>
        {isTeacher
          ? 'Vista docente · Organizá tus comisiones y revisá las entregas.'
          : 'Vista alumno · Seguí tus trabajos prácticos, equipos y entregas.'}
      </PageHeader>
      {isTeacher && (
        <Button
          variant="contained"
          component={Link}
          to="/comisiones/nueva"
          sx={{ alignSelf: 'flex-start' }}
        >
          Crear comisión
        </Button>
      )}
      <AcademicDashboard />
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h2">Mis comisiones</Typography>
        <Button component={Link} to="/comisiones">
          Ver todas
        </Button>
      </Stack>
      {commissions.isPending ? (
        <LoadingState />
      ) : commissions.isError ? (
        <ErrorState error={commissions.error} retry={commissions.refetch} />
      ) : commissions.data.content.length ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 2,
          }}
        >
          {commissions.data.content.map((c) => (
            <CommissionCard commission={c} key={c.commissionId} />
          ))}
        </Box>
      ) : (
        <EmptyState
          title={`Todavía no tenés comisiones como ${isTeacher ? 'docente' : 'alumno'}`}
          action={
            isTeacher && (
              <Button component={Link} to="/comisiones/nueva">
                Crear comisión
              </Button>
            )
          }
        >
          {isTeacher
            ? 'Creá una comisión para empezar.'
            : 'Cuando un docente te incorpore, aparecerá acá. Podés cambiar de vista desde la cabecera.'}
        </EmptyState>
      )}
    </Stack>
  );
}
