import { ruleMessage, toApiError } from './errors'

describe('toApiError', () => {
  it('traduce las reglas rotas de un 422 a mensajes en español', () => {
    const error = toApiError(422, {
      title: 'Rules broken',
      violations: [
        { code: 'ExceedsCapacity', message: 'The room holds 4 people' },
        { code: 'TooSoon', message: 'x' },
      ],
    })
    expect(error.kind).toBe('rules-broken')
    expect(error.violations).toHaveLength(2)
    expect(error.message).toContain('capacidad de la sala')
    expect(error.message).toContain('demasiado pronto')
  })

  it('usa el texto de la API si no conoce el código', () => {
    expect(ruleMessage({ code: 'Nueva', message: 'Mensaje del servidor' })).toBe(
      'Mensaje del servidor',
    )
  })

  it('conserva los errores por campo de un 400', () => {
    const error = toApiError(400, { title: 'Validation', errors: { Name: ['Obligatorio'] } })
    expect(error.kind).toBe('validation')
    expect(error.fieldErrors.Name).toEqual(['Obligatorio'])
  })

  it.each([
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [503, 'unavailable'],
    [418, 'unknown'],
  ])('clasifica el estado %i como %s', (status, kind) => {
    expect(toApiError(status, undefined).kind).toBe(kind)
  })
})
