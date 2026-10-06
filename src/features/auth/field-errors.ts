import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { isApiError } from '@/lib/http'

/** Propaga `error.fields` da API para o formulário (mensagens ligadas via aria-describedby). */
export function applyApiFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  setFormError: (message: string) => void,
) {
  if (!isApiError(error)) {
    setFormError('Não foi possível concluir. Tente de novo.')
    return
  }
  const entries = Object.entries(error.fields)
  if (entries.length === 0) {
    setFormError(error.message)
    return
  }
  for (const [name, message] of entries) {
    setError(name as Path<T>, { type: 'server', message })
  }
}
