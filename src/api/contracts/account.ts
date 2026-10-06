import { z } from 'zod'
import { IsoDate, Network, WalletProvider } from './common'
import { USERNAME_PATTERN } from './session'

export const Profile = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.email(),
  ensName: z.string(),
  walletNickname: z.string(),
  avatarUrl: z.string().nullable(),
  updatedAt: IsoDate,
  version: z.number().int(),
})
export type Profile = z.infer<typeof Profile>

export const ProfileResponse = z.object({ profile: Profile })

export const UpdateProfileInput = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição').max(60, 'Máximo de 60 caracteres'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_PATTERN, 'Use 3 a 24 caracteres: letras minúsculas, números, "." ou "_"'),
  email: z.email('Informe um e-mail válido'),
  ensName: z.string().trim().regex(/^[a-z0-9-]{3,32}$/, 'Use 3 a 32 caracteres: letras minúsculas, números ou "-"'),
  walletNickname: z.string().trim().min(2, 'Informe o apelido da carteira').max(40),
})
export type UpdateProfileInput = z.infer<typeof UpdateProfileInput>

/** Avatar enviado como data URL (PNG/JPEG/WebP, até 1 MB). */
export const UpdateAvatarInput = z.object({
  dataUrl: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/, 'Envie uma imagem PNG, JPEG ou WebP'),
})
export type UpdateAvatarInput = z.infer<typeof UpdateAvatarInput>

export const ChangePasswordInput = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z
    .string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres')
    .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra')
    .regex(/\d/, 'Inclua pelo menos um número'),
})
export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>

export const WalletSlot = z.enum(['primary', 'secondary'])
export type WalletSlot = z.infer<typeof WalletSlot>

export const WalletInput = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição').max(60),
  nickname: z.string().trim().min(2, 'Informe o apelido da carteira').max(40),
  network: Network,
  profileName: z.string().trim().min(2, 'Informe o nome do perfil').max(60),
  address: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço deve ter o formato 0x seguido de 40 caracteres hexadecimais'),
  secondaryAddress: z.string().trim().max(64).optional(),
  provider: WalletProvider,
  referralCode: z.string().trim().min(3, 'Informe o código de indicação').max(20),
  email: z.email('Informe um e-mail válido'),
  ensName: z.string().trim().regex(/^[a-z0-9-]{3,32}$/, 'Use 3 a 32 caracteres: letras minúsculas, números ou "-"'),
})
export type WalletInput = z.infer<typeof WalletInput>

export const Wallet = WalletInput.extend({
  id: z.string(),
  slot: WalletSlot,
  updatedAt: IsoDate,
})
export type Wallet = z.infer<typeof Wallet>

export const WalletsResponse = z.object({
  primary: Wallet.nullable(),
  secondary: Wallet.nullable(),
})
export type WalletsResponse = z.infer<typeof WalletsResponse>

export const WalletResponse = z.object({ wallet: Wallet })

/** Conexão simulada de carteira no checkout. */
export const WalletConnection = z.object({
  id: z.string(),
  walletId: z.string(),
  network: Network,
  status: z.enum(['connected', 'disconnected']),
  connectedAt: IsoDate,
})
export type WalletConnection = z.infer<typeof WalletConnection>

export const ConnectWalletInput = z.object({ walletId: z.string(), network: Network })
export type ConnectWalletInput = z.infer<typeof ConnectWalletInput>

export const WalletConnectionResponse = z.object({ connection: WalletConnection })

export const FavoritesResponse = z.object({ nftIds: z.array(z.string()) })
export type FavoritesResponse = z.infer<typeof FavoritesResponse>
