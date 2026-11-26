import { WorkViewSelector } from '../../features/work-view/WorkViewSelector.jsx';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { useAuth } from '../../features/auth/AuthProvider';
import { useDiscardBeforeAction } from '../../shared/ui/UnsavedChanges.jsx';
import { useAppearance } from '../../theme/AppThemeProvider.jsx';
export function Header({ onOpenNavigation }) {
  const { user, logout, logoutError, status, error, refresh } = useAuth();
  const appearance = useAppearance();
  const beforeAction = useDiscardBeforeAction();
  const [anchor, setAnchor] = useState(null);
  const navigate = useNavigate();
  async function closeSession() {
    setAnchor(null);
    if (await logout()) navigate('/login', { replace: true, state: { reason: 'signed_out' } });
  }
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider', zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <IconButton
          aria-label="Abrir navegación"
          onClick={onOpenNavigation}
          sx={{ display: { md: 'none' }, mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          component={Link}
          to="/"
          variant="h2"
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            textDecoration: 'none',
            color: 'primary.main',
          }}
        >
          GitAula
        </Typography>
        <Box sx={{ flex: 1 }} />
        <WorkViewSelector />
        <Tooltip title="Notificaciones">
          <IconButton
            component={Link}
            to="/notificaciones"
            aria-label="Notificaciones"
            sx={{ '@media (max-width:359.95px)': { display: 'none' } }}
          >
            <NotificationsOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={`Cuenta de ${user?.githubLogin}`}>
          <IconButton
            onClick={(event) => setAnchor(event.currentTarget)}
            aria-label="Abrir menú de cuenta"
            aria-controls={anchor ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(anchor)}
          >
            <Avatar
              src={user?.avatarUrl ?? undefined}
              alt=""
              sx={{ width: 32, height: 32, fontSize: 14 }}
            >
              {user?.githubLogin?.slice(0, 2).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
        <Menu
          id="account-menu"
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2">@{user?.githubLogin}</Typography>
          </Box>
          <Divider />
          {appearance &&
            ['system', 'light', 'dark'].map((mode) => (
              <MenuItem
                key={mode}
                selected={appearance.preference === mode}
                onClick={() => appearance.setPreference(mode)}
              >
                {{ system: 'Tema del sistema', light: 'Tema claro', dark: 'Tema oscuro' }[mode]}
              </MenuItem>
            ))}
          <Divider />
          <MenuItem component={Link} to="/debug/github" onClick={() => setAnchor(null)}>
            Diagnóstico de GitHub
          </MenuItem>
          <MenuItem disabled={status === 'closing'} onClick={() => beforeAction(closeSession)}>
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
      {status === 'connection_error' && (
        <Alert severity="warning" action={<Button onClick={refresh}>Comprobar sesión</Button>}>
          No pudimos comprobar la sesión. Conservamos la última información y tus cambios en
          edición. {error?.message}
        </Alert>
      )}
      {logoutError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => beforeAction(closeSession)}>
              Reintentar
            </Button>
          }
        >
          {logoutError.message}
        </Alert>
      )}
    </AppBar>
  );
}
