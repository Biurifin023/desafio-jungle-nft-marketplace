import type { Cart, CartItem, Nft, NftSummary, Profile, User } from '@/api/contracts'
import { db } from '../db/store'
import type { CartRecord, NftRecord, UserRecord } from '../db/schema'

export const defaultEdition = (nft: NftRecord) => nft.editions.find((e) => e.id === nft.defaultEditionId) ?? nft.editions[0]!

export const totalAvailable = (nft: NftRecord) => nft.editions.reduce((acc, e) => acc + e.available, 0)

export function toSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    tokenId: nft.tokenId,
    name: nft.name,
    collection: nft.collection,
    category: nft.category,
    network: nft.network,
    image: nft.image,
    priceEth: defaultEdition(nft).priceEth,
    compareAtPriceEth: nft.compareAtPriceEth,
    badge: nft.badge,
    available: totalAvailable(nft),
    listedAt: nft.listedAt,
    version: nft.version,
  }
}

export function toNft(nft: NftRecord): Nft {
  return {
    ...toSummary(nft),
    description: nft.description,
    story: nft.story,
    creator: nft.creator,
    gallery: nft.gallery,
    editions: nft.editions,
    defaultEditionId: nft.defaultEditionId,
    attributes: nft.attributes,
    rating: nft.rating,
    contract: nft.contract,
    networkInfo: nft.networkInfo,
  }
}

export function toUser(u: UserRecord): User {
  return { id: u.id, email: u.email, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl }
}

export function toProfile(u: UserRecord): Profile {
  return {
    id: u.id,
    displayName: u.displayName,
    username: u.username,
    email: u.email,
    ensName: u.ensName,
    walletNickname: u.walletNickname,
    avatarUrl: u.avatarUrl,
    updatedAt: u.updatedAt,
    version: u.version,
  }
}

/** O carrinho sempre devolve preço e disponibilidade atuais do catálogo. */
export function toCart(cart: CartRecord): Cart {
  const items: CartItem[] = []
  for (const item of cart.items) {
    const nft = db.get().nfts.find((n) => n.id === item.nftId)
    const edition = nft?.editions.find((e) => e.id === item.editionId)
    if (!nft || !edition) continue
    items.push({
      id: `${item.nftId}:${item.editionId}`,
      nftId: nft.id,
      editionId: edition.id,
      editionLabel: edition.label,
      name: nft.name,
      tokenId: nft.tokenId,
      image: nft.image,
      quantity: item.quantity,
      unitPriceEth: edition.priceEth,
      available: edition.available,
      maxPerOrder: edition.maxPerOrder,
      nftVersion: nft.version,
    })
  }
  return { id: cart.id, owner: cart.owner, items, couponCode: cart.couponCode, version: cart.version, updatedAt: cart.updatedAt }
}
