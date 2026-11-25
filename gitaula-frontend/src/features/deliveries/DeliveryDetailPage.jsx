import { QueryWarning } from '../../shared/ui/QueryWarning.jsx';
import { useParams, Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useDelivery, useSubmitDelivery, useEvaluateDelivery } from './hooks.js';
import { EvaluationForm } from './EvaluationForm.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { PageHeader } from '../../shared/ui/PageHeader.jsx';
import { StatusBadge } from '../../shared/ui/StatusBadge.jsx';
import { MutationError } from '../../shared/ui/MutationError.jsx';
import { calendarDate, dateTime, label } from '../../shared/lib/domain';
const actions = {
  SUBMITTED: 'Marcar lista para revisión',
  REVIEWING: 'Tomar revisión',
  CHANGES_REQUESTED: 'Solicitar cambios',
  APPROVED: 'Aprobar entrega',
};
const nextActions = {
  CREATED: 'Trabajá en el repositorio y marcá la entrega cuando esté lista.',
  IN_PROGRESS: 'Cuando termines, marcá la entrega lista para revisión.',
  SUBMITTED: 'La entrega está esperando una revisión docente.',
  REVIEWING: 'La entrega está siendo revisada.',
  CHANGES_REQUESTED: 'Revisá la devolución y enviá las correcciones.',
  APPROVED: 'La revisión está aprobada. La evaluación formal se muestra por separado.',
  LATE: 'Venció el plazo. Consultá la política de entregas tardías del TP.',
};
const eventTitle = (event) =>
  actions[event.type] ??
  (event.title.startsWith('Estado: ') ? `Estado: ${label(event.title.slice(8))}` : event.title);
export function DeliveryDetailPage() {
  const { deliveryId } = useParams();
  const delivery = useDelivery(deliveryId);
  const change = useSubmitDelivery(deliveryId);
  const evaluate = useEvaluateDelivery(deliveryId);
  if (delivery.isPending) return <LoadingState />;
  if (delivery.isError && (!delivery.data || [403, 404].includes(delivery.error.status)))
    return <ErrorState error={delivery.error} retry={delivery.refetch} />;
  const data = delivery.data;
  const evaluation = data.evaluation;
  return (
    <Stack spacing={3}>
      <QueryWarning query={delivery} />
      <PageHeader
        eyebrow="ENTREGA"
        title={data.projectTitle}
        actions={<StatusBadge value={data.status} />}
      >
        Entrega: {calendarDate(data.dueDate)} (UTC) · Última actividad:{' '}
        {dateTime(data.lastActivityAt)}
      </PageHeader>
      <Alert severity="info">
        {nextActions[data.status] ?? 'Consultá las acciones disponibles para esta entrega.'}
      </Alert>
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        <Button component={Link} to={`/tps/${data.projectId}`}>
          Ver TP
        </Button>
        <Button component={Link} to={`/equipos/${data.teamId}`}>
          Ver equipo
        </Button>
        {data.repositoryUrl && (
          <Button component="a" href={data.repositoryUrl} target="_blank" rel="noreferrer">
            Abrir repositorio
          </Button>
        )}
        {data.pullRequestUrl && (
          <Button component="a" href={data.pullRequestUrl} target="_blank" rel="noreferrer">
            Abrir Pull Request
          </Button>
        )}
      </Stack>
      {data.repoError && <Alert severity="warning">{data.repoError}</Alert>}
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        {data.allowedActions.map((status, index) => (
          <Button
            variant={index === 0 ? 'contained' : 'outlined'}
            key={status}
            disabled={change.isPending || change.isUncertain}
            onClick={() => change.mutate(status)}
          >
            {change.isPending && change.variables === status ? 'Procesando…' : actions[status]}
          </Button>
        ))}
      </Stack>
      <MutationError mutation={change} />
      <Divider />
      <Typography variant="h2">Evaluación formal</Typography>
      {evaluation ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h3">
              Puntaje: {evaluation.total} /{' '}
              {evaluation.rubric.criteria.reduce((total, c) => total + c.maxScore, 0)}
            </Typography>
            <Typography>{evaluation.feedback}</Typography>
            <Typography variant="body2" color="text.secondary">
              Evaluada: {dateTime(evaluation.createdAt)} · Rúbrica: {evaluation.rubric.name}
            </Typography>
            {evaluation.scores.map((score) => (
              <Typography key={score.criterion}>
                {score.criterion}: {score.score} /{' '}
                {evaluation.rubric.criteria.find((c) => c.name === score.criterion)?.maxScore ??
                  'Sin máximo registrado'}
              </Typography>
            ))}
          </Stack>
        </Paper>
      ) : (
        <Typography color="text.secondary">Todavía no hay evaluación formal.</Typography>
      )}
      {data.currentRole === 'TEACHER' &&
        data.rubric &&
        ['REVIEWING', 'CHANGES_REQUESTED', 'APPROVED'].includes(data.status) && (
          <EvaluationForm rubric={data.rubric} value={evaluation} mutation={evaluate} />
        )}
      {!data.rubric && (
        <Alert severity="info">
          El docente debe configurar la rúbrica desde el TP para poder evaluar.
        </Alert>
      )}
      <Typography variant="h2">Métricas de revisión</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography>Reviews recibidas: {data.metrics.reviewIterations ?? 'Sin datos'}</Typography>
          <Typography>
            Pedidos de cambios: {data.metrics.changesRequested ?? 'Sin datos'}
          </Typography>
          <Typography>
            Primera respuesta:{' '}
            {data.metrics.firstResponseSeconds == null
              ? 'Pendiente'
              : data.metrics.firstResponseSeconds < 0
                ? 'Sin respuesta válida registrada'
                : `${Math.round(data.metrics.firstResponseSeconds / 60)} minutos`}
          </Typography>
        </Stack>
      </Paper>
      <Typography variant="h2">Actividad</Typography>
      <Paper variant="outlined">
        <List>
          {data.activity.length ? (
            data.activity.map((event) => (
              <ListItem key={event.id} divider>
                <ListItemText
                  primary={eventTitle(event)}
                  secondary={`${event.author ?? 'Sin autor registrado'} · ${dateTime(event.createdAt)}`}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="Todavía no hay actividad registrada." />
            </ListItem>
          )}
        </List>
      </Paper>
    </Stack>
  );
}
