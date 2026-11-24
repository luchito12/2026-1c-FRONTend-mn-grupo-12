import { useState } from 'react'; import { useMutation, useQuery } from '@tanstack/react-query'; import { Link, useParams } from 'react-router-dom';
import { projectsApi } from '../api/projects.js'; import { teamsApi } from '../api/teams.js'; import { queryClient } from '../app/queryClient.js'; import { ConfirmDialog } from '../components/ConfirmDialog.jsx'; import { EmptyState } from '../components/EmptyState.jsx'; import { ErrorState } from '../components/ErrorState.jsx'; import { LoadingState } from '../components/LoadingState.jsx'; import { PageHeader } from '../components/PageHeader.jsx'; import { StatusBadge } from '../components/StatusBadge.jsx';
const teacher = (role) => ['DOCENTE', 'TEACHER'].includes(role);
export function ProjectDetailPage() { const { projectId } = useParams(); const [confirmTeam, setConfirmTeam] = useState(null); const project = useQuery({ queryKey: ['project', projectId], queryFn: () => projectsApi.get(projectId) });
  const confirm = useMutation({ mutationFn: teamsApi.confirm, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['project', projectId] }); if (confirmTeam) queryClient.invalidateQueries({ queryKey: ['team', confirmTeam] }); setConfirmTeam(null); } });
  if (project.isLoading) return <LoadingState />; if (project.isError) return <ErrorState error={project.error} retry={project.refetch} />;
  const data = project.data; const isTeacher = teacher(data.currentRole || data.role); const teams = data.teams || []; const ownTeam = data.myTeam;
  return <><PageHeader eyebrow="TRABAJO PRÁCTICO" title={data.title || data.projectName || data.name}>{data.description || 'Sin descripción'} {data.deadline && `· Entrega: ${data.deadline}`}</PageHeader>
  {!isTeacher && !ownTeam && <EmptyState title="Todavía no tenés equipo">{data.teamFormationMode === 'AUTOORGANIZADA' ? 'Podrás crear o unirte a uno antes de la fecha límite.' : 'Esperá la asignación de tu docente.'}</EmptyState>}
  <section className="detail-section">
    <div className="section-heading"><h2>{isTeacher ? 'Equipos' : 'Tu equipo'}</h2>{isTeacher && <span className="muted">Los repositorios se crean al confirmar</span>}</div>
    {teams.length ? <div className="stack">{teams.map((team) => (
      <article className="list-row" key={team.teamId || team.id}>
        <Link to={`/equipos/${team.teamId || team.id}`}><b>{team.teamName || team.name}</b><small>{team.memberUserIds?.length || team.members?.length || 0} integrantes</small></Link>
        <div className="row-actions"><StatusBadge value={team.teamStatus || team.status} />{isTeacher && (team.teamStatus || team.status) === 'FORMING' && <button onClick={() => setConfirmTeam(team.teamId || team.id)}>Confirmar</button>}{team.deliveryId && <Link className="button subtle" to={`/entregas/${team.deliveryId}`}>Entrega</Link>}</div>
      </article>
    ))}</div> : <EmptyState title="Aún no hay equipos">Los equipos aparecerán aquí cuando se creen.</EmptyState>}
  </section>
  <ConfirmDialog open={Boolean(confirmTeam)} title="¿Confirmar este equipo?" onCancel={() => setConfirmTeam(null)} onConfirm={() => confirm.mutate(confirmTeam)} busy={confirm.isPending}>Al confirmarlo se genera la entrega y el backend inicia el aprovisionamiento del repositorio.</ConfirmDialog>{confirm.isError && <p className="form-error" role="alert">{confirm.error.message}</p>}</>;
}
