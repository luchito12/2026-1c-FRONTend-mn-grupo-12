import { lazy, Suspense } from 'react';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { Route, Routes } from 'react-router-dom';
import { RequireSession } from '../../features/auth/RequireSession.jsx';
import { AppShell } from '../layout/AppShell.jsx';
const LoginPage = lazy(() =>
  import('../../features/auth/LoginPage.jsx').then((module) => ({ default: module.LoginPage })),
);
const AuthCallbackPage = lazy(() =>
  import('../../features/auth/AuthCallbackPage.jsx').then((module) => ({
    default: module.AuthCallbackPage,
  })),
);
const DashboardPage = lazy(() =>
  import('../../features/dashboard/DashboardPage.jsx').then((module) => ({
    default: module.DashboardPage,
  })),
);
const CommissionsPage = lazy(() =>
  import('../../features/commissions/CommissionsPage.jsx').then((module) => ({
    default: module.CommissionsPage,
  })),
);
const CommissionCreatePage = lazy(() =>
  import('../../features/commissions/CommissionCreatePage.jsx').then((module) => ({
    default: module.CommissionCreatePage,
  })),
);
const CommissionDetailPage = lazy(() =>
  import('../../features/commissions/CommissionDetailPage.jsx').then((module) => ({
    default: module.CommissionDetailPage,
  })),
);
const ProjectCreatePage = lazy(() =>
  import('../../features/projects/ProjectCreatePage.jsx').then((module) => ({
    default: module.ProjectCreatePage,
  })),
);
const ProjectDetailPage = lazy(() =>
  import('../../features/projects/ProjectDetailPage.jsx').then((module) => ({
    default: module.ProjectDetailPage,
  })),
);
const TeamDetailPage = lazy(() =>
  import('../../features/teams/TeamDetailPage.jsx').then((module) => ({
    default: module.TeamDetailPage,
  })),
);
const DeliveryDetailPage = lazy(() =>
  import('../../features/deliveries/DeliveryDetailPage.jsx').then((module) => ({
    default: module.DeliveryDetailPage,
  })),
);
const GithubDebugPage = lazy(() =>
  import('../../features/github/GithubDebugPage.jsx').then((module) => ({
    default: module.GithubDebugPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('./NotFoundPage.jsx').then((module) => ({ default: module.NotFoundPage })),
);
const NotificationsPage = lazy(() =>
  import('../../features/notifications/NotificationsPage.jsx').then((module) => ({
    default: module.NotificationsPage,
  })),
);
const page = (Page) => (
  <Suspense fallback={<LoadingState />}>
    <Page />
  </Suspense>
);
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={page(LoginPage)} />
      <Route path="/auth/callback" element={page(AuthCallbackPage)} />
      <Route element={<RequireSession />}>
        <Route element={<AppShell />}>
          <Route index element={page(DashboardPage)} />
          <Route path="comisiones" element={page(CommissionsPage)} />
          <Route path="comisiones/nueva" element={page(CommissionCreatePage)} />
          <Route path="comisiones/:commissionId" element={page(CommissionDetailPage)} />
          <Route path="comisiones/:commissionId/tps/nuevo" element={page(ProjectCreatePage)} />
          <Route path="tps/:projectId" element={page(ProjectDetailPage)} />
          <Route path="equipos/:teamId" element={page(TeamDetailPage)} />
          <Route path="entregas/:deliveryId" element={page(DeliveryDetailPage)} />
          <Route path="notificaciones" element={page(NotificationsPage)} />
          <Route path="debug/github" element={page(GithubDebugPage)} />
        </Route>
      </Route>
      <Route path="*" element={page(NotFoundPage)} />
    </Routes>
  );
}
