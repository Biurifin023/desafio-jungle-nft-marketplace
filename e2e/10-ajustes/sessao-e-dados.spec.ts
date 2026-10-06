import type { Page } from '@playwright/test'
import { CREDENTIALS, expect, loginAs, openCheckout, resetScenario, test } from '../fixtures'

/** Fora dos favoritos iniciais da Ana (a fixture já favorita o Emerald Ape). */
const NFT_ID = 'violet-nomad-314'
const NFT_PATH = `/nft/${NFT_ID}`

async function serverFavorites(page: Page) {
  return page.evaluate(async () => {
    const { token } = JSON.parse(localStorage.getItem('kurio.session')!) as { token: string }
    const res = await fetch('/api/me/favorites', { headers: { Authorization: `Bearer ${token}` } })
    return ((await res.json()) as { nftIds: string[] }).nftIds
  })
}

test.describe('sessão e dados', () => {
  test('sessão salva com formato inválido é descartada', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.evaluate(() => localStorage.setItem('kurio.session', JSON.stringify({ token: 'abc', user: { id: 'x' } })))
    await page.reload()

    await expect.poll(() => page.evaluate(() => localStorage.getItem('kurio.session'))).toBeNull()
    await page.goto('/favorites')
    await expect(page).toHaveURL(/\/login/)
  })

  test('401 de uma requisição feita com o token anterior não encerra a sessão nova', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto(NFT_PATH)
    const favorite = page.getByRole('button', { name: 'Favoritar' })
    await expect(favorite).toBeVisible()

    const bruno = await page.evaluate(async (credentials) => {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      const data = (await res.json()) as { token: string; user: unknown; expiresAt: string }
      return JSON.stringify({ token: data.token, user: data.user, expiresAt: data.expiresAt })
    }, CREDENTIALS.bruno)
    await page.evaluate(() => {
      window.__mock!.configure({ network: { latency: { min: 1000, max: 1000 } } })
      window.__mock!.failNext({ method: 'PUT', path: '/api/me/favorites', status: 401, code: 'unauthorized', retryable: false })
    })

    await favorite.click()
    // Outra aba troca a conta enquanto o PUT (com o token da Ana) ainda está em andamento.
    await page.evaluate((next) => {
      localStorage.setItem('kurio.session', next)
      window.dispatchEvent(new StorageEvent('storage', { key: 'kurio.session' }))
    }, bruno)

    // A latência simulada é de 1 s; depois dela o 401 da requisição antiga já foi processado.
    await page.waitForTimeout(2_000)
    expect(await page.evaluate(() => localStorage.getItem('kurio.session'))).toBe(bruno)
  })

  test('cliques repetidos no favorito durante a requisição não desfazem a ação', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto(NFT_PATH)
    const favorite = page.getByRole('button', { name: /^(Favoritar|Remover dos favoritos)$/ })
    await expect(favorite).toHaveAttribute('aria-pressed', 'false')
    await page.evaluate(() => window.__mock!.configure({ network: { latency: { min: 800, max: 800 } } }))

    await favorite.click()
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')
    await expect(favorite).toHaveAttribute('aria-busy', 'true')
    await favorite.click()
    await expect(favorite).not.toHaveAttribute('aria-busy', 'true', { timeout: 5_000 })
    await page.waitForTimeout(1_200)

    await expect(favorite).toHaveAttribute('aria-pressed', 'true')
    expect(await serverFavorites(page)).toContain(NFT_ID)
  })

  test('evento de pedido em tempo real chega ao dono com o token só no auth do Socket.IO', async ({ page }) => {
    await openCheckout(page)
    await page.evaluate(() => window.__mock!.setScenario('payment-pending'))
    await page.getByTestId('connect-wallet').click()
    await expect(page.getByTestId('wallet-status')).toBeVisible()
    await page.getByTestId('confirm-order').click()
    await expect(page.getByRole('heading', { name: /pedido pendente/i })).toBeVisible({ timeout: 20_000 })
    const orderId = await page.getByTestId('order-id').innerText()

    // Sem polling: a confirmação só pode chegar pelo evento order.updated.
    await page.evaluate(
      (id) => window.__mock!.failNext({ method: 'GET', path: `/api/orders/${id}`, status: 500, code: 'internal', retryable: false, times: 100 }),
      orderId,
    )
    await expect.poll(() => page.evaluate(() => window.__kurioSocket?.connected ?? false)).toBe(true)
    await page.evaluate((id) => window.__mock!.settleOrder(id, 'confirmed'), orderId)

    await expect(page.getByRole('heading', { name: /pedido confirmado/i })).toBeVisible({ timeout: 4_000 })
    await expect(page.getByTestId('order-id')).toHaveText(orderId)
  })
})
