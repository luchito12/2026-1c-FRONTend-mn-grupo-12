import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Backdrop,
  Box,
  CircularProgress,
  Container,
  Drawer,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { ResourceBreadcrumbs } from './ResourceBreadcrumbs.jsx';
import { useAuth } from '../../features/auth/AuthProvider';
export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { status } = useAuth();
  return (
    <Box>
      <Header onOpenNavigation={() => setMobileOpen(true)} />
      <Box sx={{ display: 'flex' }}>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: 232,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: 232 },
          }}
        >
          <Toolbar />
          <Sidebar />
        </Drawer>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: 260 } }}
        >
          <Toolbar />
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </Drawer>
        <Box component="main" id="main-content" sx={{ flex: 1, minWidth: 0, py: 3 }}>
          <Container maxWidth="lg">
            <ResourceBreadcrumbs />
            <Outlet />
          </Container>
        </Box>
        <Backdrop
          open={status === 'closing'}
          sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: 'white' }}
        >
          <Stack role="status" spacing={2} sx={{ alignItems: 'center' }}>
            <CircularProgress color="inherit" />
            <Typography>Cerrando sesión…</Typography>
          </Stack>
        </Backdrop>
      </Box>
    </Box>
  );
}
