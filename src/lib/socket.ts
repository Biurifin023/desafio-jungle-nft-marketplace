/**
 * Cliente Socket.IO. A Etapa 7 registra a conexão real.
 * Logout e troca de usuário já chamam `disconnectSocket` para isolar sessões.
 */

type Listener = () => void
const listeners = new Set<Listener>()

export function connectSocket() {
  listeners.forEach((l) => l())
}

export function disconnectSocket() {
  listeners.forEach((l) => l())
}

export function onSocketLifecycle(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
