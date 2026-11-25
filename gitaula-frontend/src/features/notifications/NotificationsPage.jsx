import { Link } from 'react-router-dom';
import { Button, Chip, Paper, Stack, Tab, Tabs, Typography, LinearProgress } from '@mui/material';
import { useNotifications, useReadNotification } from './hooks.js';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { EmptyState } from '../../shared/ui/EmptyState.jsx';
import { PageHeader } from '../../shared/ui/PageHeader.jsx';
import { MutationError } from '../../shared/ui/MutationError.jsx';
import { dateTime, internalPath } from '../../shared/lib/domain';
import { SearchForm } from '../../shared/ui/SearchForm.jsx';
import { PagePagination } from '../../shared/ui/PagePagination.jsx';
import { QueryWarning } from '../../shared/ui/QueryWarning.jsx';
import { usePagedSearch, useValidPage } from '../../shared/lib/usePagedSearch.js';
export function NotificationsPage() {
  const search = usePagedSearch();
  const notices = useNotifications(search);
  useValidPage(notices.data, search.page, search.setPage);
  const statuses = ['ALL', 'UNREAD', 'READ'];
  const result = notices.data;
  return (
    <Stack spacing={3} aria-busy={notices.isFetching}>
      <PageHeader eyebrow="ACTIVIDAD" title="Notificaciones">
        Buscá tus notificaciones y filtrá por estado de lectura.
      </PageHeader>
      <SearchForm query={search.q} label="Buscar notificaciones" onSearch={search.search} />
      <Tabs
        value={statuses.indexOf(search.status)}
        onChange={(_, value) => search.setStatus(statuses[value])}
        aria-label="Filtrar notificaciones"
      >
        <Tab label="Todas" />
        <Tab label="Nuevas" />
        <Tab label="Leídas" />
      </Tabs>
      <QueryWarning query={notices} />
      {notices.isFetching && result && <LinearProgress aria-label="Actualizando notificaciones" />}
      {notices.isPending ? (
        <LoadingState />
      ) : notices.isError && !result ? (
        <ErrorState error={notices.error} retry={notices.refetch} />
      ) : result.content.length ? (
        result.content.map((notice) => <NotificationRow key={notice.id} notice={notice} />)
      ) : (
        <EmptyState title="No hay notificaciones en esta vista">
          Probá otra búsqueda o un filtro diferente.
        </EmptyState>
      )}
      {result && (
        <PagePagination
          result={result}
          page={search.page}
          size={search.size}
          onPageChange={search.setPage}
          onSizeChange={search.setSize}
          busy={notices.isFetching}
        />
      )}
    </Stack>
  );
}

function NotificationRow({ notice }) {
  const read = useReadNotification();
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ gap: 2, alignItems: { sm: 'center' } }}
        >
          <Button
            component={Link}
            to={internalPath(notice.link)}
            sx={{ flex: 1, justifyContent: 'flex-start', textAlign: 'left' }}
          >
            {notice.message}
          </Button>
          <Chip
            label={notice.isRead ? 'Leída' : 'Nueva'}
            size="small"
            variant="outlined"
            color={notice.isRead ? 'default' : 'info'}
          />
          {!notice.isRead && (
            <Button
              disabled={read.isPending || read.isUncertain}
              onClick={() => read.mutate(notice.id)}
            >
              {read.isPending ? 'Marcando…' : 'Marcar leída'}
            </Button>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {dateTime(notice.createdAt)}
        </Typography>
        <MutationError mutation={read} />
      </Stack>
    </Paper>
  );
}
