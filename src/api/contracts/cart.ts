import { z } from 'zod'
import { EthAmount, ImageRef, IsoDate } from './common'

export const CartItem = z.object({
  /** `${nftId}:${editionId}` */
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  editionLabel: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: ImageRef,
  quantity: z.number().int().positive(),
  unitPriceEth: EthAmount,
  /** Disponibilidade atual da edição (para limitar a quantidade). */
  available: z.number().int().min(0),
  maxPerOrder: z.number().int().positive(),
  /** Versão do NFT quando o item foi lido (para ignorar eventos antigos). */
  nftVersion: z.number().int(),
})
export type CartItem = z.infer<typeof CartItem>

export const Cart = z.object({
  id: z.string(),
  owner: z.discriminatedUnion('type', [
    z.object({ type: z.literal('guest') }),
    z.object({ type: z.literal('user'), userId: z.string() }),
  ]),
  items: z.array(CartItem),
  couponCode: z.string().nullable(),
  version: z.number().int(),
  updatedAt: IsoDate,
})
export type Cart = z.infer<typeof Cart>

export const CartResponse = z.object({ cart: Cart })

export const AddCartItemInput = z.object({
  nftId: z.string(),
  editionId: z.string(),
  quantity: z.number().int().positive(),
})
export type AddCartItemInput = z.infer<typeof AddCartItemInput>

export const UpdateCartItemInput = z.object({ quantity: z.number().int().positive() })
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemInput>

export const ApplyCouponInput = z.object({ code: z.string().trim().min(1, 'Informe um código').max(32) })
export type ApplyCouponInput = z.infer<typeof ApplyCouponInput>

export const MergeCartInput = z.object({ guestCartId: z.string() })
export type MergeCartInput = z.infer<typeof MergeCartInput>
