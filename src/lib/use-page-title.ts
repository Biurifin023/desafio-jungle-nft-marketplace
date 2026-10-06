import { useEffect } from 'react'

const SUFFIX = 'Kurio — Marketplace de NFTs'

/** Atualiza <title> e a meta description por rota (SEO/Lighthouse e leitores de tela). */
export function usePageTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SUFFIX}` : SUFFIX
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}
