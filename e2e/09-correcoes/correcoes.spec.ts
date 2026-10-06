import { CART_EMERALD, expect, loginAs, openCheckout, resetScenario, seedUserCart, test } from '../fixtures'

const isMobile = (project: string) => project.includes('mobile')
const HOME_URL = /^https?:\/\/[^/]+\/(\?.*)?$/

test.describe('search params inválidos na Home', () => {
  test('valores inválidos são descartados sem derrubar a rota', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/?page=0&categories=foo,arte-digital&minPrice=abc&sort=xyz')
    await expect(page.getByTestId('nft-grid')).toBeVisible()
    await expect(page.getByRole('button', { name: /tentar novamente/i })).toHaveCount(0)

    await page.goto(`/?q=${'x'.repeat(120)}`)
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await expect(page.getByRole('button', { name: /tentar novamente/i })).toHaveCount(0)
  })
})

test.describe('checkout: carteira conectada', () => {
  test('trocar de carteira exige conectar de novo', async ({ page }) => {
    await openCheckout(page, 'fast')
    await page.getByTestId('connect-wallet').click()
    await expect(page.getByTestId('wallet-status')).toBeVisible()

    await page.getByLabel('Carteira').selectOption({ index: 2 })
    await expect(page.getByTestId('wallet-status')).toHaveCount(0)
    await page.getByTestId('confirm-order').click()
    await expect(page.getByText('Conecte a carteira antes de confirmar')).toBeVisible()
    await expect(page).toHaveURL(/\/checkout/)
  })
})

test.describe('checkout: rascunho por usuário', () => {
  test('o rascunho de um usuário não aparece para outro', async ({ page }) => {
    await openCheckout(page, 'fast')
    await page.getByLabel('Nome de exibição').fill('Ana Rascunho')

    await loginAs(page, 'bruno')
    await seedUserCart(page, [CART_EMERALD])
    await page.goto('/checkout')
    const displayName = page.getByLabel('Nome de exibição')
    await expect(displayName).not.toHaveValue('')
    await expect(displayName).not.toHaveValue('Ana Rascunho')
  })

  test('sair apaga o rascunho e a tentativa da aba', async ({ page }) => {
    await openCheckout(page, 'fast')
    await page.getByLabel('Nome de exibição').fill('Ana Rascunho')
    await page.goto('/profile')
    await page.getByTestId('logout').click()
    await expect(page).toHaveURL(HOME_URL)
    const stored = await page.evaluate(() => [sessionStorage.getItem('kurio.checkoutDraft'), sessionStorage.getItem('kurio.checkoutAttempt')])
    expect(stored).toEqual([null, null])
  })
})

test.describe('checkout: idempotência após resposta perdida', () => {
  test('409 de idempotência recupera o pedido já criado em vez de travar', async ({ page }) => {
    await openCheckout(page, 'fast')
    await page.evaluate(() => window.__mock!.setScenario('payment-pending'))
    const walletId = await page.getByLabel('Carteira').inputValue()

    // Simula uma tentativa cujo pedido foi criado mas cuja resposta nunca chegou ao cliente.
    const createdId = await page.evaluate(async (wallet) => {
      const { token, user } = JSON.parse(localStorage.getItem('kurio.session')!) as { token: string; user: { id: string } }
      const auth = { Authorization: `Bearer ${token}` }
      const quote = (await (await fetch('/api/quote?network=ethereum', { headers: auth })).json()) as { quote: { id: string } }
      const body = {
        quoteId: quote.quote.id,
        walletId: wallet,
        network: 'ethereum',
        collector: {
          displayName: 'Ana Colecionadora',
          username: 'ana.kurio',
          profileName: 'Ana Colecionadora',
          email: 'ana@kurio.dev',
          referralCode: 'KURIO1',
          ensName: 'ana',
          note: '',
        },
      }
      const key = crypto.randomUUID()
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json', 'Idempotency-Key': key },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const { order } = (await res.json()) as { order: { id: string } }
      sessionStorage.setItem('kurio.checkoutAttempt', JSON.stringify({ userId: user.id, key, body }))
      return order.id
    }, walletId)

    await page.getByTestId('connect-wallet').click()
    await expect(page.getByTestId('wallet-status')).toBeVisible()
    await page.getByTestId('confirm-order').click()
    await expect(page.getByTestId('order-id')).toHaveText(createdId, { timeout: 20_000 })
    const count = await page.evaluate(() => (window.__mock!.state() as { orders: unknown[] }).orders.length)
    expect(count).toBe(1)
  })
})

test.describe('rotas privadas e fim da sessão', () => {
  test('logout em outra aba leva a rota privada ao login', async ({ page }) => {
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto('/profile')
    await expect(page.getByTestId('logout')).toBeVisible()

    const other = await page.context().newPage()
    await other.goto('/profile')
    await other.getByTestId('logout').click()
    await expect(other).toHaveURL(HOME_URL)

    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/)
    await other.close()
  })

  test('sair pelo menu do header numa rota privada volta para o início', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'o menu de conta do header existe só no desktop')
    await resetScenario(page, 'fast')
    await loginAs(page, 'ana')
    await page.goto('/profile')
    await expect(page.getByTestId('logout')).toBeVisible()
    await page.getByRole('banner').getByRole('button', { name: 'Ana Colecionadora' }).click()
    await page.getByRole('menuitem', { name: /sair/i }).click()
    await expect(page).toHaveURL(HOME_URL)
    await expect(page.getByRole('banner').getByRole('link', { name: /entrar/i }).or(page.getByRole('banner').getByRole('button', { name: /entrar/i }))).toBeVisible()
  })
})
