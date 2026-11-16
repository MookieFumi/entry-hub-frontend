import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { BOOKING_DAY, mockApi, signIn } from './fake-api'

const ROOM = '/rooms/11111111-1111-1111-1111-111111111111'

async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
}

test('login screen', async ({ page }) => {
  await mockApi(page)
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  await expectNoSeriousViolations(page)
})

test('landing page', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Salas reservadas en un minuto.' })).toBeVisible()
  await page.getByRole('button', { name: 'Sala Miró, 10:00, libre' }).click()
  await expect(page.getByRole('button', { name: 'Sala Miró, 10:00, tuya' })).toBeVisible()
  await page.getByRole('button', { name: 'Sala Gaudí, 09:00, ocupada' }).click()
  await expect(page.getByText('La sala no está disponible en esa franja.').first()).toBeVisible()
  await expectNoSeriousViolations(page)
})

const screens: [string, string, string, string][] = [
  ['room catalog', '/rooms', 'employee', 'link:Sala Gaudí'],
  ['room page', `${ROOM}?date=${BOOKING_DAY}`, 'employee', 'heading:Sala Gaudí'],
  ['week view', `${ROOM}/week?date=${BOOKING_DAY}`, 'employee', 'heading:Lunes'],
  ['availability search', '/search', 'employee', 'heading:Buscar disponibilidad'],
  ['my bookings', '/bookings', 'employee', 'text:Weekly sync'],
  ['room administration', '/admin/rooms', 'facilities', 'heading:Administración de salas'],
]

for (const [name, path, token, ready] of screens) {
  test(name, async ({ page }) => {
    await mockApi(page)
    await signIn(page, token)
    await page.goto(path)
    const [kind, text] = ready.split(':') as [string, string]
    const target =
      kind === 'text'
        ? page.getByText(text)
        : page.getByRole(kind as 'link' | 'heading', { name: new RegExp(text) })
    await expect(target.first()).toBeVisible()
    await expectNoSeriousViolations(page)
  })
}
