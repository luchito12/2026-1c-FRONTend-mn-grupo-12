import { QueryWarning } from '../../shared/ui/QueryWarning.jsx';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useProject, useUpdateProject } from './hooks.js';
import { ProjectForm } from './ProjectForm.jsx';
import { RubricPanel } from './RubricPanel.jsx';
import { TeamsTable } from '../teams/TeamsTable.jsx';
import { CreateTeamDialog } from '../teams/CreateTeamDialog.jsx';
import { FormDialog } from '../../shared/ui/FormDialog.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { PageHeader } from '../../shared/ui/PageHeader.jsx';
import { useCurrentUser } from '../auth/useCurrentUser.js';
import { calendarDate, label } from '../../shared/lib/domain';
export function ProjectDetailPage() {
  const { projectId } = useParams();
  const user = useCurrentUser();
  const project = useProject(projectId);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState(0);
  const update = useUpdateProject(projectId, () => {
    setDirty(false);
    setEditing(false);
  });
  if (project.isPending) return <LoadingState />;
  if (project.isError && (!project.data || [403, 404].includes(project.error.status)))
    return <ErrorState error={project.error} retry={project.refetch} />;
  const data = project.data;
  const isTeacher = data.currentRole === 'TEACHER';
  const ownTeam = data.teams.find((team) => team.memberUserIds.includes(user?.userId));
  const open =
    data.teamFormationMode === 'SELF_ORGANIZED_STUDENTS' &&
    (!data.teamFormationDeadline ||
      data.teamFormationDeadline >= new Date().toISOString().slice(0, 10));
  const canCreate = isTeacher || (!ownTeam && open);
  const visibleTeams = isTeacher ? data.teams : ownTeam ? [ownTeam] : [];
  return (
    <Stack spacing={3}>
      <QueryWarning query={project} />
      <PageHeader
        eyebrow="TRABAJO PRÁCTICO"
        title={data.projectName}
        actions={
          isTeacher && (
            <Button
              variant="outlined"
              onClick={() => {
                update.reset();
                setDirty(false);
                setEditing(true);
              }}
            >
              Editar TP
            </Button>
          )
        }
      >
        {data.description ?? 'Sin descripción'}
      </PageHeader>
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        aria-label="Secciones del TP"
        variant="scrollable"
        allowScrollButtonsMobile
      >
        {['Resumen', 'Equipos', 'Rúbrica'].map((title, index) => (
          <Tab
            key={title}
            label={title}
            id={`project-tab-${index}`}
            aria-controls={`project-panel-${index}`}
          />
        ))}
      </Tabs>
      <section
        role="tabpanel"
        id="project-panel-0"
        aria-labelledby="project-tab-0"
        hidden={tab !== 0}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h2">Fechas y modalidad</Typography>
            <Typography>
              Entrega: {calendarDate(data.dueDate)} (UTC, hasta el final del día)
            </Typography>
            <Typography>
              Límite de equipos: {calendarDate(data.teamFormationDeadline)} (UTC)
            </Typography>
            <Typography>
              {label(data.type)} · {label(data.teamFormationMode)}
            </Typography>
            <Typography>
              {data.allowLate
                ? 'Se pueden marcar entregas para revisión después del vencimiento.'
                : 'No se admiten entregas después del vencimiento.'}
            </Typography>
            <Typography variant="h2">Configuración de GitHub</Typography>
            <Typography>Organización: {data.targetOrg ?? 'Sin configurar'}</Typography>
            <Typography>
              Template:{' '}
              {data.templateOwner && data.templateRepo
                ? `${data.templateOwner}/${data.templateRepo}`
                : 'Sin configurar'}
            </Typography>
            {(!data.targetOrg || !data.templateOwner || !data.templateRepo) && (
              <Alert severity="warning">
                Falta configuración para crear los repositorios. Un docente puede completarla desde
                Editar TP.
              </Alert>
            )}
          </Stack>
        </Paper>
      </section>
      <section
        role="tabpanel"
        id="project-panel-1"
        aria-labelledby="project-tab-1"
        hidden={tab !== 1}
      >
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h2">{isTeacher ? 'Equipos' : 'Tu equipo'}</Typography>
            {canCreate && (
              <Button variant="contained" onClick={() => setCreating(true)}>
                {isTeacher ? 'Crear equipo' : 'Crear mi equipo'}
              </Button>
            )}
          </Stack>
          <TeamsTable teams={visibleTeams} isTeacher={isTeacher} />
          {!isTeacher &&
            !ownTeam &&
            open &&
            (data.type !== 'INDIVIDUAL' ||
              data.teams.some(
                (team) => team.teamStatus === 'FORMING' && team.memberUserIds.length === 0,
              )) && (
              <>
                <Typography variant="h2">Equipos disponibles</Typography>
                <TeamsTable
                  teams={data.teams.filter(
                    (team) =>
                      team.teamStatus === 'FORMING' &&
                      (data.type !== 'INDIVIDUAL' || team.memberUserIds.length === 0),
                  )}
                  canJoin
                />
              </>
            )}
          {!isTeacher && !ownTeam && !open && (
            <Alert severity="info">
              La formación de equipos está cerrada o requiere asignación docente.
            </Alert>
          )}
        </Stack>
      </section>
      <section
        role="tabpanel"
        id="project-panel-2"
        aria-labelledby="project-tab-2"
        hidden={tab !== 2}
      >
        <RubricPanel projectId={projectId} isTeacher={isTeacher} />
      </section>
      <FormDialog
        open={editing && isTeacher}
        title="Editar trabajo práctico"
        dirty={dirty}
        busy={update.isPending}
        onClose={() => setEditing(false)}
      >
        {editing && isTeacher && (
          <ProjectForm value={data} mutation={update} onDirtyChange={setDirty} />
        )}
      </FormDialog>
      {creating && canCreate && (
        <CreateTeamDialog project={data} open onClose={() => setCreating(false)} />
      )}
    </Stack>
  );
}
