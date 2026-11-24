export function ConfirmDialog({ open, title = '¿Confirmás esta acción?', children, onCancel, onConfirm, busy }) {
  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">{title}</h2><p>{children}</p><div className="dialog-actions"><button onClick={onCancel} disabled={busy}>Cancelar</button><button className="primary danger" onClick={onConfirm} disabled={busy}>{busy ? 'Procesando…' : 'Confirmar'}</button></div></section></div>;
}
