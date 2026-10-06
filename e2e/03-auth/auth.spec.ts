import type { Page } from '@playwright/test'
import { CREDENTIALS, expect, resetScenario, test } from '../fixtures'

async function waitForMocks(page: Page) {
  await page.waitForFunction(() => Boolean(window.__mock), undefined, { timeout: 15_000 })
}

async function submitLogin(page: Page, email: string, password: string) {
  await page.goto('/login')
  await waitForMocks(page)
  await page.getByRole('textbox', { name: 'E-mail' }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByTestId('auth-submit').click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function logoutFromProfile(page: Page) {
  await page.goto('/profile')
  await expect(page.getByTestId('logout')).toBeVisible()
  await page.getByTestId('logout').click()
  await expect(page).toHaveURL(/\/(\?|$)/)
  await expect(page.getByTestId('session-email')).toHaveCount(0)
}

test.describe('auth e sessão', () => {
  test('cadastro, login, expiração, logout e troca de usuário', async ({ page }) => {
    test.setTimeout(90_000)
    await resetScenario(page, 'fast')

    await page.goto('/register')
    await waitForMocks(page)
    await page.getByLabel('Nome de usuário').fill('nova.kurio')
    await page.getByRole('textbox', { name: 'E-mail' }).fill('nova.kurio@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('Kurio@2026')
    await page.getByLabel('Confirmar senha').fill('Kurio@2026')
    await page.getByTestId('auth-submit').click()
    await expect(page).toHaveURL(/\/$|\/\?/)

    await page.goto('/profile')
    await expect(page.getByTestId('session-email')).toHaveText('nova.kurio@kurio.dev')

    await logoutFromProfile(page)

    await submitLogin(page, CREDENTIALS.ana.email, CREDENTIALS.ana.password)
    await expect(page).toHaveURL(/\/$|\/\?/)
    await page.goto('/profile')
    await expect(page.getByTestId('session-email')).toHaveText(CREDENTIALS.ana.email)
    await expect(page.getByTestId('session-name')).toHaveText('Ana Colecionadora')

    await page.reload()
    await waitForMocks(page)
    await expect(page.getByTestId('session-email')).toHaveText(CREDENTIALS.ana.email)

    await page.goto('/favorites')
    await expect(page.getByTestId('favorite-id')).toHaveAttribute('data-nft-id', 'emerald-ape-042')

    await page.evaluate(() => window.__mock!.expireSessions())
    await page.reload()
    await waitForMocks(page)
    await expect(page.getByRole('alert').filter({ hasText: /sessão expirou/i })).toBeVisible()
    await page.getByRole('button', { name: /entrar novamente/i }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/redirect=/)
    await page.getByRole('textbox', { name: 'E-mail' }).fill(CREDENTIALS.ana.email)
    await page.getByLabel('Senha', { exact: true }).fill(CREDENTIALS.ana.password)
    await page.getByTestId('auth-submit').click()
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page).toHaveURL(/\/favorites/)
    await expect(page.getByTestId('favorite-id')).toHaveAttribute('data-nft-id', 'emerald-ape-042')

    await logoutFromProfile(page)
    await expect(page.getByTestId('session-email')).toHaveCount(0)

    await submitLogin(page, CREDENTIALS.bruno.email, CREDENTIALS.bruno.password)
    await expect(page).toHaveURL(/\/$|\/\?/)
    await page.goto('/profile')
    await expect(page.getByTestId('session-email')).toHaveText(CREDENTIALS.bruno.email)
    await expect(page.getByTestId('session-name')).toHaveText('Bruno Cripto')
    await expect(page.getByText('Ana Colecionadora')).toHaveCount(0)

    await page.goto('/favorites')
    await expect(page.getByTestId('favorite-id')).toHaveCount(0)
    await expect(page.getByText('emerald-ape-042')).toHaveCount(0)
  })

  test('cadastro com e-mail em uso retorna 409 e associa o erro ao campo', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/register')
    await waitForMocks(page)
    await page.getByLabel('Nome de usuário').fill('ana.nova')
    await page.getByRole('textbox', { name: 'E-mail' }).fill(CREDENTIALS.ana.email)
    await page.getByLabel('Senha', { exact: true }).fill('Kurio@2026')
    await page.getByLabel('Confirmar senha').fill('Kurio@2026')
    await page.getByTestId('auth-submit').click()

    const email = page.getByRole('textbox', { name: 'E-mail' })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`#${describedBy}`)).toContainText(/já existe uma conta com este e-mail/i)
  })

  test('login social avisa que está fora do escopo', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/login')
    await waitForMocks(page)
    await page.getByRole('button', { name: /continuar com google/i }).click()
    await expect(page.getByRole('dialog', { name: /indisponível/i })).toBeVisible()
    await expect(page.getByText(/continuar com google/i).nth(1)).toBeVisible()
  })
})
