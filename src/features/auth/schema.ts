import { z } from 'zod'
import { RegisterInput } from '@/api/contracts'

export const RegisterFormInput = RegisterInput.extend({
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
export type RegisterFormInput = z.infer<typeof RegisterFormInput>

export function toRegisterPayload(data: RegisterFormInput) {
  const { confirmPassword: _confirm, ...payload } = data
  return payload
}
