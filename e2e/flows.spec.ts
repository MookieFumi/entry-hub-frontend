import { expect, test } from '@playwright/test'
import { BOOKING_DAY, mockApi, signIn } from './fake-api'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('sign in and book a room', async ({ page }) => {
  await signIn(page)
  await page.goto('/rooms')
  await page.getByRole('link', { name: 'Sala Gaudí' }).click()
  await page.getByLabel('Día', { exact: true }).fill(BOOKING_DAY)
  await page.getByLabel('Hora de inicio').selectOption('10:00')
  await page.getByLabel('Hora de fin').selectOption('11:00')
  await page.getByLabel('Título').fill('Planning')
  await page.getByRole('button', { name: 'Reservar' }).click()
  await expect(page.getByRole('heading', { name: 'Planning' })).toBeVisible()
})

test('cancel a booking', async ({ page }) => {
  await signIn(page)
  await page.goto('/bookings')
  await expect(page.getByRole('link', { name: 'Weekly sync' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar reserva' }).click()
  await expect(page.getByRole('link', { name: 'Weekly sync' })).toBeHidden()
})

test('Facilities creates a room', async ({ page }) => {
  await signIn(page, 'facilities')
  await page.goto('/admin/rooms')
  await page.getByRole('button', { name: 'Nueva sala' }).click()
  await page.getByLabel('Nombre').fill('Sala Picasso')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Sala Picasso')).toBeVisible()
})

test('an Employee cannot open the administration', async ({ page }) => {
  await signIn(page)
  await page.goto('/admin/rooms')
  await expect(page.getByText('Sin permiso')).toBeVisible()
})
