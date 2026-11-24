export function LoadingState({ label = 'Cargando…', fullPage = false }) { return <div className={fullPage ? 'loading full-page' : 'loading'} role="status"><span className="spinner" />{label}</div>; }
