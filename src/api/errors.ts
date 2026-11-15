import type { components } from './schema'

type RuleViolation = components['schemas']['RuleViolation']

/** Spanish user-facing messages for each booking-rule code the API returns (422). */
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
  TooLateToReschedule: 'Ya no se puede reprogramar: queda muy poco para el inicio.',
  NotActive: 'La sala no está activa.',
  TooLateToCancel: 'Ya no se puede cancelar: queda muy poco para el inicio.',
}

/** Message for a code; if it is unknown, use the text the API sends. */
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

/** API error with the information already interpreted for the UI. */
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

/** Turns an unsuccessful response (application/problem+json or empty) into an ApiError. */
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
