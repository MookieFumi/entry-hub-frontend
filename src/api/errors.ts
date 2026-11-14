import type { components } from './schema'

type RuleViolation = components['schemas']['RuleViolation']

/** Mensajes en español para cada código de regla de reserva que devuelve la API (422). */
const RULE_MESSAGES: Record<string, string> = {
  DurationTooShort: 'La reserva es demasiado corta.',
  DurationTooLong: 'La reserva es demasiado larga.',
  NotOnSlotBoundary: 'El inicio y el fin deben ir en tramos de 15 minutos.',
  OutsideOfficeHours: 'Fuera del horario de la oficina (de lunes a viernes, en un solo día).',
  TooSoon: 'La reserva empieza demasiado pronto.',
  TooFarAhead: 'La reserva está demasiado lejos en el tiempo.',
  ExceedsCapacity: 'Hay más asistentes que la capacidad de la sala.',
  RoomUnavailable: 'La sala no está disponible en esa franja.',
  TooManyActiveBookings: 'Has alcanzado el máximo de reservas activas.',
  TooLateToCancel: 'Ya no se puede cancelar: queda muy poco para el inicio.',
}

/** Mensaje para un código; si no lo conocemos, usamos el texto que envía la API. */
export function ruleMessage(violation: RuleViolation): string {
  return RULE_MESSAGES[violation.code] ?? violation.message
}

export type ApiErrorKind =
  | 'unauthenticated'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'rules-broken'
  | 'conflict'
  | 'unavailable'
  | 'unknown'

/** Error de la API con la información ya interpretada para la interfaz. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly violations: RuleViolation[]
  readonly fieldErrors: Record<string, string[]>

  constructor(init: {
    kind: ApiErrorKind
    status: number
    message: string
    violations?: RuleViolation[]
    fieldErrors?: Record<string, string[]>
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.violations = init.violations ?? []
    this.fieldErrors = init.fieldErrors ?? {}
  }
}

function kindFor(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'validation'
    case 401:
      return 'unauthenticated'
    case 403:
      return 'forbidden'
    case 404:
      return 'not-found'
    case 409:
      return 'conflict'
    case 422:
      return 'rules-broken'
    case 502:
    case 503:
    case 504:
      return 'unavailable'
    default:
      return 'unknown'
  }
}

/** Convierte una respuesta no satisfactoria (application/problem+json o vacía) en un ApiError. */
export function toApiError(status: number, body: unknown): ApiError {
  const problem = (body && typeof body === 'object' ? body : {}) as {
    detail?: string | null
    title?: string | null
    violations?: RuleViolation[]
    errors?: Record<string, string[]>
  }
  const violations = Array.isArray(problem.violations) ? problem.violations : []
  const message =
    violations.length > 0
      ? violations.map(ruleMessage).join(' ')
      : (problem.detail ?? problem.title ?? `Error ${status}`)

  return new ApiError({
    kind: kindFor(status),
    status,
    message,
    violations,
    fieldErrors: problem.errors ?? {},
  })
}
