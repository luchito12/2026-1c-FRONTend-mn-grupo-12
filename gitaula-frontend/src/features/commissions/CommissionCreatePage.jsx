import { useMarkChangesSaved } from '../../shared/ui/UnsavedChanges.jsx';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button, MenuItem, Paper, Stack, TextField } from '@mui/material';
import { useCreateCommission } from './hooks.js';
import { useCurrentUser } from '../auth/useCurrentUser.js';
import { PageHeader } from '../../shared/ui/PageHeader.jsx';
import { fieldProps } from '../../shared/lib/form.js';
import { useUnsavedChanges } from '../../shared/ui/UnsavedChanges.jsx';
import { MutationError } from '../../shared/ui/MutationError.jsx';
const schema = z.object({
  subjectName: z.string().trim().min(2, 'Ingresá el nombre de la materia.'),
  subjectCode: z.string().trim().min(2, 'Ingresá el código.'),
  commissionName: z.string().trim().min(1, 'Ingresá el nombre de la comisión.'),
  year: z.coerce.number().int().min(2020, 'Ingresá un año válido.').max(2100),
  term: z.enum(['FIRST_TERM', 'SECOND_TERM', 'ANNUAL']),
});
export function CommissionCreatePage() {
  const navigate = useNavigate();
  const markSaved = useMarkChangesSaved();
  const user = useCurrentUser();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      subjectName: '',
      subjectCode: '',
      commissionName: '',
      year: new Date().getFullYear(),
      term: 'FIRST_TERM',
    },
  });
  const create = useCreateCommission(() => {
    markSaved();
    form.reset(form.getValues());
    navigate('/comisiones');
  });
  useUnsavedChanges(form.formState.isDirty && !create.isSuccess);
  return (
    <>
      <PageHeader eyebrow="NUEVA COMISIÓN" title="Creá un espacio para tu cursada">
        Quedarás inscripto como docente de esta comisión.
      </PageHeader>
      <Paper variant="outlined" sx={{ maxWidth: 760, p: 3 }}>
        <Stack
          component="form"
          spacing={3}
          onSubmit={form.handleSubmit((values) => {
            if (!create.isPending) create.mutate(values);
          })}
          noValidate
        >
          <TextField
            label="Nombre de la materia"
            {...fieldProps(form, 'subjectName')}
            autoComplete="off"
          />
          <TextField
            label="Código de materia"
            {...fieldProps(form, 'subjectCode')}
            autoComplete="off"
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Comisión" {...fieldProps(form, 'commissionName')} />
            <TextField label="Año" type="number" {...fieldProps(form, 'year')} />
          </Stack>
          <TextField select label="Período" defaultValue="FIRST_TERM" {...fieldProps(form, 'term')}>
            <MenuItem value="FIRST_TERM">Primer cuatrimestre</MenuItem>
            <MenuItem value="SECOND_TERM">Segundo cuatrimestre</MenuItem>
            <MenuItem value="ANNUAL">Anual</MenuItem>
          </TextField>
          <MutationError mutation={create} />
          <Button
            type="submit"
            variant="contained"
            disabled={create.isPending || create.isUncertain || !user?.userId}
          >
            {create.isPending ? 'Creando…' : 'Crear comisión'}
          </Button>
        </Stack>
      </Paper>
    </>
  );
}
