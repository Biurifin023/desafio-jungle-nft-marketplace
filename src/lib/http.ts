import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { ApiErrorBody, type ApiErrorCode } from '@/api/contracts'
import { sessionStore } from '@/features/session/session-store'
import { guestCart } from '@/features/cart/guest-cart'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'
export const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 8000)

/**
 * Erro normalizado de toda chamada REST. A UI decide pelo `code`/`kind`, nunca por string.
 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly kind: 'http' | 'network' | 'timeout' | 'canceled' | 'contract',
    readonly status: number | null,
    readonly code: ApiErrorCode | 'network' | 'timeout' | 'canceled' | 'contract',
    readonly retryable: boolean,
    readonly fields: Record<string, string> = {},
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export const isApiError = (e: unknown): e is ApiRequestError => e instanceof ApiRequestError

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = sessionStore.token()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  const guestId = guestCart.id()
  if (guestId) config.headers.set('X-Guest-Cart', guestId)
  return config
})

http.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    throw normalize(error)
  },
)

function normalize(error: AxiosError): ApiRequestError {
  if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
    return new ApiRequestError('Requisição cancelada', 'canceled', null, 'canceled', false)
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiRequestError('A requisição demorou demais para responder.', 'timeout', null, 'timeout', true)
  }
  if (!error.response) {
    return new ApiRequestError('Sem conexão com o servidor. Verifique sua internet.', 'network', null, 'network', true)
  }
  const { status, data } = error.response
  const parsed = ApiErrorBody.safeParse(data)
  const body = parsed.success
    ? parsed.data.error
    : { code: status >= 500 ? ('internal' as const) : ('conflict' as const), message: 'Erro inesperado.', retryable: status >= 500, fields: undefined, details: undefined }

  const sentToken = Boolean(error.config?.headers?.Authorization)
  if (status === 401 && sentToken) sessionStore.expire()

  return new ApiRequestError(body.message, 'http', status, body.code, body.retryable, body.fields ?? {}, body.details)
}

/** Executa a requisição e valida a resposta contra o contrato zod. */
export async function request<S extends z.ZodType>(schema: S, config: AxiosRequestConfig): Promise<z.infer<S>> {
  const res = await http.request(config)
  if (res.status === 204) return undefined as z.infer<S>
  const parsed = schema.safeParse(res.data)
  if (!parsed.success) {
    if (import.meta.env.DEV) console.error('Contrato violado', config.url, parsed.error.issues)
    throw new ApiRequestError('Resposta fora do contrato.', 'contract', res.status, 'contract', false, {}, parsed.error.issues)
  }
  return parsed.data
}
