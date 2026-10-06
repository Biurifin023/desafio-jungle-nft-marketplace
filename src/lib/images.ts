import type { ImageRef } from '@/api/contracts'

export const IMAGE_WIDTHS = [160, 320, 640, 960] as const

export const imageSrc = (image: ImageRef, width: (typeof IMAGE_WIDTHS)[number] = 640) => `${image.base}-${width}.webp`

export const imageSrcSet = (image: ImageRef) => IMAGE_WIDTHS.map((w) => `${image.base}-${w}.webp ${w}w`).join(', ')
