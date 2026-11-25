import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { StatusBadge } from '../../shared/ui/StatusBadge.jsx';
import { label } from '../../shared/lib/domain';
export function CommissionCard({ commission }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
          <StatusBadge value={commission.role} />
          <Typography variant="h2">{commission.subjectName}</Typography>
          <Typography color="text.secondary">
            {commission.commissionName} · {label(commission.term)} {commission.year}
          </Typography>
          <Button component={Link} to={`/comisiones/${commission.commissionId}`}>
            Ver comisión
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
