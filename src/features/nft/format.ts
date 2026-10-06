import type { Edition } from '@/api/contracts'

export function shortAddress(address: string) {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function editionLimit(edition: Edition) {
  return Math.min(edition.available, edition.maxPerOrder)
}

export function isEditionSoldOut(edition: Edition) {
  return edition.available <= 0
}
