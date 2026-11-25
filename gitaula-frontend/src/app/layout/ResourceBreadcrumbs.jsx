import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import { Link, useMatch } from 'react-router-dom';
import { useProject } from '../../features/projects/hooks.js';
import { useCommission } from '../../features/commissions/hooks.js';
import { useTeam } from '../../features/teams/hooks.js';
import { useDelivery } from '../../features/deliveries/hooks.js';
export function ResourceBreadcrumbs() {
  const commissionMatch = useMatch('/comisiones/:commissionId/*');
  const projectMatch = useMatch('/tps/:projectId');
  const teamMatch = useMatch('/equipos/:teamId');
  const deliveryMatch = useMatch('/entregas/:deliveryId');
  const delivery = useDelivery(deliveryMatch?.params.deliveryId);
  const team = useTeam(teamMatch?.params.teamId ?? delivery.data?.teamId);
  const project = useProject(
    projectMatch?.params.projectId ?? team.data?.projectId ?? delivery.data?.projectId,
  );
  const commissionId =
    commissionMatch?.params.commissionId === 'nueva'
      ? undefined
      : (commissionMatch?.params.commissionId ?? project.data?.commissionId);
  const commission = useCommission(commissionId);
  const items = [{ to: '/comisiones', name: 'Comisiones' }];
  if (commission.data)
    items.push({
      to: `/comisiones/${commissionId}`,
      name: `${commission.data.subjectName} · ${commission.data.commissionName}`,
    });
  if (project.data)
    items.push({ to: `/tps/${project.data.projectId}`, name: project.data.projectName });
  if (team.data) items.push({ to: `/equipos/${team.data.teamId}`, name: team.data.teamName });
  if (deliveryMatch) items.push({ name: 'Entrega' });
  if (!commissionMatch && !projectMatch && !teamMatch && !deliveryMatch) return null;
  return (
    <Breadcrumbs aria-label="Ubicación" sx={{ mb: 2 }}>
      {items.map((item, index) =>
        index === items.length - 1 ? (
          <Typography key={item.name} variant="body2">
            {item.name}
          </Typography>
        ) : (
          <MuiLink component={Link} key={item.to} to={item.to} underline="hover" variant="body2">
            {item.name}
          </MuiLink>
        ),
      )}
    </Breadcrumbs>
  );
}
