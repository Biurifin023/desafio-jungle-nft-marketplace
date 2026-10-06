import type { Locator, Page } from '@playwright/test'
import { expect, openCheckout, resetScenario, test } from '../fixtures'

const isMobile = (projectName: string) => projectName.includes('mobile')

/** Indicador no próprio elemento ou no contêiner de um campo composto (ex.: busca com ícone). */
async function hasFocusIndicator(locator: Locator) {
  return locator.evaluate((el) => {
    const visible = (node: Element) => {
      const style = getComputedStyle(node)
      const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
      const ring = style.boxShadow !== 'none' && style.boxShadow !== ''
      return outline || ring
    }
    return [el, el.parentElement, el.parentElement?.parentElement].some((node) => node && visible(node))
  })
}

async function expectFocusTrapped(page: Page, container: Locator, presses = 10) {
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab')
    expect(await container.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }
}

async function expectDescribedError(field: Locator) {
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  const describedBy = await field.getAttribute('aria-describedby')
  expect(describedBy).toBeTruthy()
  await expect(field.page().locator(`[id="${describedBy}"]`)).toHaveText(/\S+/)
}

test.describe('11. teclado, foco e validação', () => {
  test('link de pular conteúdo, foco visível e navegação do card por teclado', async ({ page }) => {
    await resetScenario(page, 'fast')
    const card = page.getByRole('link', { name: /emerald ape #042/i }).first()
    await expect(card).toBeVisible()

    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: /pular para o conteúdo/i })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    expect(await hasFocusIndicator(skip)).toBe(true)

    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.querySelector('main')?.contains(document.activeElement))).toBe(true)
    expect(await hasFocusIndicator(page.locator(':focus'))).toBe(true)

    await card.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)
    await expect(page.getByRole('heading', { name: /emerald ape #042/i }).filter({ visible: true })).toBeVisible()
  })

  test('diálogo da galeria prende o foco e devolve ao gatilho', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'o zoom da galeria existe só no desktop')
    await resetScenario(page, 'fast')
    await page.goto('/nft/emerald-ape-042')
    const trigger = page.getByRole('button', { name: /ampliar imagem/i }).filter({ visible: true })
    await expect(trigger).toBeVisible()
    await trigger.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: /emerald ape #042/i })
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    await expectFocusTrapped(page, dialog)

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('login por teclado associa erros aos campos e prende o foco no modal desktop', async ({ page }, info) => {
    await resetScenario(page, 'fast')
    await page.goto('/login')
    const email = page.getByRole('textbox', { name: 'E-mail' })
    const password = page.getByLabel('Senha', { exact: true })

    await email.focus()
    await page.keyboard.type('nao-e-email')
    await page.keyboard.press('Tab')
    await expect(password).toBeFocused()
    await page.keyboard.press('Enter')

    await expectDescribedError(email)
    await expectDescribedError(password)

    if (!isMobile(info.project.name)) {
      await expectFocusTrapped(page, page.getByTestId('auth-modal'))
    }

    const social = page.getByRole('button', { name: /continuar com google/i })
    await social.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: /indisponível/i })
    await expect(dialog).toBeVisible()
    await expectFocusTrapped(page, dialog, 4)
    await dialog.getByRole('button', { name: /entendi/i }).press('Enter')
    await expect(dialog).toHaveCount(0)
    await expect(social).toBeFocused()
  })

  test('drawer de filtros prende o foco e devolve ao gatilho', async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), 'o drawer de filtros existe só no mobile')
    await resetScenario(page, 'fast')
    const trigger = page.getByRole('button', { name: /abrir filtros/i })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: /filtros/i })
    await expect(dialog).toBeVisible()
    await expectFocusTrapped(page, dialog)

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('checkout associa erros de validação aos campos', async ({ page, isMobile }) => {
    test.skip(isMobile, 'O checkout mobile não exibe os dados do colecionador.')
    await openCheckout(page, 'fast')
    const displayName = page.getByLabel('Nome de exibição')
    await displayName.fill('')
    await page.getByTestId('confirm-order').click()
    await expectDescribedError(displayName)
  })
})
