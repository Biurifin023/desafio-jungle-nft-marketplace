import { expect, resetScenario, seedGuestCart, test } from '../fixtures'

const EMERALD = { nftId: 'emerald-ape-042', editionId: '1-50', quantity: 2 }
const VIOLET = { nftId: 'violet-nomad-314', editionId: '1-50', quantity: 1 }

async function openSeededCart(page: Parameters<typeof seedGuestCart>[0], items = [EMERALD]) {
  await resetScenario(page, 'fast')
  await seedGuestCart(page, items)
  await page.goto('/cart')
}

test.describe('carrinho', () => {
  test('mostra estado vazio', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/cart')
    await expect(page.getByTestId('cart-empty')).toBeVisible()
    await expect(page.getByText(/seu carrinho está vazio/i)).toBeVisible()
  })

  test('lista itens, altera quantidade, remove e persiste após refresh', async ({ page }) => {
    await openSeededCart(page, [EMERALD, VIOLET])

    const emerald = page.getByTestId('cart-item').filter({ hasText: 'Emerald Ape #042' })
    const violet = page.getByTestId('cart-item').filter({ hasText: 'Violet Nomad #314' })

    await expect(emerald).toBeVisible()
    await expect(violet).toBeVisible()
    await expect(emerald.getByTestId('cart-item-qty')).toHaveText('2')
    await expect(page.getByTestId('cart-subtotal')).toHaveText('3.77 ETH')
    await expect(page.getByTestId('cart-fee')).toHaveText('0.016 ETH')
    await expect(page.getByTestId('cart-total')).toHaveText('3.786 ETH')

    await emerald.getByRole('button', { name: /aumentar quantidade de emerald ape #042/i }).click()
    await expect(emerald.getByTestId('cart-item-qty')).toHaveText('3')
    await expect(page.getByTestId('cart-subtotal')).toHaveText('4.96 ETH')
    await expect(page.getByTestId('cart-total')).toHaveText('4.976 ETH')

    await emerald.getByRole('button', { name: /diminuir quantidade de emerald ape #042/i }).click()
    await expect(emerald.getByTestId('cart-item-qty')).toHaveText('2')
    await expect(page.getByTestId('cart-total')).toHaveText('3.786 ETH')

    await violet.getByRole('button', { name: /remover violet nomad #314/i }).click()
    await expect(violet).toHaveCount(0)
    await expect(page.getByTestId('cart-subtotal')).toHaveText('2.38 ETH')
    await expect(page.getByTestId('cart-total')).toHaveText('2.396 ETH')

    await page.reload()
    await expect(page.getByTestId('cart-item').filter({ hasText: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByTestId('cart-item').filter({ hasText: 'Violet Nomad #314' })).toHaveCount(0)
    await expect(page.getByTestId('cart-item-qty')).toHaveText('2')
    await expect(page.getByTestId('cart-total')).toHaveText('2.396 ETH')

    await page.getByRole('button', { name: /remover emerald ape #042/i }).click()
    await expect(page.getByTestId('cart-empty')).toBeVisible()
  })

  test('aplica cupom válido e rejeita inválido ou expirado', async ({ page }) => {
    await openSeededCart(page, [EMERALD])
    await expect(page.getByTestId('cart-total')).toHaveText('2.396 ETH')
    await expect(page.getByTestId('cart-discount')).toHaveText('(-) 00.00')

    const input = page.getByTestId('cart-coupon-input')
    await input.fill('FOO')
    await page.getByTestId('cart-coupon-apply').click()
    await expect(page.getByTestId('cart-coupon-error')).toContainText(/inválido/i)
    await expect(page.getByTestId('cart-total')).toHaveText('2.396 ETH')

    await input.fill('GENESIS')
    await page.getByTestId('cart-coupon-apply').click()
    await expect(page.getByTestId('cart-coupon-error')).toContainText(/expirou/i)
    await expect(page.getByTestId('cart-total')).toHaveText('2.396 ETH')

    await input.fill('KURIO10')
    await page.getByTestId('cart-coupon-apply').click()
    await expect(page.getByText(/cupom kurio10 aplicado/i)).toBeVisible()
    await expect(page.getByTestId('cart-discount')).toHaveText('(-) 0.238 ETH')
    await expect(page.getByTestId('cart-subtotal')).toHaveText('2.38 ETH')
    await expect(page.getByTestId('cart-total')).toHaveText('2.158 ETH')

    await page.reload()
    await expect(page.getByText(/cupom kurio10 aplicado/i)).toBeVisible()
    await expect(page.getByTestId('cart-total')).toHaveText('2.158 ETH')
  })

  test('cta Ir para pagamento redireciona visitante ao login', async ({ page }) => {
    await openSeededCart(page, [EMERALD])
    await expect(page.getByTestId('cart-total')).toBeVisible()
    await page.getByRole('link', { name: /ir para pagamento/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('exibe skeleton no resumo no cenário slow', async ({ page }) => {
    await resetScenario(page, 'fast')
    await seedGuestCart(page, [EMERALD])
    await page.evaluate(() => window.__mock!.setScenario('slow'))
    await page.goto('/cart')
    await expect(page.getByTestId('quote-skeleton')).toBeVisible()
    await expect(page.getByTestId('cart-total')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('cart-total')).toHaveText('2.396 ETH')
  })
})
