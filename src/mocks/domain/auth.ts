import { db } from '../db/store'
import type { UserRecord } from '../db/schema'
import { ApiFail } from '../network'
import { scenarioState } from '../scenarios'

async function sha256(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt = crypto.randomUUID().slice(0, 12)) {
  return `sha256$${salt}$${await sha256(`${salt}:${password}`)}`
}

export async function verifyPassword(password: string, stored: string) {
  const [, salt, hex] = stored.split('$')
  if (!salt || !hex) return false
  return (await sha256(`${salt}:${password}`)) === hex
}

export function createSession(userId: string) {
  const ttl = scenarioState.active().business.sessionTtlSeconds
  const now = Date.now()
  const token = `tok_${crypto.randomUUID().replace(/-/g, '')}`
  const session = {
    token,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl * 1000).toISOString(),
    revoked: false,
  }
  db.mutate((s) => {
    s.sessions = s.sessions.filter((x) => Date.parse(x.expiresAt) > now && !x.revoked)
    s.sessions.push(session)
  })
  return session
}

export function bearer(request: Request) {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

/** Sessão válida ou `null`; lança 401 se o token existe mas expirou/foi revogado. */
export function optionalUser(request: Request): UserRecord | null {
  const token = bearer(request)
  if (!token) return null
  const session = db.get().sessions.find((s) => s.token === token)
  if (!session || session.revoked) throw new ApiFail(401, 'unauthorized', 'Sessão inválida. Entre novamente.')
  if (Date.parse(session.expiresAt) <= Date.now()) throw new ApiFail(401, 'session_expired', 'Sua sessão expirou. Entre novamente.')
  const user = db.get().users.find((u) => u.id === session.userId)
  if (!user) throw new ApiFail(401, 'unauthorized', 'Sessão inválida. Entre novamente.')
  return user
}

export function requireUser(request: Request, { privateResource = true } = {}): UserRecord {
  const user = optionalUser(request)
  if (!user) throw new ApiFail(401, 'unauthorized', 'Entre para continuar.')
  if (privateResource && scenarioState.active().business.forbiddenPrivate) {
    throw new ApiFail(403, 'forbidden', 'Você não tem permissão para acessar este recurso.')
  }
  return user
}

export function sessionFor(request: Request) {
  const token = bearer(request)
  return token ? db.get().sessions.find((s) => s.token === token) : undefined
}
