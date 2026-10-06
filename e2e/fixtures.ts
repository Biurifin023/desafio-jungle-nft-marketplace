import { test as base, expect, type Page } from '@playwright/test'

export const CREDENTIALS = {
  ana: { email: 'ana@kurio.dev', password: 'Kurio@2026' },
  bruno: { email: 'bruno@kurio.dev', password: 'Kurio@2026' },
} as const

async function waitForMocks(page: Page) {
  await page.waitForFunction(() => Boolean(window.__mock), undefined, { timeout: 15_000 })
}

export async function resetScenario(page: Page, scenarioId = 'fast') {
  await page.goto(`/?scenario=${scenarioId}`)
  await waitForMocks(page)
}

export async function loginAs(page: Page, who: keyof typeof CREDENTIALS = 'ana') {
  const { email, password } = CREDENTIALS[who]
  await page.evaluate(async ({ email: e, password: p }) => {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e, password: p }),
    })
    const data = (await res.json()) as { token: string; user: unknown; expiresAt: string }
    localStorage.setItem('kurio.session', JSON.stringify({ token: data.token, user: data.user, expiresAt: data.expiresAt }))
  }, { email, password })
}

export async function seedGuestCart(
  page: Page,
  items: { nftId: string; editionId: string; quantity: number }[],
) {
  await page.waitForFunction(() => {
    try {
      return Boolean(JSON.parse(localStorage.getItem('kurio.guestCartId') ?? 'null'))
    } catch {
      return false
    }
  })
  await page.evaluate(async (payload) => {
    const guestId = JSON.parse(localStorage.getItem('kurio.guestCartId') ?? 'null') as string | null
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (guestId) headers['X-Guest-Cart'] = guestId
    for (const item of payload) {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers,
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { cart: { id: string } }
      localStorage.setItem('kurio.guestCartId', JSON.stringify(data.cart.id))
      headers['X-Guest-Cart'] = data.cart.id
    }
  }, items)
}

export async function seedUserCart(
  page: Page,
  items: { nftId: string; editionId: string; quantity: number }[],
) {
  await page.evaluate(async (payload) => {
    const raw = localStorage.getItem('kurio.session')
    if (!raw) throw new Error('Sessão ausente para semear o carrinho')
    const session = JSON.parse(raw) as { token: string }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
    }
    for (const item of payload) {
      const res = await fetch('/api/cart/items', { method: 'POST', headers, body: JSON.stringify(item) })
      if (!res.ok) throw new Error(await res.text())
    }
  }, items)
}

export const CART_EMERALD = { nftId: 'emerald-ape-042', editionId: '1-50', quantity: 2 }

export async function openCheckout(page: Page, scenarioId = 'fast') {
  await resetScenario(page, scenarioId)
  await loginAs(page, 'ana')
  await seedUserCart(page, [CART_EMERALD])
  await page.goto('/checkout')
}

export const test = base

export { expect }
