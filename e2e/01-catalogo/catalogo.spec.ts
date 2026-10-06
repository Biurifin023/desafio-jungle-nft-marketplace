import type { Page } from '@playwright/test'
import { expect, resetScenario, test } from '../fixtures'

function isMobile(projectName: string) {
  return projectName.includes('mobile')
}

async function openFilters(page: Page, projectName: string) {
  if (isMobile(projectName)) {
    await page.getByRole('button', { name: /abrir filtros/i }).click()
    await expect(page.getByRole('dialog', { name: /filtros/i })).toBeVisible()
  }
}

async function closeFilters(page: Page, projectName: string) {
  if (!isMobile(projectName)) return
  const dialog = page.getByRole('dialog', { name: /filtros/i })
  await dialog.getByRole('button', { name: /fechar/i }).click()
  await expect(dialog).toBeHidden()
}

async function chooseSort(page: Page, projectName: string, option: RegExp) {
  await openFilters(page, projectName)
  await page.getByRole('combobox', { name: 'Ordenar por' }).last().click()
  await page.getByRole('option', { name: option }).click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await closeFilters(page, projectName)
}

async function searchCatalog(page: Page, projectName: string, term: string) {
  if (isMobile(projectName)) {
    const input = page.getByPlaceholder('Explorar coleções')
    await input.fill(term)
    await input.press('Enter')
    return
  }
  await page.getByRole('button', { name: /buscar nfts/i }).click()
  await page.getByLabel(/termo de busca/i).fill(term)
  await page.getByRole('button', { name: /^buscar$/i }).click()
}

test.describe('catálogo', () => {
  test('busca q altera a URL e os resultados', async ({ page }, info) => {
    await resetScenario(page, 'fast')
    await expect(page.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible()

    await searchCatalog(page, info.project.name, 'Neon Vessel')

    await expect(page).toHaveURL(/q=Neon/)
    await expect(page.getByRole('link', { name: /neon vessel #552/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /emerald ape #042/i })).toHaveCount(0)
  })

  test('filtros combinados (categoria + rede) e reset de página', async ({ page }, info) => {
    await resetScenario(page, 'fast')
    await expect(page.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible()

    await page.getByRole('link', { name: /página 2/i }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: /emerald ape #042/i })).toHaveCount(0)

    await openFilters(page, info.project.name)
    await page.getByRole('button', { name: /arte digital/i }).click()
    await page.getByRole('button', { name: /^ethereum/i }).click()
    await closeFilters(page, info.project.name)

    await expect(page).toHaveURL(/arte-digital/)
    await expect(page).toHaveURL(/ethereum/)
    await expect(page).not.toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible()
  })

  test('ordenação price-asc e price-desc', async ({ page }, info) => {
    await resetScenario(page, 'fast')
    await expect(page.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible()

    await chooseSort(page, info.project.name, /menor preço/i)
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect(page.getByRole('link', { name: /copper relic #002/i })).toBeVisible()

    await chooseSort(page, info.project.name, /maior preço/i)
    await expect(page).toHaveURL(/sort=price-desc/)
    await expect(page.getByRole('link', { name: /grand curator #999/i })).toBeVisible()
  })

  test('paginação e voltar do histórico restaura a query', async ({ page }, info) => {
    await resetScenario(page, 'fast')
    await searchCatalog(page, info.project.name, 'Golden')
    await expect(page).toHaveURL(/q=Golden/)
    const grid = page.getByTestId('nft-grid')
    await expect(grid.getByRole('link', { name: /golden beat #207/i })).toBeVisible()

    await page.getByRole('link', { name: /página 2/i }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page).toHaveURL(/q=Golden/)

    await page.goBack()
    await expect(page).toHaveURL(/q=Golden/)
    await expect(page).not.toHaveURL(/page=2/)
    await expect(grid.getByRole('link', { name: /golden beat #207/i })).toBeVisible()
  })

  test('cenário empty mostra estado vazio', async ({ page }) => {
    await resetScenario(page, 'empty')
    await expect(page.getByRole('status')).toContainText(/nenhum nft encontrado/i)
    await expect(page.getByTestId('nft-grid')).toHaveCount(0)
  })

  test('slow mostra skeleton; server-error mostra erro; retry com flaky recupera', async ({ page }) => {
    await resetScenario(page, 'slow')
    await expect(page.locator('[data-slot="skeleton"]').filter({ visible: true }).first()).toBeVisible()

    await resetScenario(page, 'server-error')
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /tentar novamente/i })).toBeVisible()

    await page.evaluate(() => window.__mock?.setScenario('flaky'))
    await page.getByRole('button', { name: /tentar novamente/i }).click()
    await expect(page.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('sem overflow horizontal', async ({ page }, info) => {
    await resetScenario(page, 'fast')
    await expect(page.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)

    if (!isMobile(info.project.name)) {
      await page.setViewportSize({ width: 768, height: 1024 })
      const overflowTablet = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflowTablet).toBeLessThanOrEqual(1)
    }
  })
})
