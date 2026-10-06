import type { Locator, Page } from '@playwright/test'
import { CART_EMERALD, expect, loginAs, resetScenario, seedGuestCart, seedUserCart, test } from '../fixtures'

/** 720 px de viewport CSS equivale a uma janela de 1440 px com zoom de 200%. */
const VIEWPORTS = [
  { label: 'mobile 390', width: 390, height: 844 },
  { label: 'tablet 768', width: 768, height: 1024 },
  { label: 'desktop 1440', width: 1440, height: 900 },
  { label: '1440 com zoom 200%', width: 720, height: 450 },
] as const

interface Screen {
  url: string
  ready: (page: Page) => Locator
}

async function expectResponsive(page: Page, screen: Screen) {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(screen.url)
    await expect(screen.ready(page), `${screen.url} em ${viewport.label}`).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `overflow horizontal em ${screen.url} (${viewport.label})`).toBeLessThanOrEqual(1)
  }
}

test.describe('responsividade 390 / 768 / 1440 e zoom 200%', () => {
  test.skip(({ isMobile }) => isMobile, 'os viewports são trocados explicitamente no projeto desktop')

  test('telas públicas', async ({ page }) => {
    test.setTimeout(120_000)
    await resetScenario(page, 'fast')
    await seedGuestCart(page, [CART_EMERALD])

    const screens: Screen[] = [
      { url: '/', ready: (p) => p.getByRole('link', { name: /emerald ape #042/i }).first() },
      { url: '/nft/emerald-ape-042', ready: (p) => p.getByRole('heading', { name: /emerald ape #042/i }).filter({ visible: true }).first() },
      { url: '/cart', ready: (p) => p.getByTestId('cart-total') },
      { url: '/login', ready: (p) => p.getByRole('textbox', { name: 'E-mail' }) },
      { url: '/register', ready: (p) => p.getByTestId('auth-submit') },
      { url: '/nft/nao-existe', ready: (p) => p.getByText(/erro 404/i) },
      { url: '/rota-que-nao-existe', ready: (p) => p.getByRole('heading', { name: /página não encontrada/i }) },
    ]
    for (const screen of screens) await expectResponsive(page, screen)
  })

  test('telas privadas e confirmação do pedido', async ({ page }) => {
    test.setTimeout(150_000)
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await seedUserCart(page, [CART_EMERALD])

    const screens: Screen[] = [
      { url: '/checkout', ready: (p) => p.getByTestId('checkout-total') },
      { url: '/profile', ready: (p) => p.getByTestId('profile-save') },
      { url: '/wallets', ready: (p) => p.getByTestId('wallet-primary-save') },
      { url: '/favorites', ready: (p) => p.getByRole('heading', { name: /^favoritos$/i }) },
    ]
    for (const screen of screens) await expectResponsive(page, screen)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/checkout')
    await expect(page.getByLabel('Carteira')).not.toHaveValue('')
    await page.getByTestId('connect-wallet').click()
    await expect(page.getByTestId('wallet-status')).toBeVisible()
    await page.getByTestId('confirm-order').click()
    await expect(page.getByRole('heading', { name: /pedido confirmado/i })).toBeVisible({ timeout: 20_000 })

    await expectResponsive(page, { url: new URL(page.url()).pathname, ready: (p) => p.getByTestId('order-id') })
  })
})
