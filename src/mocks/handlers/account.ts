import { HttpResponse } from 'msw'
import { ChangePasswordInput, ConnectWalletInput, UpdateAvatarInput, UpdateProfileInput, WalletInput, WalletSlot } from '@/api/contracts'
import { db } from '../db/store'
import { ApiFail, readJson, route } from '../network'
import { scenarioState } from '../scenarios'
import { hashPassword, requireUser, verifyPassword } from '../domain/auth'
import { findNft } from '../domain/catalog'
import { toProfile } from '../domain/serializers'
import { parse } from './cart'

const MAX_AVATAR_BYTES = 1024 * 1024

function scenarioValidation(fields: Record<string, string>) {
  if (scenarioState.active().business.validationErrors) {
    throw new ApiFail(422, 'validation_error', 'Revise os campos destacados.', fields)
  }
}

const touchUser = (id: string, patch: Partial<ReturnType<typeof db.get>['users'][number]>) =>
  db.mutate((s) => {
    const u = s.users.find((x) => x.id === id)!
    Object.assign(u, patch, { updatedAt: new Date().toISOString(), version: u.version + 1 })
    return { ...u }
  })

export const accountHandlers = [
  /* ---------- Perfil ---------- */
  route('get', '/me/profile', ({ request }) => HttpResponse.json({ profile: toProfile(requireUser(request)) })),

  route('patch', '/me/profile', async ({ request }) => {
    const user = requireUser(request)
    const input = parse(UpdateProfileInput, await readJson(request))
    scenarioValidation({ username: 'Este nome de usuário é reservado' })
    const others = db.get().users.filter((u) => u.id !== user.id)
    if (others.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new ApiFail(409, 'email_taken', 'Este e-mail já está em uso.', { email: 'Este e-mail já está em uso por outra conta' })
    }
    if (others.some((u) => u.username === input.username)) {
      throw new ApiFail(409, 'username_taken', 'Este nome de usuário já está em uso.', { username: 'Este nome de usuário já está em uso' })
    }
    return HttpResponse.json({ profile: toProfile(touchUser(user.id, input)) })
  }),

  route('put', '/me/avatar', async ({ request }) => {
    const user = requireUser(request)
    const input = parse(UpdateAvatarInput, await readJson(request))
    const bytes = Math.ceil(((input.dataUrl.split(',')[1] ?? '').length * 3) / 4)
    if (bytes > MAX_AVATAR_BYTES) throw new ApiFail(422, 'validation_error', 'A imagem deve ter até 1 MB.', { avatar: 'A imagem deve ter até 1 MB' })
    return HttpResponse.json({ profile: toProfile(touchUser(user.id, { avatarUrl: input.dataUrl })) })
  }),

  route('delete', '/me/avatar', ({ request }) => {
    const user = requireUser(request)
    return HttpResponse.json({ profile: toProfile(touchUser(user.id, { avatarUrl: null })) })
  }),

  route('post', '/me/password', async ({ request }) => {
    const user = requireUser(request)
    const input = parse(ChangePasswordInput, await readJson(request))
    if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new ApiFail(422, 'validation_error', 'Senha atual incorreta.', { currentPassword: 'Senha atual incorreta' })
    }
    if (input.currentPassword === input.newPassword) {
      throw new ApiFail(422, 'validation_error', 'A nova senha deve ser diferente da atual.', { newPassword: 'A nova senha deve ser diferente da atual' })
    }
    touchUser(user.id, { passwordHash: await hashPassword(input.newPassword) })
    return new HttpResponse(null, { status: 204 })
  }),

  /* ---------- Carteiras ---------- */
  route('get', '/me/wallets', ({ request }) => {
    const user = requireUser(request)
    return HttpResponse.json(db.get().wallets[user.id] ?? { primary: null, secondary: null })
  }),

  route<{ slot: string }>('put', '/me/wallets/:slot', async ({ request, params }) => {
    const user = requireUser(request)
    const slot = WalletSlot.safeParse(params.slot)
    if (!slot.success) throw new ApiFail(404, 'not_found', 'Carteira não encontrada.')
    const input = parse(WalletInput, await readJson(request))
    scenarioValidation({ address: 'Endereço não reconhecido pela rede selecionada' })
    const other = db.get().wallets[user.id]?.[slot.data === 'primary' ? 'secondary' : 'primary']
    if (other && other.address.toLowerCase() === input.address.toLowerCase()) {
      throw new ApiFail(409, 'conflict', 'Este endereço já está cadastrado na outra carteira.', {
        address: 'Este endereço já está cadastrado na outra carteira',
      })
    }
    const wallet = db.mutate((s) => {
      const record = (s.wallets[user.id] ??= { primary: null, secondary: null })
      const next = { ...input, id: record[slot.data]?.id ?? `wal_${user.id}_${slot.data}`, slot: slot.data, updatedAt: new Date().toISOString() }
      record[slot.data] = next
      return next
    })
    return HttpResponse.json({ wallet })
  }),

  /* ---------- Conexão simulada de carteira ---------- */
  route('post', '/wallet-connections', async ({ request }) => {
    const user = requireUser(request)
    const input = parse(ConnectWalletInput, await readJson(request))
    const wallets = db.get().wallets[user.id]
    if (![wallets?.primary?.id, wallets?.secondary?.id].includes(input.walletId)) {
      throw new ApiFail(404, 'not_found', 'Carteira não encontrada.')
    }
    if (scenarioState.active().business.walletRejects) {
      throw new ApiFail(403, 'wallet_rejected', 'A conexão foi recusada na carteira.')
    }
    const connection = {
      id: db.nextId('con'),
      walletId: input.walletId,
      network: input.network,
      status: 'connected' as const,
      connectedAt: new Date().toISOString(),
    }
    db.mutate((s) => s.connections.push(connection))
    return HttpResponse.json({ connection }, { status: 201 })
  }),

  route<{ id: string }>('delete', '/wallet-connections/:id', ({ request, params }) => {
    requireUser(request)
    db.mutate((s) => s.connections.forEach((c) => c.id === params.id && (c.status = 'disconnected')))
    return new HttpResponse(null, { status: 204 })
  }),

  /* ---------- Favoritos ---------- */
  route('get', '/me/favorites', ({ request }) => {
    const user = requireUser(request)
    return HttpResponse.json({ nftIds: db.get().favorites[user.id] ?? [] })
  }),

  route<{ nftId: string }>('put', '/me/favorites/:nftId', ({ request, params }) => {
    const user = requireUser(request)
    findNft(params.nftId)
    db.mutate((s) => {
      const list = (s.favorites[user.id] ??= [])
      if (!list.includes(params.nftId)) list.push(params.nftId)
    })
    return new HttpResponse(null, { status: 204 })
  }),

  route<{ nftId: string }>('delete', '/me/favorites/:nftId', ({ request, params }) => {
    const user = requireUser(request)
    db.mutate((s) => {
      s.favorites[user.id] = (s.favorites[user.id] ?? []).filter((id) => id !== params.nftId)
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
