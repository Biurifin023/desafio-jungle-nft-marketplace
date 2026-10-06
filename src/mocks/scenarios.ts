/**
 * Cenários determinísticos dos mocks. Selecionáveis por `?scenario=<id>`, pelo
 * localStorage (`kurio.mock.scenario`) ou por `window.__mock.setScenario(id)`.
 */

export interface FailureRule {
  /** Método HTTP ou '*' */
  method: string
  /** Prefixo do caminho, ex.: '/api/nfts' (aceita '*' como curinga de segmento). */
  path: string
  status: number
  code: string
  message?: string
  retryable?: boolean
  /** Quantas vezes falhar antes de voltar a responder normalmente (padrão: sempre). */
  times?: number
}

export interface NetworkConfig {
  /** Latência mínima/máxima em ms. A sequência é gerada por PRNG com `seed` (reprodutível). */
  latency: { min: number; max: number }
  seed: number
  offline: boolean
  /** Atraso que excede o timeout do cliente (8 s) em todas as rotas. */
  timeoutAll: boolean
  /** Alterna respostas lentas/rápidas em GET /api/nfts para gerar respostas fora de ordem. */
  outOfOrder: boolean
  failures: FailureRule[]
}

export interface BusinessConfig {
  catalogEmpty: boolean
  /** TTL da sessão em segundos. */
  sessionTtlSeconds: number
  forbiddenPrivate: boolean
  registerConflict: boolean
  validationErrors: boolean
  /** Na primeira tentativa de pedido, o preço do 1º item sobe (nft.updated) e a cotação fica obsoleta. */
  priceChangeOnCheckout: boolean
  /** Na primeira tentativa de pedido, a edição do 1º item esgota. */
  soldOutOnCheckout: boolean
  /** A primeira criação de pedido grava o pedido mas a resposta só chega após o timeout. */
  orderTimeoutAfterCreate: boolean
  paymentOutcome: 'confirmed' | 'declined' | 'manual'
  /** Tempo até a simulação concluir o pagamento. */
  paymentDelayMs: number
  walletRejects: boolean
}

export interface Scenario {
  id: string
  label: string
  description: string
  network: NetworkConfig
  business: BusinessConfig
}

const DEFAULT_NETWORK: NetworkConfig = {
  latency: { min: 120, max: 380 },
  seed: 42,
  offline: false,
  timeoutAll: false,
  outOfOrder: false,
  failures: [],
}

const DEFAULT_BUSINESS: BusinessConfig = {
  catalogEmpty: false,
  sessionTtlSeconds: 2 * 60 * 60,
  forbiddenPrivate: false,
  registerConflict: false,
  validationErrors: false,
  priceChangeOnCheckout: false,
  soldOutOnCheckout: false,
  orderTimeoutAfterCreate: false,
  paymentOutcome: 'confirmed',
  paymentDelayMs: 2500,
  walletRejects: false,
}

const scenario = (
  id: string,
  label: string,
  description: string,
  network: Partial<NetworkConfig> = {},
  business: Partial<BusinessConfig> = {},
): Scenario => ({
  id,
  label,
  description,
  network: { ...DEFAULT_NETWORK, ...network },
  business: { ...DEFAULT_BUSINESS, ...business },
})

export const SCENARIOS: Scenario[] = [
  scenario('default', 'Padrão', 'Latência curta e reprodutível; todas as operações têm sucesso e o pagamento confirma em ~2,5 s.'),
  scenario('fast', 'Sem latência', 'Respostas imediatas (usado na regressão visual e no Lighthouse quando indicado).', { latency: { min: 0, max: 0 } }),
  scenario('slow', 'Rede lenta', 'Todas as respostas levam 3 s (skeletons visíveis).', { latency: { min: 3000, max: 3000 } }),
  scenario('variable-latency', 'Latência variável', 'Latência entre 100 ms e 2,5 s, gerada com seed fixa.', { latency: { min: 100, max: 2500 } }),
  scenario('out-of-order', 'Respostas fora de ordem', 'GET /api/nfts alterna 1,8 s e 150 ms: respostas antigas chegam depois das novas.', { outOfOrder: true }),
  scenario('offline', 'Sem conexão', 'Todas as requisições falham por erro de rede.', { offline: true }),
  scenario('timeout', 'Timeout', 'Todas as requisições excedem o timeout do cliente.', { timeoutAll: true }),
  scenario('server-error', 'Erro 500 no catálogo', 'Catálogo e detalhe respondem 500 até a troca de cenário.', {
    failures: [
      { method: 'GET', path: '/api/nfts', status: 500, code: 'internal', message: 'Falha interna no catálogo.', retryable: true },
    ],
  }),
  scenario('flaky', 'Falha transitória', 'A primeira chamada do catálogo, detalhe e carrinho responde 503; a nova tentativa funciona.', {
    failures: [
      { method: 'GET', path: '/api/nfts', status: 503, code: 'transient', message: 'Serviço temporariamente indisponível.', retryable: true, times: 1 },
      { method: 'GET', path: '/api/cart', status: 503, code: 'transient', message: 'Serviço temporariamente indisponível.', retryable: true, times: 1 },
    ],
  }),
  scenario('empty', 'Catálogo vazio', 'A listagem não retorna resultados.', {}, { catalogEmpty: true }),
  scenario('session-expired', 'Sessão expira', 'Sessões expiram 60 s após o login.', {}, { sessionTtlSeconds: 60 }),
  scenario('unauthorized', 'Acesso negado', 'Rotas privadas (/api/me/*, /api/orders) respondem 403.', {}, { forbiddenPrivate: true }),
  scenario('register-conflict', 'Conflito de cadastro', 'Todo cadastro responde 409 (e-mail em uso).', {}, { registerConflict: true }),
  scenario('validation-error', 'Erro de validação da API', 'Cadastro, perfil e carteiras retornam 422 com erros por campo.', {}, { validationErrors: true }),
  scenario('favorites-fail', 'Falha ao favoritar', 'Incluir/remover favorito responde 500 (rollback otimista).', {
    failures: [{ method: 'PUT', path: '/api/me/favorites', status: 500, code: 'internal', message: 'Não foi possível salvar o favorito.', retryable: true }, { method: 'DELETE', path: '/api/me/favorites', status: 500, code: 'internal', message: 'Não foi possível remover o favorito.', retryable: true }],
  }),
  scenario('price-changed', 'Preço alterado na compra', 'Na primeira tentativa de pedido o preço do 1º item sobe e a cotação fica obsoleta.', {}, { priceChangeOnCheckout: true }),
  scenario('sold-out', 'Edição esgota na compra', 'Na primeira tentativa de pedido a edição do 1º item esgota.', {}, { soldOutOnCheckout: true }),
  scenario('order-timeout', 'Timeout após criar pedido', 'O pedido é criado, mas a resposta excede o timeout; a nova tentativa recupera o mesmo pedido.', {}, { orderTimeoutAfterCreate: true }),
  scenario('payment-declined', 'Pagamento recusado', 'Pedidos são recusados pela simulação.', {}, { paymentOutcome: 'declined' }),
  scenario('payment-pending', 'Pagamento pendente', 'Pedidos ficam pendentes até `__mock.settleOrder(id)`.', {}, { paymentOutcome: 'manual' }),
  scenario('wallet-rejected', 'Carteira recusa conexão', 'A conexão da carteira no checkout é recusada.', {}, { walletRejects: true }),
]

const SCENARIO_KEY = 'kurio.mock.scenario'
const OVERRIDES_KEY = 'kurio.mock.overrides'

export const findScenario = (id: string | null | undefined) => SCENARIOS.find((s) => s.id === id)

export interface ScenarioOverrides {
  network?: Partial<NetworkConfig>
  business?: Partial<BusinessConfig>
}

function readOverrides(): ScenarioOverrides {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? '{}') as ScenarioOverrides
  } catch {
    return {}
  }
}

export const scenarioState = {
  activeId(): string {
    return findScenario(localStorage.getItem(SCENARIO_KEY))?.id ?? 'default'
  },
  active(): Scenario {
    const base = findScenario(scenarioState.activeId()) ?? SCENARIOS[0]!
    const o = readOverrides()
    return { ...base, network: { ...base.network, ...o.network }, business: { ...base.business, ...o.business } }
  },
  set(id: string) {
    if (!findScenario(id)) throw new Error(`Cenário desconhecido: ${id}`)
    localStorage.setItem(SCENARIO_KEY, id)
    localStorage.removeItem(OVERRIDES_KEY)
  },
  override(o: ScenarioOverrides) {
    const current = readOverrides()
    localStorage.setItem(
      OVERRIDES_KEY,
      JSON.stringify({ network: { ...current.network, ...o.network }, business: { ...current.business, ...o.business } }),
    )
  },
  clearOverrides() {
    localStorage.removeItem(OVERRIDES_KEY)
  },
}
