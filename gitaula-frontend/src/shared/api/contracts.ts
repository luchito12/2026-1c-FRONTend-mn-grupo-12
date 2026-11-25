import { z } from 'zod';

export const idSchema = z.union([
  z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER)),
]);
export const roleSchema = z
  .enum(['TEACHER', 'STUDENT', 'DOCENTE', 'ALUMNO'])
  .transform((role) => (role === 'DOCENTE' ? 'TEACHER' : role === 'ALUMNO' ? 'STUDENT' : role));
export type Role = z.output<typeof roleSchema>;
export const sessionSchema = z.object({
  userId: idSchema,
  githubLogin: z.string().trim().min(1),
  name: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});
export type SessionUser = z.output<typeof sessionSchema>;
export function normalizeSession(value: unknown): SessionUser {
  // /me uses userId; /exchange's documented AuthUser uses id.
  const raw = parseContract(
    z.object({ userId: idSchema.optional(), id: idSchema.optional() }).passthrough(),
    value,
  );
  return parseContract(sessionSchema, { ...raw, userId: raw.userId ?? raw.id });
}
export function parseId(value: unknown): number {
  const result = idSchema.safeParse(value);
  if (!result.success)
    throw new Error('El identificador del recurso no es válido. Revisá la dirección.');
  return result.data;
}
export function parseContract<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      'La respuesta del servidor está incompleta o tiene un formato inválido. Reintentá y contactá al equipo si persiste.',
    );
  return result.data;
}
const states: Record<string, string> = {
  REPO_CREADO: 'CREATED',
  EN_PROGRESO: 'IN_PROGRESS',
  ENTREGADA: 'SUBMITTED',
  EN_REVISION: 'REVIEWING',
  CAMBIOS_SOLICITADOS: 'CHANGES_REQUESTED',
  APROBADA: 'APPROVED',
  FUERA_DE_TERMINO: 'LATE',
};
export const statusSchema = z.string().transform((value) => states[value] ?? value);
export const commissionSchema = z
  .object({
    commissionId: idSchema,
    commissionName: z.string().min(1),
    subjectName: z.string().min(1),
    term: z.enum(['FIRST_TERM', 'SECOND_TERM', 'ANNUAL']),
    year: z.number().int(),
    role: roleSchema,
  })
  .passthrough();
export const participantSchema = z
  .object({
    userId: idSchema,
    githubLogin: z.string().min(1),
    name: z.string().nullable(),
    role: roleSchema,
    status: z.enum(['ACTIVE', 'WITHDRAWN']),
  })
  .passthrough();
export const teamSchema = z
  .object({
    teamId: idSchema,
    teamName: z.string().min(1),
    teamStatus: z.enum(['FORMING', 'CONFIRMED']),
    memberUserIds: z.array(idSchema),
    deliveryId: idSchema.nullable(),
    deliveryStatus: statusSchema.nullable(),
    repoUrl: z.string().nullable(),
    repoProvisioningStatus: z.string().nullable(),
    repoError: z.string().nullable(),
  })
  .passthrough();
export const projectSchema = z
  .object({
    projectId: idSchema,
    commissionId: idSchema,
    projectName: z.string().min(1),
    currentRole: roleSchema,
    teamFormationMode: z.enum(['MANUAL_TEACHER', 'SELF_ORGANIZED_STUDENTS']),
    teams: z.array(teamSchema),
    description: z.string().nullable(),
    dueDate: z.iso.date().nullable(),
    teamFormationDeadline: z.iso.date().nullable(),
    templateOwner: z
      .string()
      .nullable()
      .transform((value) => (value === 'pending' ? null : value)),
    templateRepo: z
      .string()
      .nullable()
      .transform((value) => (value === 'pending' ? null : value)),
    targetOrg: z.string().nullable(),
    type: z.enum(['GROUP', 'INDIVIDUAL']),
    allowLate: z.boolean(),
  })
  .passthrough();
export const projectSummarySchema = z
  .object({ projectId: idSchema, projectName: z.string().min(1) })
  .passthrough();
export const rubricSchema = z.object({
  name: z.string().min(1),
  criteria: z.array(z.object({ name: z.string().min(1), maxScore: z.number().positive() })).min(1),
});
const evaluationSchema = z
  .object({
    feedback: z.string(),
    total: z.number().nonnegative(),
    createdAt: z.string(),
    rubric: rubricSchema,
    scores: z.array(z.object({ criterion: z.string(), score: z.number().nonnegative() })),
  })
  .passthrough();
export const deliverySchema = z
  .object({
    id: idSchema,
    teamId: idSchema,
    projectId: idSchema,
    commissionId: idSchema,
    projectTitle: z.string().min(1),
    status: statusSchema,
    currentRole: roleSchema,
    dueDate: z.iso.date().nullable(),
    allowLate: z.boolean(),
    lastActivityAt: z.string().nullable(),
    repositoryUrl: z.string().nullable(),
    pullRequestUrl: z.string().nullable(),
    repoError: z.string().nullable(),
    evaluation: evaluationSchema.nullable(),
    rubric: rubricSchema.nullable(),
    allowedActions: z.array(z.enum(['SUBMITTED', 'REVIEWING', 'CHANGES_REQUESTED', 'APPROVED'])),
    activity: z.array(
      z.object({
        id: idSchema,
        title: z.string(),
        type: z.string(),
        author: z.string().nullable(),
        createdAt: z.string(),
      }),
    ),
    metrics: z.object({
      reviewIterations: z.number().nonnegative(),
      changesRequested: z.number().nonnegative(),
      firstResponseSeconds: z.number().nullable(),
    }),
  })
  .passthrough();
export const notificationSchema = z.object({
  id: idSchema,
  message: z.string(),
  link: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

export function pageSchema<T>(item: z.ZodType<T>) {
  return z.object({
    content: z.array(item),
    page: z.number().int().nonnegative(),
    size: z.number().int().min(1).max(100),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });
}
