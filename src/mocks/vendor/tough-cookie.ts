/**
 * Substituto do `tough-cookie` para o cookie store interno do MSW (ver `vite.config.ts`).
 * A API simulada autentica por Bearer token e nenhum handler define `Set-Cookie`, então o jar
 * fica sempre vazio. Isso tira `tough-cookie` + `tldts` (~260 KB de fonte) do bundle da demo.
 * Se algum handler passar a usar cookies, remova o alias.
 */
export type SerializedCookie = Record<string, unknown>
export type MemoryCookieStoreIndex = Record<string, Record<string, Record<string, Cookie>>>

export class Cookie {
  key = ''
  value = ''
  domain: string | null = null
  path: string | null = null

  static fromJSON(): Cookie | null {
    return null
  }

  toJSON(): SerializedCookie {
    return {}
  }

  toString() {
    return ''
  }
}

export class MemoryCookieStore {
  idx: MemoryCookieStoreIndex = {}
}

export class CookieJar {
  constructor(public store?: MemoryCookieStore) {}

  getCookiesSync(): Cookie[] {
    return []
  }

  async setCookie(): Promise<void> {}
}
