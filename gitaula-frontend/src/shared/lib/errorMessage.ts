// Translate known backend domain messages centrally. Raw details remain on ApiError.
const messages: [RegExp, string][] = [
  [
    /A commission must keep at least one active teacher/i,
    'La comisión debe conservar al menos un docente activo. Agregá otro docente antes de cambiar este rol o desactivar la inscripción.',
  ],
  [
    /User .+ not found/i,
    'El usuario no está registrado en GitAula. Pedile que inicie sesión con GitHub antes de agregarlo.',
  ],
  [
    /already enrolled/i,
    'El usuario ya participa en esta comisión. Si su inscripción está inactiva, podés reactivarla.',
  ],
  [
    /already (a member|belongs|in .*team)|already has a team/i,
    'El integrante ya pertenece a un equipo de este TP. Revisá su asignación.',
  ],
  [
    /team formation deadline has passed/i,
    'Venció el plazo de formación de equipos. Consultá a un docente de la comisión.',
  ],
  [/teacher-managed teams/i, 'Los equipos de este TP son asignados por un docente.'],
  [
    /team without members cannot be confirmed/i,
    'Agregá al menos un integrante antes de confirmar el equipo.',
  ],
  [/already confirmed/i, 'El equipo ya está confirmado. Actualizá su estado antes de continuar.'],
  [/same project/i, 'El equipo destino debe pertenecer al mismo TP.'],
  [
    /^(Team|Project|Commission|Delivery|Participant).+not found/i,
    'No encontramos el recurso solicitado. Revisá que siga disponible.',
  ],
];
export function errorMessage(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return messages.find(([pattern]) => pattern.test(value))?.[1] ?? value;
}
