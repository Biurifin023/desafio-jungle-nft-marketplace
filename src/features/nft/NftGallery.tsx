import { useState } from 'react'
import type { ImageRef } from '@/api/contracts'
import { NftImage } from '@/components/common/NftImage'
import { SearchIcon } from '@/components/icons'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function NftGallery({ images, name }: { images: ImageRef[]; name: string }) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)
  const current = images[active] ?? images[0]!

  return (
    <div className="flex items-center gap-7" data-testid="nft-gallery">
      <ul className="flex w-[100px] shrink-0 flex-col gap-4">
        {images.slice(0, 4).map((image, index) => {
          const selected = index === active
          return (
            <li key={`${image.base}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Ver imagem ${index + 1} de ${name}`}
                aria-current={selected ? 'true' : undefined}
                className={cn(
                  'size-[100px] cursor-pointer overflow-hidden rounded-lg border-[3px] bg-surface transition-colors',
                  selected ? 'border-copper' : 'border-transparent hover:border-copper/50',
                )}
              >
                <NftImage image={image} sizes="100px" decorative className="size-full" />
              </button>
            </li>
          )
        })}
      </ul>
      <div className="relative size-[444px] shrink-0 rounded-md bg-surface p-4">
        <NftImage image={current} sizes="404px" priority className="size-[404px] rounded-3xl" />
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label={`Ampliar imagem de ${name}`}
          className="absolute top-4 right-4 grid size-[30px] place-items-center rounded-full border border-border bg-surface-2 text-cream"
        >
          <SearchIcon aria-hidden className="size-5" />
        </button>
      </div>
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-[min(90vw,640px)]">
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>Imagem ampliada do colecionável.</DialogDescription>
          </DialogHeader>
          <NftImage image={current} sizes="640px" priority className="w-full rounded-3xl" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
