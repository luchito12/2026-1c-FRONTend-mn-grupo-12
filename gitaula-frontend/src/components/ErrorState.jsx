export function ErrorState({ error, title = 'No pudimos cargar esta información', retry }) {
  const contract = error?.status === 404 ? ' Si esta pantalla depende de una ruta nueva, revisá el documento de desajustes del contrato.' : '';
  return <section className="state error-state" role="alert"><h2>{title}</h2><p>{error?.message || 'Ocurrió un error inesperado.'}{contract}</p>{retry && <button onClick={retry}>Reintentar</button>}</section>;
}
