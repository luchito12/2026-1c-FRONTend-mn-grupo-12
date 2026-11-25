import { Chip } from '@mui/material';
import { label } from '../lib/domain';
const colors = {
  APPROVED: 'success',
  CONFIRMED: 'success',
  LATE: 'error',
  CHANGES_REQUESTED: 'warning',
  REVIEWING: 'info',
  SUBMITTED: 'info',
};
export function StatusBadge({ value }) {
  return (
    <Chip size="small" variant="outlined" color={colors[value] || 'default'} label={label(value)} />
  );
}
