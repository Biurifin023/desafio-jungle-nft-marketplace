import { CREDENTIALS, expect, loginAs, resetScenario, test } from '../fixtures'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('8. perfil, avatar, senha e carteiras', () => {
  test('edita perfil e persiste após refresh', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto('/profile')
    await expect(page.getByTestId('session-email')).toHaveText(CREDENTIALS.ana.email)

    await page.getByLabel('Nome de exibição').fill('Ana Atualizada')
    await page.getByTestId('profile-save').click()
    await expect(page.getByTestId('session-name')).toHaveText('Ana Atualizada')

    await page.reload()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Atualizada')
    await expect(page.getByTestId('session-name')).toHaveText('Ana Atualizada')
  })

  test('validação de cliente e erro 422 da API', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto('/profile')
    await page.getByLabel('Nome de exibição').fill('A')
    await page.getByTestId('profile-save').click()
    await expect(page.getByRole('alert').filter({ hasText: /nome de exibição/i })).toBeVisible()

    await page.evaluate(() => window.__mock!.setScenario('validation-error'))
    await page.getByLabel('Nome de exibição').fill('Ana Colecionadora')
    await page.getByTestId('profile-save').click()
    await expect(page.getByRole('alert').filter({ hasText: /reservado/i })).toBeVisible()
  })

  test('avatar, senha e carteiras', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto('/profile')

    await page.getByTestId('avatar-input').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG })
    await expect(page.getByTestId('avatar-preview')).toBeVisible()

    await page.getByLabel('Senha atual', { exact: true }).fill('errada')
    await page.getByLabel('Nova senha', { exact: true }).fill('Kurio@2027')
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Kurio@2028')
    await page.getByTestId('profile-save').click()
    await expect(page.getByRole('alert').filter({ hasText: /senhas não coincidem/i })).toBeVisible()

    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Kurio@2027')
    await page.getByTestId('profile-save').click()
    await expect(page.getByRole('alert').filter({ hasText: /senha atual incorreta/i })).toBeVisible()

    await page.getByLabel('Senha atual', { exact: true }).fill(CREDENTIALS.ana.password)
    await page.getByTestId('profile-save').click()
    await expect(page.getByTestId('live-region').getByText(/senha alterada/i)).toBeVisible()

    await page.goto('/wallets')
    const nickname = page.getByLabel('Apelido da carteira').first()
    await nickname.fill('Cofre Ana')
    await page.getByTestId('wallet-primary-save').click()
    await expect(page.getByTestId('live-region').getByText(/carteira principal salva/i)).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Apelido da carteira').first()).toHaveValue('Cofre Ana')

    await page.getByLabel('Endereço').first().fill('0x123')
    await page.getByTestId('wallet-primary-save').click()
    await expect(page.getByRole('alert').filter({ hasText: /0x seguido de 40/i })).toBeVisible()
  })
})
