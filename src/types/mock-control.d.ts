/**
 * Contrato da API de controle dos mocks exposta em `window.__mock` quando VITE_ENABLE_MOCKS=true.
 * Usada pela página /dev/mocks, pela demonstração e pelos testes Playwright.
 * A UI de produto nunca depende dela.
 */
export interface MockScenarioInfo {
  id: string
  label: string
  description: string
}

export interface MockFailureRule {
  method: string
  path: string
  status: number
  code: string
  message?: string
  retryable?: boolean
  times?: number
}

export interface MockControl {
  scenarios: MockScenarioInfo[]
  scenario(): string
  /** Troca o cenário (persistido). Não recarrega a página. */
  setScenario(id: string): void
  /** Ajusta latência/falhas/regras de negócio do cenário atual. */
  configure(overrides: { network?: Record<string, unknown>; business?: Record<string, unknown> }): void
  /** Falha pontual nas próximas `times` requisições que casarem com a regra. */
  failNext(rule: MockFailureRule): void
  /** Restaura fixtures e cenário (padrão: 'default'); limpa sessão/carrinho do cliente. */
  reset(scenarioId?: string): void
  /** Cópia somente-leitura do estado do banco simulado. */
  state(): unknown
  /** Altera preço/disponibilidade de um NFT e publica `nft.updated`. Retorna o evento. */
  updateNft(nftId: string, patch: { editionId?: string; priceEth?: string; available?: number }): { eventId: string; version: number }
  /** Expira todas as sessões ativas (o próximo request autenticado recebe 401 session_expired). */
  expireSessions(): void
  /** Conclui manualmente um pedido pendente. */
  settleOrder(orderId: string, outcome: 'confirmed' | 'declined'): void
  realtime: {
    /** Reenvia um evento já publicado (duplicata). */
    replay(eventId: string): void
    /** Publica um evento arbitrário (ex.: versão antiga) pelo transporte Socket.IO. */
    emitRaw(event: unknown): void
    history(): { eventId: string; type: string; version: number; resource: { id: string } }[]
    /** Derruba as conexões Socket.IO ativas (o cliente tenta reconectar). */
    disconnect(): void
    /** Bloqueia (true) ou libera (false) novas conexões. */
    setOffline(offline: boolean): void
    connections(): number
  }
}

declare global {
  interface Window {
    __mock?: MockControl
    __mockReady?: Promise<void>
    __kurioSocket?: { connected: boolean; error?: string }
  }
}
