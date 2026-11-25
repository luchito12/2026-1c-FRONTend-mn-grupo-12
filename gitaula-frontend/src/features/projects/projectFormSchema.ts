import { z } from 'zod';
export const projectFormSchema = z
  .object({
    projectName: z.string().trim().min(1, 'Ingresá un título.'),
    description: z.string().trim().min(3, 'Ingresá una descripción.'),
    templateOwner: z.string().trim().min(1, 'Indicá el owner del template.'),
    templateRepo: z.string().trim().min(1, 'Indicá el repositorio template.'),
    targetOrg: z.string().trim().min(1, 'Indicá la organización destino.'),
    teamFormationMode: z.enum(['MANUAL_TEACHER', 'SELF_ORGANIZED_STUDENTS']),
    teamFormationDeadline: z.union([z.iso.date(), z.literal('')]),
    dueDate: z.iso.date('Indicá una fecha de entrega válida.'),
    type: z.enum(['GROUP', 'INDIVIDUAL']),
    allowLate: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.teamFormationMode === 'SELF_ORGANIZED_STUDENTS' && !data.teamFormationDeadline)
      ctx.addIssue({
        code: 'custom',
        path: ['teamFormationDeadline'],
        message: 'Es obligatoria en modo autoorganizado.',
      });
    if (data.teamFormationDeadline && data.dueDate && data.teamFormationDeadline > data.dueDate)
      ctx.addIssue({
        code: 'custom',
        path: ['teamFormationDeadline'],
        message: 'Debe ser anterior o igual a la fecha de entrega.',
      });
  });
export type ProjectFormValues = z.infer<typeof projectFormSchema>;
