import { useId, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { ConfirmDialog } from './ConfirmDialog.jsx';
export function FormDialog({ open, title, children, onClose, dirty = false, busy = false }) {
  const id = useId();
  const [discard, setDiscard] = useState(false);
  const closeAfterDiscard = useRef(false);
  function close() {
    if (busy) return;
    if (dirty) setDiscard(true);
    else onClose();
  }
  return (
    <>
      <Dialog open={open} onClose={close} aria-labelledby={id}>
        <DialogTitle id={id}>{title}</DialogTitle>
        <DialogContent dividers>{children}</DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={close}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={discard}
        title="¿Descartar los cambios?"
        confirmLabel="Descartar cambios"
        onCancel={() => setDiscard(false)}
        onExited={() => {
          if (closeAfterDiscard.current) {
            closeAfterDiscard.current = false;
            onClose();
          }
        }}
        onConfirm={() => {
          closeAfterDiscard.current = true;
          setDiscard(false);
        }}
      >
        Se perderán los datos que todavía no guardaste.
      </ConfirmDialog>
    </>
  );
}
