/**
 * Configuração versionada da auditoria Lighthouse.
 * Lida por `scripts/lighthouse.ts` (pnpm lighthouse) e compatível com `lhci autorun`.
 * Build otimizado (`pnpm build:demo`) servido por `vite preview`, mocks no cenário padrão.
 */
const baseURL = process.env.LH_BASE_URL ?? 'http://127.0.0.1:4173'

module.exports = {
  ci: {
    collect: {
      url: [`${baseURL}/?scenario=default`, `${baseURL}/nft/emerald-ape-042?scenario=default`],
      numberOfRuns: 3,
      startServerCommand: 'pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
      startServerReadyPattern: 'Local',
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        chromeFlags: '--headless --no-sandbox',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9, aggregationMethod: 'median' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median' }],
        'categories:seo': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
      },
    },
  },
}
