import type { Page } from '@playwright/test'
import {
  CART_EMERALD,
  connectCheckoutWallet,
  expect,
  loginAs,
  openCheckout,
  resetScenario,
  seedUserCart,
  test,
  waitForCheckoutWallet,
} from '../fixtures'

async function waitForSocket(page: Page) {
  await page.waitForFunction(() => window.__kurioSocket?.connected === true, undefined, { timeout: 15_000 })
}

test.describe('9. alteração via Socket.IO no checkout', () => {
  test('preço muda durante o checkout e impede a cotação antiga', async ({ page, isMobile }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await seedUserCart(page, [CART_EMERALD])
    await page.evaluate(() => window.__mock!.setScenario('price-changed'))
    await page.goto('/checkout')
    await waitForCheckoutWallet(page)
    await waitForSocket(page)
    await connectCheckoutWallet(page, isMobile)
    await page.getByTestId('confirm-order').click()
    await expect(page.getByTestId('checkout-stale').or(page.getByTestId('realtime-change')).first()).toBeVisible()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByRole('heading', { name: /pedido confirmado/i })).toHaveCount(0)
  })
})

test.describe('10. duplicatas, versão antiga, desconexão e retomada', () => {
  test('ignora replay e versão antiga; recupera pedido pendente após drop', async ({ page, isMobile }) => {
    await openCheckout(page, 'fast')
    await waitForSocket(page)

    const first = await page.evaluate(() => window.__mock!.updateNft('emerald-ape-042', { editionId: '1-50', priceEth: '1.45' }))
    await page.evaluate((eventId) => window.__mock!.realtime.replay(eventId), first.eventId)
    await page.evaluate(
      ({ version }) =>
        window.__mock!.realtime.emitRaw({
          eventId: 'evt_stale_test',
          type: 'nft.updated',
          resource: { type: 'nft', id: 'emerald-ape-042' },
          version: Math.max(1, version - 5),
          occurredAt: '2026-01-01T00:00:00.000Z',
          data: {
            priceEth: '0.01',
            available: 99,
            editions: [{ id: '1-50', priceEth: '0.01', available: 99 }],
            reason: 'price_changed',
          },
        }),
      first,
    )
    await expect(page.getByText('0.01 ETH')).toHaveCount(0)

    await page.evaluate(() => window.__mock!.setScenario('payment-pending'))
    await connectCheckoutWallet(page, isMobile)
    await page.getByTestId('confirm-order').click()
    await expect(page.getByRole('heading', { name: /pedido (pendente|confirmado)/i })).toBeVisible({ timeout: 20_000 })
    const orderId = await page.getByTestId('order-id').innerText()

    await page.evaluate(() => window.__mock!.realtime.disconnect())
    await page.evaluate((id) => window.__mock!.settleOrder(id, 'confirmed'), orderId)
    await expect(page.getByRole('heading', { name: /pedido confirmado/i })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('order-status')).toHaveText('confirmed')
    await expect(page.getByTestId('order-id')).toHaveText(orderId)
  })
})
