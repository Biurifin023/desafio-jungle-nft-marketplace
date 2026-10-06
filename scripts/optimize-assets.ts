/**
 * Gera variantes WebP responsivas das artes exportadas do Figma (public/assets/figma/*.png).
 * Saída: public/assets/nfts/<nome>-<largura>.webp
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'public/assets/figma')
const OUT = path.join(ROOT, 'public/assets/nfts')

/** imageRef do Figma -> nome da arte (identificado visualmente nos frames). */
export const ARTWORKS: Record<string, string> = {
  '8459204731e6eba9d474cbc8ebc37071360d3ba5': 'emerald-ape',
  '2986a7cb16d09de8970824d2dd58bf0bb021702c': 'violet-nomad',
  '9df2ff42dd27ba657621c304557d1a855a4be6a5': 'ivory-baron',
  '87580f2def9af0ce13f4b6f6ce17bb2449bcfc16': 'golden-beat',
}

const WIDTHS = [160, 320, 640, 960]

await mkdir(OUT, { recursive: true })
for (const [ref, name] of Object.entries(ARTWORKS)) {
  const input = path.join(SRC, `${ref}.png`)
  for (const width of WIDTHS) {
    await sharp(input)
      .resize({ width, height: width, fit: 'cover' })
      .webp({ quality: width <= 320 ? 72 : 78 })
      .toFile(path.join(OUT, `${name}-${width}.webp`))
  }
  console.log(`ok ${name}`)
}
