import { delay, http, HttpResponse, type DefaultBodyType, type HttpResponseResolver, type PathParams } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/api/contracts'
import { scenarioState, type FailureRule } from './scenarios'

/** Erro de negócio lançado pelos handlers e convertido no envelope padronizado. */
export class ApiFail extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
    readonly details?: unknown,
    readonly retryable = status >= 500 || status === 429,
  ) {
    super(message)
  }
}

export const errorResponse = (
  status: number,
  code: string,
  message: string,
  extra: { fields?: Record<string, string>; details?: unknown; retryable?: boolean } = {},
) =>
  HttpResponse.json(
    {
      error: {
        code: code as ApiErrorCode,
        message,
        retryable: extra.retryable ?? (status >= 500 || status === 429),
        ...(extra.fields ? { fields: extra.fields } : {}),
        ...(extra.details !== undefined ? { details: extra.details } : {}),
      },
    } satisfies ApiErrorBody,
    { status },
  )

/* ---------- PRNG reprodutível para a latência ---------- */
let rngState = 0
let rngSeed = -1
function nextRandom(seed: number) {
  if (seed !== rngSeed) {
    rngSeed = seed
    rngState = seed
  }
  rngState |= 0
  rngState = (rngState + 0x6d2b79f5) | 0
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/* ---------- Contadores (falhas "times", fora de ordem) — zerados no reset ---------- */
const failureHits = new Map<string, number>()
let listRequestCount = 0
const extraFailures: FailureRule[] = []

export const networkState = {
  reset() {
    failureHits.clear()
    extraFailures.length = 0
    listRequestCount = 0
    rngSeed = -1
  },
  /** Falha pontual registrada via `__mock.failNext()`. */
  addFailure(rule: FailureRule) {
    extraFailures.push({ times: 1, ...rule })
  },
}

const ruleKey = (r: FailureRule) => `${r.method} ${r.path} ${r.status} ${r.code}`

function matches(rule: FailureRule, method: string, pathname: string) {
  if (rule.method !== '*' && rule.method !== method) return false
  const pattern = new RegExp(`^${rule.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+')}(/.*)?$`)
  return pattern.test(pathname)
}

function findFailure(method: string, pathname: string): FailureRule | undefined {
  const rules = [...extraFailures, ...scenarioState.active().network.failures]
  for (const rule of rules) {
    if (!matches(rule, method, pathname)) continue
    const key = ruleKey(rule)
    const hits = failureHits.get(key) ?? 0
    if (rule.times !== undefined && hits >= rule.times) continue
    failureHits.set(key, hits + 1)
    if (rule.times !== undefined && extraFailures.includes(rule) && hits + 1 >= rule.times) {
      extraFailures.splice(extraFailures.indexOf(rule), 1)
      failureHits.delete(key)
    }
    return rule
  }
  return undefined
}

async function simulateNetwork(method: string, pathname: string) {
  const { network } = scenarioState.active()
  if (network.timeoutAll) {
    await delay(15_000)
    return
  }
  let ms = network.latency.min + Math.round(nextRandom(network.seed) * (network.latency.max - network.latency.min))
  if (network.outOfOrder && method === 'GET' && pathname === '/api/nfts') {
    listRequestCount++
    ms = listRequestCount % 2 === 1 ? 1800 : 150
  }
  if (ms > 0) await delay(ms)
}

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

/**
 * Registra um handler REST com simulação de rede (latência, offline, timeout, falhas)
 * e conversão de `ApiFail` no envelope de erro.
 */
export function route<Params extends PathParams = PathParams>(
  method: Method,
  path: string,
  resolver: HttpResponseResolver<Params, DefaultBodyType, DefaultBodyType>,
) {
  return http[method]<Params>(`/api${path}`, async (info) => {
    const url = new URL(info.request.url)
    const upper = method.toUpperCase()
    await simulateNetwork(upper, url.pathname)
    if (scenarioState.active().network.offline) return HttpResponse.error()
    const failure = findFailure(upper, url.pathname)
    if (failure) {
      return errorResponse(failure.status, failure.code, failure.message ?? 'Falha simulada.', { retryable: failure.retryable, fields: failure.fields })
    }
    try {
      return await resolver(info)
    } catch (e) {
      if (e instanceof ApiFail) return errorResponse(e.status, e.code, e.message, { fields: e.fields, details: e.details, retryable: e.retryable })
      if (e instanceof Response) return e
      console.error('[mocks] erro no handler', e)
      return errorResponse(500, 'internal', 'Erro interno simulado.')
    }
  })
}

export async function readJson<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new ApiFail(400, 'validation_error', 'Corpo da requisição inválido.')
  }
}

/** Converte issues do zod em `{ campo: mensagem }`. */
export function zodFields(issues: { path: PropertyKey[]; message: string }[]) {
  const fields: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || '_'
    fields[key] ??= issue.message
  }
  return fields
}
