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

export const test = base

export { expect }
