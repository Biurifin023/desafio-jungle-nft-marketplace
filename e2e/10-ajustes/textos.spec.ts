import { expect, resetScenario, seedGuestCart, test } from '../fixtures'

test.describe('textos', () => {
  test('carrinho com 1 item usa o singular no atalho (header no desktop, barra inferior no mobile)', async ({ page }) => {
    await resetScenario(page, 'fast')
    await seedGuestCart(page, [{ nftId: 'emerald-ape-042', editionId: '1-50', quantity: 1 }])
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Carrinho, 1 item', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Carrinho, 1 itens' })).toHaveCount(0)
  })

  test('telefone do rodapé disca o mesmo número exibido', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'O layout mobile não exibe o rodapé completo.')
    await resetScenario(page, 'fast')
    const phone = page.getByRole('link', { name: '+55 11 4002 8922' })
    await expect(phone).toHaveAttribute('href', 'tel:+551140028922')
  })

  test('resumo do carrinho e royalties do detalhe', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'O título do resumo e a aba de detalhes são do layout desktop.')
    await resetScenario(page, 'fast')
    await seedGuestCart(page, [{ nftId: 'emerald-ape-042', editionId: '1-50', quantity: 1 }])
    await page.goto('/cart')
    await expect(page.getByText('Resumo do pedido')).toBeVisible()

    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByText('Royalties:')).toBeVisible()
    await expect(page.getByText(/direitos autorais/i)).toHaveCount(0)
  })
})
