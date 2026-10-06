import { expect, loginAs, resetScenario, test } from '../fixtures'

test.describe('2. acesso direto e 404', () => {
  test('abre /nft/emerald-ape-042 e mostra o colecionável', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { name: /emerald ape #042/i }).filter({ visible: true })).toBeVisible()
    await expect(page.getByText('1.19 ETH').filter({ visible: true })).toBeVisible()
    await expect(page.getByText(/id do token/i).filter({ visible: true })).toBeVisible()
    await expect(page.getByText(/kurio apes/i).filter({ visible: true }).first()).toBeVisible()
  })

  test('id inexistente mostra 404', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/nft/nao-existe')
    await expect(page.getByRole('heading', { name: /não encontrad/i })).toBeVisible()
    await expect(page.getByText(/erro 404/i)).toBeVisible()
  })

  test('edição esgotada desabilita a compra com texto e estado', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/nft/onyx-phantom-013')
    await expect(page.getByRole('heading', { name: /onyx phantom #013/i })).toBeVisible()
    const buy = page.getByRole('button', { name: /esgotad/i })
    await expect(buy).toBeVisible()
    await expect(buy).toBeDisabled()
  })
})

test.describe('4. favoritos', () => {
  test('visitante é enviado ao login com redirect', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { name: /emerald ape #042/i })).toBeVisible()
    await page.getByRole('button', { name: /favoritar/i }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/redirect=/)
  })

  test('usuário autenticado persiste favorito e lista em /favorites', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { name: /emerald ape #042/i })).toBeVisible()

    const favorite = page.getByRole('button', { name: /favoritar|remover dos favoritos/i })
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')

    await favorite.click()
    await expect(favorite).toHaveAttribute('aria-pressed', 'false')

    await page.reload()
    await expect(page.getByRole('heading', { name: /emerald ape #042/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /favoritar|remover dos favoritos/i })).toHaveAttribute('aria-pressed', 'false')

    await page.goto('/favorites')
    await expect(page.getByRole('heading', { name: /^favoritos$/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /emerald ape #042/i })).toHaveCount(0)
    await expect(page.getByText(/nenhum favorito/i)).toBeVisible()

    await page.goto('/nft/emerald-ape-042')
    await page.getByRole('button', { name: /favoritar|remover dos favoritos/i }).click()
    await expect(page.getByRole('button', { name: /favoritar|remover dos favoritos/i })).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/favorites')
    await expect(page.getByRole('link', { name: /emerald ape #042/i })).toBeVisible()
  })

  test('cenário favorites-fail faz rollback do estado otimista', async ({ page }) => {
    await resetScenario(page, 'favorites-fail')
    await loginAs(page, 'ana')
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { name: /emerald ape #042/i })).toBeVisible()

    const favorite = page.getByRole('button', { name: /favoritar|remover dos favoritos/i })
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')
    await favorite.click()
    await expect(page.getByText(/não foi possível/i).first()).toBeVisible()
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('12. skeleton no cenário lento', () => {
  test('mostra shimmer enquanto o detalhe carrega', async ({ page }) => {
    const navigation = page.goto('/nft/emerald-ape-042?scenario=slow')
    await expect(page.locator('[data-slot="skeleton"]').filter({ visible: true }).first()).toBeVisible()
    await navigation
    await expect(page.getByRole('heading', { name: /emerald ape #042/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('nft-skeleton')).toHaveCount(0)
  })
})
