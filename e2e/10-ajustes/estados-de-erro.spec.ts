import type { Page } from '@playwright/test'
import { CART_EMERALD, expect, loginAs, openCheckout, resetScenario, seedGuestCart, seedUserCart, test } from '../fixtures'

type FailureRule = Parameters<NonNullable<Window['__mock']>['failNext']>[0]

/** Falhas gravadas no cenário sobrevivem ao recarregamento da página (ao contrário de `failNext`). */
async function failOnLoad(page: Page, rules: FailureRule[]) {
  await page.evaluate((failures) => window.__mock!.configure({ network: { failures } }), rules)
}

test.describe('estados de erro', () => {
  test('carrinho: falha na cotação mostra erro com nova tentativa', async ({ page }) => {
    await resetScenario(page, 'fast')
    await seedGuestCart(page, [CART_EMERALD])
    await failOnLoad(page, [{ method: 'GET', path: '/api/quote', status: 500, code: 'internal', retryable: false, times: 1 }])
    await page.goto('/cart')

    await expect(page.getByText('Não foi possível calcular o resumo')).toBeVisible()
    await expect(page.getByTestId('quote-skeleton')).toHaveCount(0)
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByTestId('cart-subtotal')).toBeVisible()
  })

  test('checkout: falha ao carregar o perfil mostra erro e a nova tentativa preenche o formulário', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await seedUserCart(page, [CART_EMERALD])
    await failOnLoad(page, [{ method: 'GET', path: '/api/me/profile', status: 500, code: 'internal', retryable: false, times: 1 }])
    await page.goto('/checkout')

    await expect(page.getByText('Não foi possível carregar seus dados')).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByLabel('Carteira')).not.toHaveValue('')
    await expect(page.getByLabel('E-mail')).toHaveValue('ana@kurio.dev')
  })

  test('checkout: falha na cotação aparece na revisão com nova tentativa', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await seedUserCart(page, [CART_EMERALD])
    await failOnLoad(page, [{ method: 'GET', path: '/api/quote', status: 500, code: 'internal', retryable: false, times: 1 }])
    await page.goto('/checkout')

    await expect(page.getByText('Não foi possível calcular a cotação')).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByTestId('checkout-total')).toBeVisible()
  })

  test('checkout: erro 422 com campos aparece no campo e recebe o foco', async ({ page }) => {
    await openCheckout(page)
    await page.getByTestId('connect-wallet').click()
    await expect(page.getByTestId('wallet-status')).toBeVisible()
    await page.evaluate(() =>
      window.__mock!.failNext({
        method: 'POST',
        path: '/api/orders',
        status: 422,
        code: 'validation_error',
        message: 'Revise os dados do pedido.',
        retryable: false,
        fields: { 'collector.email': 'Use um e-mail válido para o recibo.' },
      }),
    )
    await page.getByTestId('confirm-order').click()

    await expect(page.getByText('Use um e-mail válido para o recibo.')).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeFocused()
    await expect(page).toHaveURL(/\/checkout/)
  })

  test('pedido inexistente mostra "não encontrado" em vez de nova tentativa', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto('/orders/pedido-inexistente')

    await expect(page.getByText('Pedido não encontrado')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0)
  })

  test('favoritos: um NFT removido não derruba a lista', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.evaluate(async () => {
      const { token } = JSON.parse(localStorage.getItem('kurio.session')!) as { token: string }
      for (const id of ['emerald-ape-042', 'violet-nomad-314']) {
        const res = await fetch(`/api/me/favorites/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error(await res.text())
      }
    })
    await failOnLoad(page, [{ method: 'GET', path: '/api/nfts/violet-nomad-314', status: 404, code: 'not_found', retryable: false }])
    await page.goto('/favorites')

    const list = page.getByTestId('favorites-list')
    await expect(list.locator('[data-nft-id="emerald-ape-042"]')).toBeVisible()
    await expect(list.locator('[data-nft-id="violet-nomad-314"]')).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})
