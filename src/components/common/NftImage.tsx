import type { ImageRef } from '@/api/contracts'
import { imageSrc, imageSrcSet } from '@/lib/images'
import { cn } from '@/lib/utils'

/**
 * Arte do NFT com srcset WebP e dimensões intrínsecas (sem CLS).
 * `priority` para a imagem LCP (hero/detalhe): carregamento imediato e fetchpriority alto.
 */
export function NftImage({
  image,
  sizes,
  className,
  priority = false,
  decorative = false,
}: {
  image: ImageRef
  sizes: string
  className?: string
  priority?: boolean
  decorative?: boolean
}) {
  return (
    <img
      src={imageSrc(image, 640)}
      srcSet={imageSrcSet(image)}
      sizes={sizes}
      width={640}
      height={640}
      alt={decorative ? '' : image.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      className={cn('aspect-square h-auto w-full object-cover', className)}
    />
  )
}
