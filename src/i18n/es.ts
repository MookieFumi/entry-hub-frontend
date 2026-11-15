/**
 * Spanish catalog: the default language and the source of truth for the message keys.
 * Placeholders use `{name}`. Add the same key to `en.ts`; a test fails if the catalogs diverge.
 */
export const es = {
  'app.name': 'EntryHub',
  'rule.DurationTooShort': 'La reserva es demasiado corta.',
  'rule.DurationTooLong': 'La reserva es demasiado larga.',
  'rule.NotOnSlotBoundary': 'El inicio y el fin deben ir en tramos de 15 minutos.',
  'rule.OutsideOfficeHours':
    'Fuera del horario de la oficina (de lunes a viernes, en un solo día).',
  'rule.TooSoon': 'La reserva empieza demasiado pronto.',
  'rule.TooFarAhead': 'La reserva está demasiado lejos en el tiempo.',
  'rule.ExceedsCapacity': 'Hay más asistentes que la capacidad de la sala.',
  'rule.RoomUnavailable': 'La sala no está disponible en esa franja.',
  'rule.TooManyActiveBookings': 'Has alcanzado el máximo de reservas activas.',
  'rule.TooLateToReschedule': 'Ya no se puede reprogramar: queda muy poco para el inicio.',
  'rule.NotActive': 'La sala no está activa.',
  'rule.TooLateToCancel': 'Ya no se puede cancelar: queda muy poco para el inicio.',
  'common.loading': 'Cargando…',
} as const
