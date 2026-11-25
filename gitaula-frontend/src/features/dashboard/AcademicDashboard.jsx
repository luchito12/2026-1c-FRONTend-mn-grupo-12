import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { academicApi } from '../../shared/api/academic.js';
import { keys } from '../../shared/api/queryKeys';
import { calendarDate } from '../../shared/lib/domain';
import { StatusBadge } from '../../shared/ui/StatusBadge.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
export function AcademicDashboard() {
  const overview = useQuery({
    queryKey: keys.dashboard,
    queryFn: ({ signal }) => academicApi.dashboard({ signal }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  if (overview.isPending) return <LoadingState />;
  if (overview.isError) return <ErrorState error={overview.error} retry={overview.refetch} />;
  const data = overview.data;
  const pending = data.deliveries.filter((d) => d.status !== 'APPROVED');
  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h2">Trabajos prácticos y vencimientos</Typography>
        <Button component={Link} to="/notificaciones">
          {data.unreadNotificationCount} avisos nuevos
        </Button>
      </Stack>
      <Paper variant="outlined">
        <List>
          {data.projects.length ? (
            data.projects.map((project) => (
              <ListItem
                key={project.projectId}
                divider
                secondaryAction={<StatusBadge value={project.role} />}
              >
                <ListItemText
                  primary={
                    <Button component={Link} to={`/tps/${project.projectId}`}>
                      {project.projectName}
                    </Button>
                  }
                  secondary={`${project.commissionName} · Entrega: ${calendarDate(project.dueDate)} (UTC)`}
                  sx={{ pr: 9 }}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="Todavía no hay TPs en tus comisiones." />
            </ListItem>
          )}
        </List>
      </Paper>
      <Typography variant="h2">Entregas que requieren seguimiento ({pending.length})</Typography>
      <Paper variant="outlined">
        <List>
          {pending.length ? (
            pending.map((delivery) => (
              <ListItem key={delivery.id} divider>
                <ListItemText
                  primary={
                    <Button component={Link} to={`/entregas/${delivery.id}`}>
                      {delivery.projectTitle}
                    </Button>
                  }
                  secondary={`${delivery.teamName} · ${calendarDate(delivery.dueDate)}`}
                />
                <StatusBadge value={delivery.status} />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No tenés entregas pendientes de seguimiento." />
            </ListItem>
          )}
        </List>
      </Paper>
    </Stack>
  );
}
