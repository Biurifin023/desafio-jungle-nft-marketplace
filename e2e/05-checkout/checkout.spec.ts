import type { Page } from '@playwright/test'
import { CART_EMERALD, CREDENTIALS, expect, loginAs, resetScenario, seedUserCart, test } from '../fixtures'

async function connectAndConfirm(page: Page) {
  await expect(page.getByTestId('checkout-page')).toBeVisible()
  await expect(page.getByLabel('Carteira')).not.toHaveValue('')
  await page.getByTestId('connect-wallet').click()
  await expect(page.getByTestId('wallet-status')).toBeVisible()
  await page.getByTestId('confirm-order').click()
}

test.describe('6. compra completa', () => {
  test('do catálogo ao recibo confirmado', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto('/')
    await page.getByTestId('nft-grid').getByRole('link', { name: /emerald ape #042.*1\.19 eth/i }).click()
    await expect(page.getByRole('heading', { name: /emerald ape #042/i })).toBeVisible()
    await page.getByRole('button', { name: /^comprar$|^comprar nft$/i }).click()
    await expect(page.getByText('Adicionado ao carrinho', { exact: true })).toBeVisible()
    await page.goto('/cart')
    await expect(page.getByTestId('cart-total')).toBeVisible()
    await page.getByRole('link', { name: /ir para pagamento/i }).click()
    await expect(page).toHaveURL(/\/checkout/)
    await connectAndConfirm(page)
    await expect(page.getByRole('heading', { name: /pedido confirmado/i })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('order-status')).toHaveText('confirmed')
    await expect(page.getByTestId('order-id')).not.toHaveText('')
    await expect(page.getByTestId('tx-hash')).toBeVisible()
    await expect(page.getByText(/emerald ape #042/i)).toBeVisible()
  })
})

test.describe('sessão expirada durante o checkout', () => {
  test('preserva o rascunho e o carrinho e retoma o checkout após novo login', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await seedUserCart(page, [CART_EMERALD])
    await page.goto('/checkout')
    await expect(page.getByLabel('Carteira')).not.toHaveValue('')
    await page.getByLabel('Nome de exibição').fill('Ana Rascunho')

    await page.evaluate(() => window.__mock!.expireSessions())
    await page.getByTestId('connect-wallet').click()
    await expect(page.getByRole('alert').filter({ hasText: /sessão expirou/i })).toBeVisible()
    await page.getByRole('button', { name: /entrar novamente/i }).click()
    await expect(page).toHaveURL(/\/login\?redirect=/)

    await page.getByRole('textbox', { name: 'E-mail' }).fill(CREDENTIALS.ana.email)
    await page.getByLabel('Senha', { exact: true }).fill(CREDENTIALS.ana.password)
    await page.getByTestId('auth-submit').click()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Rascunho')
    await expect(page.getByTestId('checkout-total')).toHaveText('2.396 ETH')
  })
})

test.describe('7. falha, clique repetido e timeout', () => {
  test('pagamento recusado mostra recusa e mantém o carrinho', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await seedUserCart(page, [CART_EMERALD])
    await page.evaluate(() => window.__mock!.setScenario('payment-declined'))
    await page.goto('/checkout')
    await connectAndConfirm(page)
    await expect(page.getByRole('heading', { name: /pagamento recusado/i })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('order-status')).toHaveText('declined')
    await page.goto('/cart')
    await expect(page.getByTestId('cart-item').filter({ hasText: 'Emerald Ape #042' })).toBeVisible()
  })

  test('clique repetido cria um único pedido', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await seedUserCart(page, [CART_EMERALD])
    await page.goto('/checkout')
    await expect(page.getByLabel('Carteira')).not.toHaveValue('')
    await page.getByTestId('connect-wallet').click()
    await expect(page.getByTestId('wallet-status')).toBeVisible()
    const confirm = page.getByTestId('confirm-order')
    await confirm.evaluate((el) => {
      (el as HTMLButtonElement).click()
      ;(el as HTMLButtonElement).click()
    })
    await expect(page.getByTestId('order-id')).toBeVisible({ timeout: 20_000 })
    const count = await page.evaluate(() => {
      const state = window.__mock!.state() as { orders: unknown[] }
      return state.orders.length
    })
    expect(count).toBe(1)
  })

  test('timeout após criar recupera o mesmo pedido', async ({ page }) => {
    test.setTimeout(90_000)
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await seedUserCart(page, [CART_EMERALD])
    await page.evaluate(() => window.__mock!.setScenario('order-timeout'))
    await page.goto('/checkout')
    await expect(page.getByLabel('Carteira')).not.toHaveValue('')
    await page.getByTestId('connect-wallet').click()
    await expect(page.getByTestId('wallet-status')).toBeVisible()
    await page.getByTestId('confirm-order').click()
    const stale = page.getByTestId('checkout-stale')
    const receipt = page.getByTestId('order-id')
    await expect(stale.or(receipt)).toBeVisible({ timeout: 25_000 })
    if (await stale.isVisible()) {
      await page.getByTestId('confirm-order').click()
      await expect(receipt).toBeVisible({ timeout: 20_000 })
    }
    const ids = await page.evaluate(() => {
      const state = window.__mock!.state() as { orders: { id: string }[] }
      return state.orders.map((o) => o.id)
    })
    expect(ids).toHaveLength(1)
    await expect(page.getByTestId('order-id')).toHaveText(ids[0]!)
  })
})
