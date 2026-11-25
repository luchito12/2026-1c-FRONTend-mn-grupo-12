import { useMarkChangesSaved } from '../../shared/ui/UnsavedChanges.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { Paper } from '@mui/material';
import { useCommission } from '../commissions/hooks.js';
import { useCreateProject } from './hooks.js';
import { ProjectForm } from './ProjectForm.jsx';
import { PageHeader } from '../../shared/ui/PageHeader.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
export function ProjectCreatePage() {
  const { commissionId } = useParams();
  const navigate = useNavigate();
  const markSaved = useMarkChangesSaved();
  const commission = useCommission(commissionId);
  const create = useCreateProject(commissionId, (project) => {
    markSaved();
    navigate(`/tps/${project.id}`);
  });
  if (commission.isPending) return <LoadingState />;
  if (commission.isError) return <ErrorState error={commission.error} retry={commission.refetch} />;
  if (commission.data.role !== 'TEACHER')
    return (
      <ErrorState
        error={{
          status: 403,
          message: 'Sólo docentes de esta comisión pueden crear trabajos prácticos.',
        }}
      />
    );
  return (
    <>
      <PageHeader eyebrow={commission.data.subjectName} title="Crear trabajo práctico">
        La confirmación de un equipo intentará crear su repositorio desde el template.
      </PageHeader>
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 760 }}>
        <ProjectForm mutation={create} />
      </Paper>
    </>
  );
}
