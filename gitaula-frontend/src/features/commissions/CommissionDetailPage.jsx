import { QueryWarning } from '../../shared/ui/QueryWarning.jsx';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, List, ListItem, ListItemText, Paper, Stack, Tab, Tabs } from '@mui/material';
import { useCommission } from './hooks.js';
import { useProjects } from '../projects/hooks.js';
import { ParticipantsPanel } from './ParticipantsPanel.jsx';
import { EmptyState } from '../../shared/ui/EmptyState.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { PageHeader } from '../../shared/ui/PageHeader.jsx';
import { StatusBadge } from '../../shared/ui/StatusBadge.jsx';
import { label } from '../../shared/lib/domain';
export function CommissionDetailPage() {
  const { commissionId } = useParams();
  const commission = useCommission(commissionId);
  const projects = useProjects(commissionId);
  const [tab, setTab] = useState(0);
  if (commission.isPending) return <LoadingState />;
  if (commission.isError && (!commission.data || [403, 404].includes(commission.error.status)))
    return <ErrorState error={commission.error} retry={commission.refetch} />;
  const data = commission.data;
  const isTeacher = data.role === 'TEACHER';
  return (
    <Stack spacing={3}>
      <QueryWarning query={commission} />
      <PageHeader
        eyebrow={data.subjectName}
        title={data.commissionName}
        actions={
          isTeacher && (
            <Button
              variant="contained"
              component={Link}
              to={`/comisiones/${commissionId}/tps/nuevo`}
            >
              Crear TP
            </Button>
          )
        }
      >
        {label(data.term)} {data.year} · <StatusBadge value={data.role} />
      </PageHeader>
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        aria-label="Secciones de la comisión"
      >
        <Tab label="Trabajos prácticos" id="commission-tab-0" aria-controls="commission-panel-0" />
        <Tab label="Participantes" id="commission-tab-1" aria-controls="commission-panel-1" />
      </Tabs>
      <section
        role="tabpanel"
        hidden={tab !== 0}
        id="commission-panel-0"
        aria-labelledby="commission-tab-0"
      >
        {projects.isPending ? (
          <LoadingState />
        ) : projects.isError ? (
          <ErrorState error={projects.error} retry={projects.refetch} />
        ) : projects.data.length ? (
          <Paper variant="outlined">
            <List>
              {projects.data.map((project) => (
                <ListItem key={project.projectId} divider>
                  <ListItemText
                    primary={
                      <Button component={Link} to={`/tps/${project.projectId}`}>
                        {project.projectName}
                      </Button>
                    }
                    secondary={label(project.teamFormationMode)}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          <EmptyState title="Todavía no hay trabajos prácticos">
            Los TPs de la comisión aparecerán acá.
          </EmptyState>
        )}
      </section>
      <section
        role="tabpanel"
        hidden={tab !== 1}
        id="commission-panel-1"
        aria-labelledby="commission-tab-1"
      >
        <ParticipantsPanel commissionId={commissionId} isTeacher={isTeacher} />
      </section>
    </Stack>
  );
}
