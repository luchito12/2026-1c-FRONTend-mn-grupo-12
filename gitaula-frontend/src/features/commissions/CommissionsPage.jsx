import { useWorkView } from '../work-view/WorkViewProvider';
import { Link } from 'react-router-dom';
import { Box, Button, Stack, LinearProgress } from '@mui/material';
import { useCommissions } from './hooks.js';
import { CommissionCard } from './CommissionCard.jsx';
import { EmptyState } from '../../shared/ui/EmptyState.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { PageHeader } from '../../shared/ui/PageHeader.jsx';
import { SearchForm } from '../../shared/ui/SearchForm.jsx';
import { PagePagination } from '../../shared/ui/PagePagination.jsx';
import { QueryWarning } from '../../shared/ui/QueryWarning.jsx';
import { usePagedSearch, useValidPage } from '../../shared/lib/usePagedSearch.js';
export function CommissionsPage() {
  const search = usePagedSearch();
  const view = useWorkView();
  const isTeacher = view.role === 'TEACHER';
  const commissions = useCommissions({ ...search, role: view.role });
  useValidPage(commissions.data, search.page, search.setPage);
  const result = commissions.data;
  return (
    <Stack spacing={2} aria-busy={commissions.isFetching}>
      <PageHeader
        eyebrow="COMISIONES"
        title="Mis comisiones"
        actions={
          isTeacher && (
            <Button variant="contained" component={Link} to="/comisiones/nueva">
              Crear comisión
            </Button>
          )
        }
      >
        {isTeacher
          ? 'Comisiones en las que participás como docente.'
          : 'Comisiones en las que participás como alumno.'}
      </PageHeader>
      <SearchForm
        query={search.q}
        label="Buscar por materia, comisión o año"
        onSearch={search.search}
      />
      <QueryWarning query={commissions} />
      {commissions.isFetching && result && <LinearProgress aria-label="Actualizando comisiones" />}
      {commissions.isPending ? (
        <LoadingState />
      ) : commissions.isError && !result ? (
        <ErrorState error={commissions.error} retry={commissions.refetch} />
      ) : result.content.length ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 2,
          }}
        >
          {result.content.map((c) => (
            <CommissionCard commission={c} key={c.commissionId} />
          ))}
        </Box>
      ) : (
        <EmptyState
          title={
            search.q
              ? 'No hay coincidencias'
              : `Todavía no tenés comisiones como ${isTeacher ? 'docente' : 'alumno'}`
          }
          action={
            !search.q &&
            isTeacher && (
              <Button component={Link} to="/comisiones/nueva">
                Crear comisión
              </Button>
            )
          }
        >
          {search.q
            ? 'Probá con otro nombre o año.'
            : isTeacher
              ? 'Creá una comisión para organizar tu cursada.'
              : 'Pedile a un docente que te incorpore a su comisión. Podés cambiar de vista desde la cabecera.'}
        </EmptyState>
      )}
      {result && (
        <PagePagination
          result={result}
          page={search.page}
          size={search.size}
          onPageChange={search.setPage}
          onSizeChange={search.setSize}
          busy={commissions.isFetching}
        />
      )}
    </Stack>
  );
}
