// Network doubles are confined to tests. Every unrecognized API request fails.
export const user = { userId: 7, githubLogin: 'docente-test' };
export const commission = {
  commissionId: 1,
  commissionName: 'Comisión 12',
  subjectName: 'Diseño de Sistemas',
  term: 'SECOND_TERM',
  year: 2026,
  subjectId: 1,
  role: 'TEACHER',
};
export const participants = [
  { userId: 7, githubLogin: 'docente-test', name: 'Docente', role: 'TEACHER', status: 'ACTIVE' },
  { userId: 8, githubLogin: 'alumno-test', name: 'Estudiante', role: 'STUDENT', status: 'ACTIVE' },
  {
    userId: 9,
    githubLogin: 'otro-test',
    name: 'Otra estudiante',
    role: 'STUDENT',
    status: 'ACTIVE',
  },
];
export const forming = {
  teamId: 2,
  teamName: 'Equipo de prueba',
  teamStatus: 'FORMING',
  memberUserIds: [8],
  deliveryId: null,
  deliveryStatus: null,
  repoUrl: null,
  repoProvisioningStatus: null,
  repoError: null,
};
export const project = {
  projectId: 3,
  commissionId: 1,
  projectName: 'TP Arquitectura',
  description: 'Diseñar y construir una aplicación académica.',
  teamFormationMode: 'SELF_ORGANIZED_STUDENTS',
  teamFormationDeadline: '2026-12-10',
  dueDate: '2026-12-20',
  type: 'GROUP',
  allowLate: false,
  templateOwner: 'test-org',
  templateRepo: 'template',
  targetOrg: 'test-org',
  currentRole: 'TEACHER',
  teams: [forming],
};
export const rubric = { name: 'Calidad', criteria: [{ name: 'Diseño', maxScore: 10 }] };
export const delivery = {
  id: 5,
  teamId: 2,
  projectId: 3,
  commissionId: 1,
  projectTitle: project.projectName,
  currentRole: 'TEACHER',
  allowLate: false,
  status: 'REVIEWING',
  allowedActions: ['CHANGES_REQUESTED', 'APPROVED'],
  dueDate: project.dueDate,
  lastActivityAt: '2026-11-25T15:00:00Z',
  repositoryUrl: 'https://github.com/test-org/repo',
  pullRequestUrl: null,
  repoError: null,
  activity: [],
  evaluation: null,
  rubric,
  metrics: { reviewIterations: 0, changesRequested: 0, firstResponseSeconds: null },
};
export async function installApi(context, options = {}) {
  const state = {
    authenticated: options.authenticated ?? true,
    role: options.role ?? 'TEACHER',
    calls: [],
    commission: structuredClone(commission),
    project: structuredClone(project),
    delivery: structuredClone(delivery),
    participants: structuredClone(participants),
    rubric: structuredClone(rubric),
    notifications: [
      {
        id: 1,
        message: 'Se acerca la entrega del TP',
        link: '/entregas/5',
        isRead: false,
        createdAt: '2026-11-25T12:00:00',
      },
    ],
    logoutFail: false,
    failEvaluation: false,
    failEnrollment: false,
    delayMutation: 0,
    exchangeCount: 0,
    ...options,
  };
  state.commission.role = state.role;
  state.project.currentRole = state.role;
  state.delivery.currentRole = state.role;
  if (state.role === 'STUDENT') {
    state.delivery.status = 'IN_PROGRESS';
    state.delivery.allowedActions = ['SUBMITTED'];
  }
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== 'http://127.0.0.1:5173') return route.abort('blockedbyclient');
    if (!/^\/(api|commissions|projects|teams|deliveries|users)(\/|$)/.test(url.pathname))
      return route.continue();
    const path = url.pathname;
    const method = req.method();
    const body = req.postDataJSON();
    state.calls.push({ path, method, body, query: Object.fromEntries(url.searchParams) });
    const reply = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: status === 204 ? '' : JSON.stringify(data),
      });
    if (path === '/api/auth/me') {
      if (state.meFail) return route.abort('failed');
      return reply(
        state.authenticated
          ? { ...user, userId: state.role === 'STUDENT' ? 8 : 7 }
          : { message: 'Sesión vencida' },
        state.authenticated ? 200 : 401,
      );
    }
    if (path === '/api/auth/github/login')
      return route.fulfill({
        status: 302,
        headers: { location: '/auth/callback?loginCode=one-time-test' },
      });
    if (path === '/api/auth/exchange') {
      state.exchangeCount++;
      state.authenticated = true;
      return reply({ user });
    }
    if (path === '/api/auth/logout') {
      if (state.logoutFail) return route.abort('failed');
      state.authenticated = false;
      return reply(null, 204);
    }
    if (!state.authenticated) return reply({ message: 'Sesión vencida' }, 401);
    if (method !== 'GET' && state.delayMutation)
      await new Promise((r) => setTimeout(r, state.delayMutation));
    if (path === '/commissions' && method === 'GET') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const role = url.searchParams.get('role');
      const all = state.commissions ?? [state.commission];
      const items = all
        .filter(
          (c) =>
            (!role || c.role === role) &&
            `${c.subjectName} ${c.commissionName} ${c.year}`.toLowerCase().includes(q),
        )
        .sort(
          (a, b) =>
            b.year - a.year ||
            a.subjectName.localeCompare(b.subjectName) ||
            a.commissionName.localeCompare(b.commissionName) ||
            a.commissionId - b.commissionId,
        );
      return reply({ ...pageOf(items, url), availableRoles: [...new Set(all.map((c) => c.role))] });
    }
    if (path === '/commissions' && method === 'POST') {
      state.commission = { ...state.commission, ...body };
      return reply({ id: 1 }, 201);
    }
    if (path === '/commissions/1') return reply(state.commission);
    if (path === '/commissions/1/projects' && method === 'GET') return reply([state.project]);
    if (path === '/commissions/1/projects' && method === 'POST') {
      state.project = { ...state.project, ...body };
      return reply({ id: 3 }, 201);
    }
    if (path === '/commissions/1/participants' && method === 'GET')
      return reply(state.participants);
    if (path === '/commissions/1/enrollments') {
      if (state.failEnrollment)
        return reply({ message: 'El usuario todavía no está registrado en GitAula.' }, 404);
      state.participants.push({
        userId: 10,
        githubLogin: body.githubLogin,
        name: null,
        role: body.role,
        status: 'ACTIVE',
      });
      return reply({}, 201);
    }
    if (/^\/commissions\/1\/participants\/\d+$/.test(path)) {
      if (body.role === 'STUDENT' && Number(path.split('/').at(-1)) === 7)
        return reply({ message: 'No se puede cambiar el rol del último docente activo.' }, 409);
      Object.assign(
        state.participants.find((p) => p.userId === Number(path.split('/').at(-1))),
        body,
      );
      return reply({});
    }
    if (path === '/projects/3' && method === 'PATCH') {
      Object.assign(state.project, body);
      return reply(state.project);
    }
    if (path === '/projects/3' && state.failProjectGet) return route.abort('failed');
    if (path === '/projects/3')
      return state.forbiddenProject
        ? reply({ message: 'No tenés acceso a este TP.' }, 403)
        : reply(state.project);
    if (path === '/projects/3/rubric') {
      if (method === 'PUT') {
        state.rubric = body;
        state.delivery.rubric = body;
      }
      return reply(state.rubric);
    }
    if (path === '/projects/3/teams') {
      const team = {
        ...forming,
        teamId: 4,
        teamName: body.teamName,
        memberUserIds: body.memberUserIds,
      };
      state.project.teams.push(team);
      if (state.createTeamUncertain) {
        state.failProjectGet = true;
        return route.abort('failed');
      }
      return reply(team, 201);
    }
    if (/^\/teams\/\d+$/.test(path)) {
      const team = state.project.teams.find((t) => t.teamId === Number(path.split('/').at(-1)));
      return team
        ? reply({
            ...team,
            projectId: 3,
            commissionId: 1,
            currentRole: state.role,
            deadline: state.project.teamFormationDeadline,
            members: state.participants.filter((p) => team.memberUserIds.includes(p.userId)),
            canLeave: state.role === 'STUDENT' && team.teamStatus === 'FORMING',
            canConfirm: state.role === 'TEACHER' && team.teamStatus === 'FORMING',
            canReassign: state.role === 'TEACHER',
            otherTeams: state.project.teams.filter((t) => t.teamId !== team.teamId),
          })
        : reply({ message: 'Equipo no encontrado' }, 404);
    }
    if (path === '/teams/2/confirmation') {
      Object.assign(state.project.teams[0], {
        teamStatus: 'CONFIRMED',
        deliveryId: 5,
        deliveryStatus: 'IN_PROGRESS',
        repoProvisioningStatus: 'ERROR',
        repoError: 'Falta configurar acceso de GitHub',
      });
      return reply(state.project.teams[0], 201);
    }
    if (path === '/teams/2/repository') {
      Object.assign(state.project.teams[0], {
        repoProvisioningStatus: 'COMPLETO',
        repoError: null,
        repoUrl: delivery.repositoryUrl,
      });
      return reply(state.project.teams[0]);
    }
    if (/^\/teams\/\d+\/members\/me$/.test(path)) {
      const team = state.project.teams.find((t) => t.teamId === Number(path.split('/')[2]));
      if (method === 'PUT') team.memberUserIds.push(8);
      else team.memberUserIds = team.memberUserIds.filter((id) => id !== 8);
      return reply(null, method === 'DELETE' ? 204 : 200);
    }
    if (/^\/teams\/2\/members\/\d+$/.test(path)) {
      const member = Number(path.split('/').at(-1));
      state.project.teams[0].memberUserIds = state.project.teams[0].memberUserIds.filter(
        (id) => id !== member,
      );
      state.project.teams.find((t) => t.teamId === body.teamId).memberUserIds.push(member);
      return reply({});
    }
    if (path === '/deliveries/5' && method === 'PATCH') {
      state.delivery.status = body.status;
      state.delivery.allowedActions =
        body.status === 'REVIEWING' ? ['CHANGES_REQUESTED', 'APPROVED'] : [];
      return reply(state.delivery);
    }
    if (path === '/deliveries/5') return reply(state.delivery);
    if (path === '/deliveries/5/evaluation') {
      if (state.failEvaluation) return reply({ message: 'No se pudo guardar la evaluación.' }, 503);
      state.delivery.evaluation = {
        ...body,
        total: body.scores.reduce((t, s) => t + s.score, 0),
        rubric: state.rubric,
        createdAt: '2026-11-25T16:00:00Z',
      };
      return reply(state.delivery.evaluation);
    }
    if (path === '/api/dashboard') {
      const role = url.searchParams.get('role');
      return reply({
        projects: (
          state.dashboardProjects ?? [
            { ...state.project, commissionName: state.commission.commissionName, role: state.role },
          ]
        ).filter((p) => !role || p.role === role),
        deliveries: (
          state.dashboardDeliveries ?? [
            {
              ...state.delivery,
              status: 'EN_REVISION',
              teamName: forming.teamName,
              role: state.role,
            },
          ]
        ).filter((d) => !role || d.role === role),
        unreadNotificationCount: state.notifications.filter((n) => !n.isRead).length,
      });
    }
    if (path === '/api/notifications') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const status = url.searchParams.get('status') ?? 'ALL';
      const items = state.notifications
        .filter(
          (n) =>
            n.message.toLowerCase().includes(q) &&
            (status === 'ALL' || (status === 'READ' ? n.isRead : !n.isRead)),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
      return reply(pageOf(items, url));
    }
    if (/^\/api\/notifications\/\d+\/read$/.test(path)) {
      state.notifications.find((n) => n.id === Number(path.split('/')[3])).isRead = true;
      return reply(null, 204);
    }
    if (path === '/api/webhooks/github') return reply([]);
    if (/^\/api\/repos\/\d+$/.test(path))
      return reply({
        teamId: 2,
        status: 'COMPLETO',
        repoName: 'repo',
        repoUrl: delivery.repositoryUrl,
        invitations: [],
        webhookConfigured: true,
      });
    throw new Error(`Unexpected API request: ${method} ${path}`);
  });
  return state;
}

function pageOf(items, url) {
  const page = Number(url.searchParams.get('page') ?? 0);
  const size = Number(url.searchParams.get('size') ?? 10);
  return {
    content: items.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
  };
}
