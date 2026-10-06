import type { Page } from '@playwright/test'
import { expect, loginAs, openCheckout, resetScenario, seedGuestCart, test } from '../fixtures'

const shot = { animations: 'disabled' as const, caret: 'hide' as const }

/** Imagens `lazy` ainda carregando sob carga deixavam a captura de página inteira instável. */
async function waitForImages(page: Page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images)
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
  })
}

test.describe('regressão visual', () => {
  test('início', async ({ page }) => {
    await resetScenario(page, 'fast')
    // Mouse sobre o destaque segura a troca automática durante a captura.
    await page.getByRole('heading', { level: 1 }).hover()
    await expect(page.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible()
    await waitForImages(page)
    await expect(page).toHaveScreenshot('inicio.png', { ...shot, fullPage: true })
  })

  test('detalhe', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { name: /emerald ape #042/i })).toBeVisible()
    await waitForImages(page)
    await expect(page).toHaveScreenshot('detalhe.png', { ...shot, fullPage: true })
  })

  test('carrinho', async ({ page }) => {
    await resetScenario(page, 'fast')
    await seedGuestCart(page, [{ nftId: 'emerald-ape-042', editionId: '1-50', quantity: 2 }])
    await page.goto('/cart')
    await expect(page.getByTestId('cart-total')).toBeVisible()
    await waitForImages(page)
    await expect(page).toHaveScreenshot('carrinho.png', { ...shot, fullPage: true })
  })

  test('pagamento', async ({ page }) => {
    await openCheckout(page, 'fast')
    await expect(page.getByTestId('checkout-total')).toBeVisible()
    await waitForImages(page)
    await expect(page).toHaveScreenshot('pagamento.png', { ...shot, fullPage: true })
  })

  test('início com zoom 200%', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2'
    })
    await expect(page.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible()
    await expect(page.getByRole('navigation').or(page.getByRole('link', { name: /início/i })).first()).toBeVisible()
  })
})

test.describe('sessão no visual de conta', () => {
  test('perfil autenticado não quebra o layout', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto('/profile')
    await expect(page.getByTestId('session-email')).toBeVisible()
    await expect(page.getByTestId('profile-save')).toBeVisible()
  })
})
