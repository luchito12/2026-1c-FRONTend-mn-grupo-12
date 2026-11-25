import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { useId } from 'react';
export function ConfirmDialog({
  open,
  title = '¿Confirmás esta acción?',
  children,
  onCancel,
  onConfirm,
  onExited,
  busy,
  error,
  confirmLabel = 'Confirmar',
}) {
  const id = useId();
  return (
    <Dialog
      open={open}
      slotProps={{ transition: { onExited } }}
      onClose={busy ? undefined : onCancel}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${id}-description`}>{children}</DialogContentText>
        {error}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={busy} autoFocus>
          {busy ? 'Procesando…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
