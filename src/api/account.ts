import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ProfileResponse,
  WalletConnectionResponse,
  WalletResponse,
  WalletsResponse,
  type ChangePasswordInput,
  type ConnectWalletInput,
  type Profile,
  type UpdateAvatarInput,
  type UpdateProfileInput,
  type WalletInput,
  type WalletSlot,
} from './contracts'
import { qk } from './query-keys'
import { http, request } from '@/lib/http'
import { sessionStore, useSessionSnapshot } from '@/features/session/session-store'

export const accountApi = {
  profile: (signal?: AbortSignal) => request(ProfileResponse, { url: '/me/profile', signal }).then((r) => r.profile),
  updateProfile: (input: UpdateProfileInput) =>
    request(ProfileResponse, { url: '/me/profile', method: 'PATCH', data: input }).then((r) => r.profile),
  updateAvatar: (input: UpdateAvatarInput) =>
    request(ProfileResponse, { url: '/me/avatar', method: 'PUT', data: input }).then((r) => r.profile),
  removeAvatar: () => request(ProfileResponse, { url: '/me/avatar', method: 'DELETE' }).then((r) => r.profile),
  changePassword: (input: ChangePasswordInput) => http.post('/me/password', input).then(() => undefined),

  wallets: (signal?: AbortSignal) => request(WalletsResponse, { url: '/me/wallets', signal }),
  saveWallet: (slot: WalletSlot, input: WalletInput) =>
    request(WalletResponse, { url: `/me/wallets/${slot}`, method: 'PUT', data: input }).then((r) => r.wallet),

  connectWallet: (input: ConnectWalletInput) =>
    request(WalletConnectionResponse, { url: '/wallet-connections', method: 'POST', data: input }).then((r) => r.connection),
  disconnectWallet: (connectionId: string) => http.delete(`/wallet-connections/${encodeURIComponent(connectionId)}`).then(() => undefined),
}

export const profileQuery = (userId: string) =>
  queryOptions({ queryKey: qk.profile(userId), queryFn: ({ signal }) => accountApi.profile(signal), staleTime: 60_000 })

export const walletsQuery = (userId: string) =>
  queryOptions({ queryKey: qk.wallets(userId), queryFn: ({ signal }) => accountApi.wallets(signal), staleTime: 60_000 })

function usePrivateUserId() {
  const snapshot = useSessionSnapshot()
  return snapshot.status === 'authenticated' ? snapshot.user.id : null
}

export function useProfile() {
  const userId = usePrivateUserId()
  return useQuery({ ...profileQuery(userId ?? 'anonymous'), enabled: Boolean(userId) })
}

export function useWallets() {
  const userId = usePrivateUserId()
  return useQuery({ ...walletsQuery(userId ?? 'anonymous'), enabled: Boolean(userId) })
}

function rememberProfile(profile: Profile) {
  const snap = sessionStore.get()
  if (snap.status === 'authenticated') {
    sessionStore.updateUser({
      ...snap.user,
      displayName: profile.displayName,
      username: profile.username,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
    })
  }
  return profile
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const userId = usePrivateUserId()
  return useMutation({
    mutationFn: accountApi.updateProfile,
    onSuccess: (profile) => {
      rememberProfile(profile)
      if (userId) queryClient.setQueryData(qk.profile(userId), profile)
    },
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  const userId = usePrivateUserId()
  return useMutation({
    mutationFn: accountApi.updateAvatar,
    onSuccess: (profile) => {
      rememberProfile(profile)
      if (userId) queryClient.setQueryData(qk.profile(userId), profile)
    },
  })
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient()
  const userId = usePrivateUserId()
  return useMutation({
    mutationFn: accountApi.removeAvatar,
    onSuccess: (profile) => {
      rememberProfile(profile)
      if (userId) queryClient.setQueryData(qk.profile(userId), profile)
    },
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: accountApi.changePassword })
}

export function useSaveWallet() {
  const queryClient = useQueryClient()
  const userId = usePrivateUserId()
  return useMutation({
    mutationFn: ({ slot, input }: { slot: WalletSlot; input: WalletInput }) => accountApi.saveWallet(slot, input),
    onSuccess: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: qk.wallets(userId) })
    },
  })
}
