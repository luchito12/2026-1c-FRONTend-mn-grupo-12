import { NavLink, useLocation } from 'react-router-dom';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
const links = [
  ['/', 'Inicio', HomeOutlinedIcon],
  ['/comisiones', 'Mis comisiones', SchoolOutlinedIcon],
  ['/notificaciones', 'Notificaciones', NotificationsOutlinedIcon],
];
export function Sidebar({ onNavigate }) {
  const location = useLocation();
  const academicResource = /^\/(tps|equipos|entregas)\//.test(location.pathname);
  return (
    <List component="nav" aria-label="Principal" sx={{ p: 1 }}>
      {links.map(([to, title, Icon]) => (
        <ListItemButton
          key={to}
          component={NavLink}
          to={to}
          selected={to === '/comisiones' && academicResource}
          end={to === '/'}
          onClick={onNavigate}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            '&.active, &.Mui-selected': { bgcolor: 'action.selected', color: 'primary.main' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
            <Icon />
          </ListItemIcon>
          <ListItemText primary={title} />
        </ListItemButton>
      ))}
    </List>
  );
}
