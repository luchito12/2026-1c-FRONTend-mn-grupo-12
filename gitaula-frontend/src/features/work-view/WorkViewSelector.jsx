import { MenuItem, TextField } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkView } from './WorkViewProvider';
import { useDiscardBeforeAction } from '../../shared/ui/UnsavedChanges.jsx';
export function WorkViewSelector() {
  const view = useWorkView();
  const beforeAction = useDiscardBeforeAction();
  const location = useLocation();
  const navigate = useNavigate();
  if (!view) return null;
  function change(role) {
    if (role === view.role) return;
    beforeAction(
      () => {
        view.setRole(role);
        if (location.pathname === '/comisiones') {
          const params = new URLSearchParams(location.search);
          params.delete('page');
          navigate({ pathname: '/comisiones', search: params.toString() });
        } else navigate('/');
      },
      { discardOnConfirm: true },
    );
  }
  return (
    <TextField
      select
      label="Vista"
      value={view.role}
      onChange={(event) => change(event.target.value)}
      sx={{ width: { xs: 112, sm: 145 }, flexShrink: 0, mx: 1 }}
    >
      <MenuItem value="TEACHER">Docente</MenuItem>
      <MenuItem value="STUDENT">Alumno</MenuItem>
    </TextField>
  );
}
