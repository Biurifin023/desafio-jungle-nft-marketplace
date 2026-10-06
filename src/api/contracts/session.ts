import { z } from 'zod'
import { IsoDate } from './common'

export const User = z.object({
  id: z.string(),
  email: z.email(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
})
export type User = z.infer<typeof User>

export const SessionResponse = z.object({
  token: z.string(),
  expiresAt: IsoDate,
  user: User,
})
export type SessionResponse = z.infer<typeof SessionResponse>

export const CurrentSessionResponse = z.object({
  expiresAt: IsoDate,
  user: User,
})
export type CurrentSessionResponse = z.infer<typeof CurrentSessionResponse>

export const LoginInput = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
})
export type LoginInput = z.infer<typeof LoginInput>

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/

export const RegisterInput = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_PATTERN, 'Use 3 a 24 caracteres: letras minúsculas, números, "." ou "_"'),
  email: z.email('Informe um e-mail válido'),
  password: z
    .string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres')
    .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra')
    .regex(/\d/, 'Inclua pelo menos um número'),
})
export type RegisterInput = z.infer<typeof RegisterInput>
