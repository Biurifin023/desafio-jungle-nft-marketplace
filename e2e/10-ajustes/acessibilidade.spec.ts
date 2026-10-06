import type { Page } from '@playwright/test'
import { expect, resetScenario, seedGuestCart, test } from '../fixtures'

async function waitForSocket(page: Page) {
  await expect.poll(() => page.evaluate(() => window.__kurioSocket?.connected ?? false)).toBe(true)
}

test.describe('acessibilidade', () => {
  test('abas do catálogo: setas, Home e End trocam a aba e o foco', async ({ page }) => {
    await resetScenario(page, 'fast')
    const tabs = page.getByRole('tablist', { name: 'Aba do catálogo' })
    const all = tabs.getByRole('tab', { name: 'Todos os NFTs' })
    await expect(all).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('tabindex', '-1')

    await all.focus()
    await page.keyboard.press('ArrowRight')
    const fresh = tabs.getByRole('tab', { name: 'Novos lançamentos' })
    await expect(fresh).toBeFocused()
    await expect(fresh).toHaveAttribute('aria-selected', 'true')
    await expect(page).toHaveURL(/tab=new/)

    await page.keyboard.press('End')
    await expect(tabs.getByRole('tab', { name: 'Em alta' })).toBeFocused()
    await expect(page).toHaveURL(/tab=trending/)

    await page.keyboard.press('ArrowRight')
    await expect(all).toBeFocused()
    await expect(page).toHaveURL(/tab=all/)
  })

  test('edições: setas mudam a seleção e pulam a edição esgotada', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/nft/emerald-ape-042')
    const group = page.getByRole('radiogroup', { name: 'Edição' })
    const selected = group.getByRole('radio', { name: '1/50' })
    await expect(selected).toHaveAttribute('aria-checked', 'true')

    await selected.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(group.getByRole('radio', { name: '1/10' })).toBeFocused()
    await expect(group.getByRole('radio', { name: '1/10' })).toHaveAttribute('aria-checked', 'true')

    await page.keyboard.press('ArrowLeft')
    await expect(group.getByRole('radio', { name: 'ABERTA' })).toBeFocused()
    await expect(group.getByRole('radio', { name: 'ABERTA' })).toHaveAttribute('aria-checked', 'true')

    await page.keyboard.press('Home')
    await expect(group.getByRole('radio', { name: '1/10' })).toHaveAttribute('aria-checked', 'true')
  })

  test('faixa de preço: pontos do slider têm nome e valor em português', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Filtros ficam na gaveta no mobile; o componente é o mesmo.')
    await resetScenario(page, 'fast')
    const min = page.getByRole('slider', { name: 'Preço mínimo' })
    const max = page.getByRole('slider', { name: 'Preço máximo' })
    await expect(min).toHaveAttribute('aria-valuetext', /ETH$/)
    await expect(max).toHaveAttribute('aria-valuetext', /ETH$/)
  })

  test('destaques: troca automática pode ser pausada', async ({ page }) => {
    test.setTimeout(60_000)
    await resetScenario(page, 'fast')
    const pause = page.getByRole('button', { name: 'Pausar troca automática dos destaques' })
    await expect(pause).toBeVisible()
    const current = page.locator('[aria-label^="Destaque "][aria-current="true"]:visible')
    const first = await current.getAttribute('aria-label')

    await page.mouse.move(0, 0)
    await expect(current).not.toHaveAttribute('aria-label', first!, { timeout: 8_000 })
    const afterAutoplay = await current.getAttribute('aria-label')

    await pause.click()
    const resume = page.getByRole('button', { name: 'Retomar troca automática dos destaques' })
    await expect(resume).toHaveAttribute('aria-pressed', 'true')
    // Sem foco nem mouse no destaque, só a pausa explícita segura a troca.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.mouse.move(0, 0)
    await page.waitForTimeout(7_000)
    await expect(current).toHaveAttribute('aria-label', afterAutoplay!)
  })

  test('destaques: sem troca automática nem botão de pausa com movimento reduzido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await resetScenario(page, 'fast')
    await expect(page.locator('[aria-label^="Destaque "]:visible').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /troca automática dos destaques/ })).toHaveCount(0)
  })

  test('mudança de preço só interrompe o leitor de tela quando o NFT está no carrinho', async ({ page }) => {
    await resetScenario(page, 'fast')
    await waitForSocket(page)
    const assertive = page.getByTestId('live-region-assertive')
    const polite = page.getByTestId('live-region')

    await page.evaluate(() => window.__mock!.updateNft('violet-nomad-314', { editionId: '1-50', priceEth: '2.22' }))
    await page.waitForTimeout(500)
    await expect(assertive).toHaveText('')
    await expect(polite).not.toContainText('mudou')

    await seedGuestCart(page, [{ nftId: 'emerald-ape-042', editionId: '1-50', quantity: 1 }])
    await page.goto('/cart')
    await waitForSocket(page)
    await page.evaluate(() => window.__mock!.updateNft('emerald-ape-042', { editionId: '1-50', priceEth: '1.45' }))
    await expect(assertive).toContainText('do seu carrinho mudou')
  })

  test('mudança de preço do NFT aberto é anunciada de forma educada', async ({ page }) => {
    await resetScenario(page, 'fast')
    await page.goto('/nft/violet-nomad-314')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await waitForSocket(page)

    await page.evaluate(() => window.__mock!.updateNft('violet-nomad-314', { editionId: '1-50', priceEth: '2.22' }))
    await expect(page.getByTestId('live-region')).toContainText('deste colecionável mudou')
    await expect(page.getByTestId('live-region-assertive')).toHaveText('')
  })
})
