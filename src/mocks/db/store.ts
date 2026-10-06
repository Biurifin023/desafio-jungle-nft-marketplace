import { buildInitialState } from './fixtures'
import type { DbState } from './schema'

/**
 * "Banco" dos mocks. Fica em memória e é persistido no localStorage a cada mutação
 * para sobreviver a refresh. `resetDb()` restaura integralmente as fixtures.
 */
const DB_KEY = 'kurio.mock.db'
const SCHEMA_VERSION = 1

let state: DbState = load()

function load(): DbState {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DbState
      if (parsed.schemaVersion === SCHEMA_VERSION) return parsed
    }
  } catch {
    /* estado corrompido: volta às fixtures */
  }
  return buildInitialState()
}

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state))
  } catch {
    /* quota excedida: segue em memória */
  }
}

export const db = {
  get: (): Readonly<DbState> => state,
  /** Única forma de alterar o estado; persiste ao final. */
  mutate<T>(fn: (draft: DbState) => T): T {
    const result = fn(state)
    persist()
    return result
  },
  nextId(prefix: string) {
    return db.mutate((s) => `${prefix}_${++s.seq}`)
  },
  reset() {
    state = buildInitialState()
    persist()
  },
  /** Recarrega do storage (ex.: outra aba alterou). */
  reload() {
    state = load()
  },
}

export const MOCK_DB_KEY = DB_KEY
