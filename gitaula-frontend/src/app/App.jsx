import { Route, Routes } from 'react-router-dom';
import { RequireSession } from '../auth/RequireSession.jsx';
import { AppShell } from '../components/AppShell.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { AuthCallbackPage } from '../pages/AuthCallbackPage.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { CommissionsPage } from '../pages/CommissionsPage.jsx';
import { CommissionCreatePage } from '../pages/CommissionCreatePage.jsx';
import { CommissionDetailPage } from '../pages/CommissionDetailPage.jsx';
import { ProjectCreatePage } from '../pages/ProjectCreatePage.jsx';
import { ProjectDetailPage } from '../pages/ProjectDetailPage.jsx';
import { TeamDetailPage } from '../pages/TeamDetailPage.jsx';
import { DeliveryDetailPage } from '../pages/DeliveryDetailPage.jsx';
import { GithubDebugPage } from '../pages/GithubDebugPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
const protectedPage = (Page) => <RequireSession><AppShell><Page /></AppShell></RequireSession>;
export default function App() { return <Routes>
  <Route path="/login" element={<LoginPage />} /><Route path="/auth/callback" element={<AuthCallbackPage />} />
  <Route path="/" element={protectedPage(DashboardPage)} /><Route path="/comisiones" element={protectedPage(CommissionsPage)} />
  <Route path="/comisiones/nueva" element={protectedPage(CommissionCreatePage)} /><Route path="/comisiones/:commissionId" element={protectedPage(CommissionDetailPage)} />
  <Route path="/comisiones/:commissionId/tps/nuevo" element={protectedPage(ProjectCreatePage)} /><Route path="/tps/:projectId" element={protectedPage(ProjectDetailPage)} />
  <Route path="/equipos/:teamId" element={protectedPage(TeamDetailPage)} /><Route path="/entregas/:deliveryId" element={protectedPage(DeliveryDetailPage)} />
  <Route path="/debug/github" element={protectedPage(GithubDebugPage)} /><Route path="*" element={<NotFoundPage />} />
</Routes>; }
