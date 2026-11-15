import { ruleMessage, toApiError } from './errors'

describe('toApiError', () => {
  it('turns the broken rules of a 422 into Spanish messages', () => {
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

  it('uses the API text when the code is unknown', () => {
    expect(ruleMessage({ code: 'Nueva', message: 'Mensaje del servidor' })).toBe(
      'Mensaje del servidor',
    )
  })

  it('keeps the per-field errors of a 400', () => {
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
