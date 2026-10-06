import { expect, resetScenario, test } from '../fixtures'

test.describe('fundação', () => {
  test('sobe a aplicação com mocks e header', async ({ page }) => {
    await resetScenario(page, 'fast')
    await expect(page.getByRole('heading', { level: 1, name: /seja dono/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /início/i }).first()).toBeVisible()
    await expect(page).toHaveTitle(/início/i)
  })

  test('rota inexistente mostra 404', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/rota-que-nao-existe')
    await expect(page.getByRole('heading', { name: /página não encontrada/i })).toBeVisible()
  })

  test('checkout sem sessão redireciona para login', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/login/)
  })
})
