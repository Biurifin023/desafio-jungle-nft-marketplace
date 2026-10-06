import { HttpResponse } from 'msw'
import { LoginInput, RegisterInput } from '@/api/contracts'
import { db } from '../db/store'
import { ApiFail, readJson, route, zodFields } from '../network'
import { scenarioState } from '../scenarios'
import { bearer, createSession, hashPassword, requireUser, sessionFor, verifyPassword } from '../domain/auth'
import { toUser } from '../domain/serializers'

export const sessionHandlers = [
  route('post', '/session', async ({ request }) => {
    const parsed = LoginInput.safeParse(await readJson(request))
    if (!parsed.success) throw new ApiFail(422, 'validation_error', 'Revise os campos destacados.', zodFields(parsed.error.issues))
    const user = db.get().users.find((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase())
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      throw new ApiFail(401, 'unauthorized', 'E-mail ou senha incorretos.', { password: 'E-mail ou senha incorretos' })
    }
    const session = createSession(user.id)
    return HttpResponse.json({ token: session.token, expiresAt: session.expiresAt, user: toUser(user) }, { status: 201 })
  }),

  route('get', '/session', ({ request }) => {
    const user = requireUser(request, { privateResource: false })
    const session = sessionFor(request)!
    return HttpResponse.json({ expiresAt: session.expiresAt, user: toUser(user) })
  }),

  route('delete', '/session', ({ request }) => {
    const token = bearer(request)
    if (token) db.mutate((s) => s.sessions.forEach((x) => x.token === token && (x.revoked = true)))
    return new HttpResponse(null, { status: 204 })
  }),

  route('post', '/accounts', async ({ request }) => {
    const parsed = RegisterInput.safeParse(await readJson(request))
    if (!parsed.success) throw new ApiFail(422, 'validation_error', 'Revise os campos destacados.', zodFields(parsed.error.issues))
    const input = parsed.data
    const business = scenarioState.active().business
    if (business.validationErrors) {
      throw new ApiFail(422, 'validation_error', 'Revise os campos destacados.', { username: 'Este nome de usuário é reservado' })
    }
    if (business.registerConflict || db.get().users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new ApiFail(409, 'email_taken', 'Já existe uma conta com este e-mail.', { email: 'Já existe uma conta com este e-mail' })
    }
    if (db.get().users.some((u) => u.username === input.username)) {
      throw new ApiFail(409, 'username_taken', 'Este nome de usuário já está em uso.', { username: 'Este nome de usuário já está em uso' })
    }
    const id = db.nextId('usr')
    const now = new Date().toISOString()
    const passwordHash = await hashPassword(input.password)
    const user = {
      id,
      email: input.email,
      username: input.username,
      displayName: input.username,
      avatarUrl: null,
      ensName: input.username.replace(/[^a-z0-9-]/g, '-'),
      walletNickname: 'Principal',
      passwordHash,
      updatedAt: now,
      version: 1,
    }
    db.mutate((s) => {
      s.users.push(user)
      s.favorites[id] = []
      s.wallets[id] = { primary: null, secondary: null }
    })
    const session = createSession(id)
    return HttpResponse.json({ token: session.token, expiresAt: session.expiresAt, user: toUser(user) }, { status: 201 })
  }),
]
